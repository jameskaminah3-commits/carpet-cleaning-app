import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID, randomInt } from "crypto";
import { loginSchema, verifyOtpSchema, ORDER_STATUSES, orders, mpesaTransactions } from "@shared/schema";
import { initiateSTKPush, extractCallbackMetadata, type STKCallbackBody } from "./mpesa";

const paramId = (req: Request) => req.params.id as string;

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("session_token="))
    ?.split("=")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const session = await storage.getSessionByToken(token);
  if (!session) {
    return res.status(401).json({ message: "Session expired" });
  }

  req.userId = session.userId;
  next();
}

async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
  const user = await storage.getUser(req.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

async function techMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
  const user = await storage.getUser(req.userId);
  if (!user || user.role !== "technician") {
    return res.status(403).json({ message: "Technician access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await storage.seedData();

  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid phone number. Use Kenyan format (e.g., 0712345678)" });
      }

      const phone = parsed.data.phone;
      let user = await storage.getUserByPhone(phone);

      if (!user) {
        user = await storage.createUser({
          phone,
          name: "New Customer",
          role: "customer",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Account has been deactivated. Contact support." });
      }

      const otp = String(randomInt(100000, 999999));
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      await storage.updateUserOtp(user.id, otp, expiry);

      res.json({ success: true, otp });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const { phone, otp } = parsed.data;
      const user = await storage.getUserByPhone(phone);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.otpCode !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (user.otpExpiry && new Date() > user.otpExpiry) {
        return res.status(400).json({ message: "OTP expired" });
      }

      await storage.clearUserOtp(user.id);

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await storage.createSession(user.id, token, expiresAt);

      res.setHeader("Set-Cookie", `session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
      res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, phone: user.phone, email: user.email, tag: user.tag } });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const user = await storage.getUser(req.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      id: user.id, name: user.name, role: user.role, phone: user.phone, email: user.email,
      tag: user.tag, lifetimeValue: user.lifetimeValue, totalOrders: user.totalOrders,
      profilePhoto: user.profilePhoto, isActive: user.isActive,
    });
  });

  app.patch("/api/auth/profile", authMiddleware, async (req, res) => {
    try {
      const { name, email } = req.body;
      if (!name && !email) return res.status(400).json({ message: "Provide name or email to update" });
      const updates: any = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      const user = await storage.updateUserProfile(req.userId!, updates);
      res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, tag: user.tag });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req, res) => {
    const token = req.headers.cookie
      ?.split(";")
      .find((c) => c.trim().startsWith("session_token="))
      ?.split("=")[1];
    if (token) await storage.deleteSession(token);
    res.setHeader("Set-Cookie", "session_token=; Path=/; HttpOnly; Max-Age=0");
    res.json({ success: true });
  });

  app.get("/api/pricing", async (_req, res) => {
    const rules = await storage.getPricingRules();
    res.json(rules);
  });

  app.get("/api/delivery-zones", async (_req, res) => {
    const zones = await storage.getDeliveryZones();
    res.json(zones);
  });

  app.post("/api/orders", authMiddleware, async (req, res) => {
    try {
      const { items, deliveryZoneId, pickupAddress, locationName, notes, totalAmount, promotionId, discountAmount, pickupFee, deliveryFee, expressFee } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "At least one carpet item is required" });
      }

      for (const item of items) {
        if (!item.carpetType || !item.width || !item.length || item.width <= 0 || item.length <= 0) {
          return res.status(400).json({ message: "Each carpet item must have valid type, width, and length" });
        }
      }

      const pricingRulesSnapshot = await storage.getPricingRules();

      let serverItemsTotal = 0;
      for (const item of items) {
        const rule = pricingRulesSnapshot.find(r => r.carpetType === item.carpetType && r.isActive);
        const price = rule ? parseFloat(rule.pricePerSqMeter) : 0;
        const area = (parseFloat(item.width) || 0) * (parseFloat(item.length) || 0);
        serverItemsTotal += area * price * (item.quantity || 1);
      }

      let zone = null;
      let serverDeliveryFee = 0;
      if (deliveryZoneId) {
        const zones = await storage.getDeliveryZones();
        zone = zones.find(z => z.id === deliveryZoneId);
        serverDeliveryFee = zone ? parseFloat(zone.fee) : 0;
      }

      let serverDiscount = 0;
      let validPromoId = null;
      if (promotionId) {
        const user = await storage.getUser(req.userId!);
        const allPromos = await storage.getPromotions();
        const promo = allPromos.find(p => p.id === promotionId);
        if (promo && promo.isActive) {
          if (promo.isVipOnly && user?.tag !== "VIP") {
            return res.status(400).json({ message: "This promotion is for VIP customers only" });
          }
          if ((promo.minOrders ?? 0) > 0 && (user?.totalOrders ?? 0) < (promo.minOrders ?? 0)) {
            return res.status(400).json({ message: `You need at least ${promo.minOrders} orders to use this promotion` });
          }
          if (promo.targetTag && user?.tag !== promo.targetTag) {
            return res.status(400).json({ message: `This promotion is for ${promo.targetTag} customers only` });
          }
          validPromoId = promo.id;
          if (promo.promoType === "percentage" && promo.discountValue) {
            serverDiscount = Math.round(serverItemsTotal * parseFloat(promo.discountValue) / 100);
          } else if (promo.promoType === "fixed" && promo.discountValue) {
            serverDiscount = Math.min(parseFloat(promo.discountValue), serverItemsTotal);
          } else if (promo.promoType === "free_pickup" || promo.promoType === "free_delivery") {
            serverDiscount = serverDeliveryFee;
          }
        }
      }

      const serverTotal = Math.max(0, serverItemsTotal + serverDeliveryFee - serverDiscount);

      const order = await storage.createOrder({
        customerId: req.userId!,
        status: "PENDING",
        totalAmount: String(serverTotal),
        depositPaid: "0",
        balanceDue: String(serverTotal),
        isLocked: false,
        deliveryZoneId: deliveryZoneId || null,
        pickupAddress: pickupAddress || null,
        locationName: locationName || null,
        notes: notes || null,
        locationLat: null,
        locationLng: null,
        technicianId: null,
        pricingSnapshot: { rules: pricingRulesSnapshot, timestamp: new Date().toISOString() },
        promotionId: validPromoId,
        discountAmount: String(serverDiscount),
        pickupFee: String(pickupFee || 0),
        deliveryFee: String(serverDeliveryFee),
        expressFee: String(expressFee || 0),
      });

      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          carpetType: item.carpetType,
          width: String(item.width),
          length: String(item.length),
          quantity: item.quantity || 1,
          unitPrice: String(item.unitPrice),
          subtotal: String(item.subtotal),
          description: item.description || null,
        });
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/orders/my", authMiddleware, async (req, res) => {
    const myOrders = await storage.getOrdersByCustomer(req.userId!);
    const result = [];
    for (const order of myOrders) {
      const items = await storage.getOrderItems(order.id);
      result.push({ ...order, items });
    }
    res.json(result);
  });

  app.get("/api/orders/:id", authMiddleware, async (req, res) => {
    const order = await storage.getOrder(paramId(req));
    if (!order) return res.status(404).json({ message: "Order not found" });
    const user = await storage.getUser(req.userId!);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.role === "customer" && order.customerId !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const items = await storage.getOrderItems(order.id);
    res.json({ ...order, items });
  });

  app.get("/api/saved-addresses", authMiddleware, async (req, res) => {
    const addresses = await storage.getSavedAddresses(req.userId!);
    res.json(addresses);
  });

  app.post("/api/saved-addresses", authMiddleware, async (req, res) => {
    try {
      const { label, address } = req.body;
      if (!label || !address) return res.status(400).json({ message: "Label and address are required" });
      const saved = await storage.createSavedAddress({ userId: req.userId!, label, address, isDefault: false });
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/saved-addresses/:id", authMiddleware, async (req, res) => {
    await storage.deleteSavedAddress(paramId(req));
    res.json({ success: true });
  });

  app.get("/api/promotions/my", authMiddleware, async (req, res) => {
    const promos = await storage.getPromotionsForUser(req.userId!);
    res.json(promos);
  });

  app.post("/api/promotions/validate", authMiddleware, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "Coupon code required" });
      const promo = await storage.getPromotionByCode(code);
      if (!promo || !promo.isActive) return res.status(404).json({ message: "Invalid or expired coupon" });
      if (promo.expiresAt && new Date() > promo.expiresAt) return res.status(400).json({ message: "Coupon expired" });
      if (promo.isVipOnly) {
        const user = await storage.getUser(req.userId!);
        if (!user || user.tag !== "VIP") return res.status(403).json({ message: "This coupon is for VIP customers only" });
      }
      res.json(promo);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin routes
  app.get("/api/admin/orders", authMiddleware, adminMiddleware, async (_req, res) => {
    const allOrders = await storage.getAllOrders();
    res.json(allOrders);
  });

  app.get("/api/admin/stats", authMiddleware, adminMiddleware, async (_req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  app.patch("/api/admin/orders/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validStatuses = ["PENDING", "AWAITING_PICKUP", "IN_CLEANING", "DRYING", "READY", "COMPLETED"];
      if (!req.body.status || !validStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      const order = await storage.getOrder(paramId(req));
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (req.body.status === "IN_CLEANING" && parseFloat(order.balanceDue) > 0) {
        return res.status(400).json({ message: `Cannot start cleaning — customer has outstanding balance of KES ${parseFloat(order.balanceDue).toLocaleString()}. Payment must be cleared first.` });
      }
      await storage.updateOrderStatus(paramId(req), req.body.status);
      const statusInfo = ORDER_STATUSES.find(s => s.value === req.body.status);
      const statusLabel = statusInfo?.label || req.body.status;
      await storage.createNotification({
        userId: order.customerId,
        type: "order_status",
        title: statusLabel,
        message: `Your order status has been updated to ${statusLabel}`,
        orderId: order.id,
        amount: null,
        isRead: false,
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/orders/:id/lock", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      if (typeof req.body.isLocked !== "boolean") {
        return res.status(400).json({ message: "isLocked must be a boolean" });
      }
      const order = await storage.getOrder(paramId(req));
      if (!order) return res.status(404).json({ message: "Order not found" });
      await storage.updateOrderLock(paramId(req), req.body.isLocked);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/orders/:id/price", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const amount = parseFloat(req.body.totalAmount);
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ message: "totalAmount must be a valid positive number" });
      }
      const order = await storage.getOrder(paramId(req));
      if (!order) return res.status(404).json({ message: "Order not found" });
      const updatedOrder = await storage.updateOrderPrice(paramId(req), String(amount));
      await storage.createNotification({
        userId: order.customerId,
        type: "payment_request",
        title: "Price Updated",
        message: `Your order price has been adjusted. New balance: KES ${updatedOrder.balanceDue}`,
        orderId: order.id,
        amount: updatedOrder.balanceDue,
        isRead: false,
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/pricing", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { name, carpetType, pricePerSqMeter } = req.body;
      if (!name || !carpetType || !pricePerSqMeter || parseFloat(pricePerSqMeter) <= 0) {
        return res.status(400).json({ message: "Name, carpet type, and valid price are required" });
      }
      const rule = await storage.createPricingRule(req.body);
      res.json(rule);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/pricing/:id", authMiddleware, adminMiddleware, async (req, res) => {
    await storage.deletePricingRule(paramId(req));
    res.json({ success: true });
  });

  app.post("/api/admin/delivery-zones", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { name, fee } = req.body;
      if (!name || !fee || parseFloat(fee) < 0) {
        return res.status(400).json({ message: "Name and valid fee are required" });
      }
      const zone = await storage.createDeliveryZone(req.body);
      res.json(zone);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/delivery-zones/:id", authMiddleware, adminMiddleware, async (req, res) => {
    await storage.deleteDeliveryZone(paramId(req));
    res.json({ success: true });
  });

  // Admin - Users management
  app.get("/api/admin/users", authMiddleware, adminMiddleware, async (_req, res) => {
    const customers = await storage.getAllCustomers();
    res.json(customers);
  });

  app.patch("/api/admin/users/:id/tag", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validTags = ["VIP", "Frequent", "Corporate", "One-time", null];
      if (!validTags.includes(req.body.tag)) {
        return res.status(400).json({ message: "Invalid tag" });
      }
      await storage.updateUserTag(paramId(req), req.body.tag);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/users/:id/active", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      if (typeof req.body.isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      await storage.updateUserActive(paramId(req), req.body.isActive);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin - Deliveries management
  app.get("/api/admin/deliveries", authMiddleware, adminMiddleware, async (_req, res) => {
    const allDeliveries = await storage.getDeliveries();
    res.json(allDeliveries);
  });

  app.post("/api/admin/deliveries", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { orderId, technicianId, deliveryType, scheduledDate, scheduledTimeWindow } = req.body;
      if (!orderId || !deliveryType) return res.status(400).json({ message: "Order and delivery type required" });
      const delivery = await storage.createDelivery({
        orderId,
        technicianId: technicianId || null,
        deliveryType,
        status: "scheduled",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        scheduledTimeWindow: scheduledTimeWindow || null,
        completedAt: null,
        failureReason: null,
        notes: req.body.notes || null,
      });
      res.json(delivery);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/deliveries/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validStatuses = ["scheduled", "in_transit", "completed", "failed"];
      if (!req.body.status || !validStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid delivery status" });
      }
      await storage.updateDeliveryStatus(paramId(req), req.body.status);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/deliveries/:id/assign", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      if (!req.body.technicianId) return res.status(400).json({ message: "Technician ID required" });
      await storage.updateDeliveryTechnician(paramId(req), req.body.technicianId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/deliveries/:id/reschedule", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { scheduledDate, scheduledTimeWindow } = req.body;
      if (!scheduledDate || !scheduledTimeWindow) return res.status(400).json({ message: "Date and time window required" });
      await storage.rescheduleDelivery(paramId(req), new Date(scheduledDate), scheduledTimeWindow);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin - Promotions management
  app.get("/api/admin/promotions", authMiddleware, adminMiddleware, async (_req, res) => {
    const promos = await storage.getPromotions();
    res.json(promos);
  });

  app.post("/api/admin/promotions", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { name, promoType, appliesTo } = req.body;
      if (!name || !promoType) return res.status(400).json({ message: "Name and promo type required" });
      const promo = await storage.createPromotion({
        name,
        description: req.body.description || null,
        promoType,
        appliesTo: appliesTo || "order",
        discountValue: req.body.discountValue || null,
        couponCode: req.body.couponCode || null,
        isVipOnly: req.body.isVipOnly || false,
        isSingleUse: req.body.isSingleUse || false,
        isActive: true,
        freePickupThreshold: req.body.freePickupThreshold || null,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
        targetUserId: req.body.targetUserId || null,
        minOrders: req.body.minOrders || 0,
        targetTag: req.body.targetTag || null,
      });
      res.json(promo);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/promotions/:id", authMiddleware, adminMiddleware, async (req, res) => {
    await storage.deletePromotion(paramId(req));
    res.json({ success: true });
  });

  // Notification routes
  app.get("/api/notifications", authMiddleware, async (req, res) => {
    try {
      const notifs = await storage.getNotificationsForUser(req.userId!);
      res.json(notifs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/notifications/unread-count", authMiddleware, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.userId!);
      res.json({ count });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/notifications/:id/read", authMiddleware, async (req, res) => {
    try {
      await storage.markNotificationRead(paramId(req));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/payments/stk-push", authMiddleware, async (req, res) => {
    try {
      const { orderId, phone } = req.body;
      if (!orderId || !phone) return res.status(400).json({ message: "orderId and phone are required" });
      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.customerId !== req.userId) return res.status(403).json({ message: "Access denied" });

      const amount = parseFloat(order.balanceDue) > 0 ? parseFloat(order.balanceDue) : parseFloat(order.totalAmount);
      if (amount <= 0) return res.status(400).json({ message: "No balance due" });

      const pendingTxns = await storage.getMpesaTransactionsByOrder(order.id);
      const hasPending = pendingTxns.some(t => t.status === "pending");
      if (hasPending) return res.status(409).json({ message: "A payment is already being processed for this order. Please wait or try again shortly." });

      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const callbackUrl = process.env.MPESA_CALLBACK_URL || `${protocol}://${host}/api/mpesa/stk-callback`;

      const stkResponse = await initiateSTKPush(
        phone,
        amount,
        `ORDER-${order.id.slice(0, 8).toUpperCase()}`,
        "Sparkle n Glee Carpet Cleaning Payment",
        callbackUrl
      );

      const transaction = await storage.createMpesaTransaction({
        orderId: order.id,
        phone,
        amount: String(amount),
        merchantRequestId: stkResponse.MerchantRequestID,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status: "pending",
      });

      res.json({
        success: true,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        transactionId: transaction.id,
        customerMessage: stkResponse.CustomerMessage,
      });
    } catch (err: any) {
      console.error("[M-Pesa] STK Push error:", err.message);
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/mpesa/stk-callback", async (req, res) => {
    try {
      const callbackData = req.body as STKCallbackBody;
      if (!callbackData?.Body?.stkCallback?.CheckoutRequestID || typeof callbackData.Body.stkCallback.ResultCode !== "number") {
        console.error("[M-Pesa Callback] Invalid callback payload structure");
        return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid payload" });
      }
      const stkCallback = callbackData.Body.stkCallback;

      console.log(`[M-Pesa Callback] CheckoutRequestID: ${stkCallback.CheckoutRequestID}, ResultCode: ${stkCallback.ResultCode}`);

      const transaction = await storage.getMpesaTransactionByCheckoutRequestId(stkCallback.CheckoutRequestID);
      if (!transaction) {
        console.error("[M-Pesa Callback] Transaction not found for CheckoutRequestID:", stkCallback.CheckoutRequestID);
        return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
      }

      if (transaction.status !== "pending") {
        console.log("[M-Pesa Callback] Transaction already processed, skipping:", transaction.id);
        return res.json({ ResultCode: 0, ResultDesc: "Already processed" });
      }

      const isSuccess = stkCallback.ResultCode === 0;
      const metadata = isSuccess ? extractCallbackMetadata(stkCallback) : {};

      if (isSuccess && metadata.amount !== undefined) {
        const expectedAmount = Math.ceil(parseFloat(transaction.amount));
        if (metadata.amount < expectedAmount) {
          console.error(`[M-Pesa Callback] Amount mismatch: expected ${expectedAmount}, got ${metadata.amount}`);
          await storage.updateMpesaTransactionStatus(transaction.id, {
            status: "failed",
            resultCode: stkCallback.ResultCode,
            resultDesc: `Amount mismatch: expected ${expectedAmount}, received ${metadata.amount}`,
            rawCallback: callbackData,
          });
          return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
        }
      }

      await storage.updateMpesaTransactionStatus(transaction.id, {
        status: isSuccess ? "success" : "failed",
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
        mpesaReceiptNumber: metadata.mpesaReceiptNumber || null,
        rawCallback: callbackData,
      });

      if (isSuccess) {
        const order = await storage.getOrder(transaction.orderId);
        if (order) {
          const paidAmount = parseFloat(transaction.amount);
          const newDepositPaid = Math.min(parseFloat(order.depositPaid) + paidAmount, parseFloat(order.totalAmount));
          const newBalanceDue = Math.max(0, parseFloat(order.totalAmount) - newDepositPaid);
          await db.update(orders).set({
            depositPaid: newDepositPaid.toFixed(2),
            balanceDue: newBalanceDue.toFixed(2),
            updatedAt: new Date(),
          }).where(eq(orders.id, order.id));

          await storage.createNotification({
            userId: order.customerId,
            type: "system",
            title: "Payment Received",
            message: `Payment of KES ${paidAmount.toLocaleString()} received via M-Pesa${metadata.mpesaReceiptNumber ? ` (Receipt: ${metadata.mpesaReceiptNumber})` : ""}`,
            orderId: order.id,
            amount: transaction.amount,
            isRead: false,
          });
        }
      }

      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    } catch (err: any) {
      console.error("[M-Pesa Callback] Error:", err.message);
      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }
  });

  app.get("/api/payments/status/:checkoutRequestId", authMiddleware, async (req, res) => {
    try {
      const { checkoutRequestId } = req.params;
      const transaction = await storage.getMpesaTransactionByCheckoutRequestId(checkoutRequestId);
      if (!transaction) return res.status(404).json({ message: "Transaction not found" });

      const order = await storage.getOrder(transaction.orderId);
      if (!order || order.customerId !== req.userId) return res.status(403).json({ message: "Access denied" });

      res.json({
        status: transaction.status,
        mpesaReceiptNumber: transaction.mpesaReceiptNumber,
        resultDesc: transaction.resultDesc,
        amount: transaction.amount,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Promotion apply
  app.post("/api/promotions/apply", authMiddleware, async (req, res) => {
    try {
      const { promotionId, orderId } = req.body;
      if (!promotionId || !orderId) return res.status(400).json({ message: "promotionId and orderId are required" });
      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.customerId !== req.userId) return res.status(403).json({ message: "Access denied" });
      const eligiblePromos = await storage.getPromotionsForUser(req.userId!);
      const promo = eligiblePromos.find(p => p.id === promotionId);
      if (!promo) return res.status(400).json({ message: "Promotion not available or not eligible" });
      let discountAmount = 0;
      const orderTotal = parseFloat(order.totalAmount);
      if (promo.promoType === "percentage" && promo.discountValue) {
        discountAmount = orderTotal * (parseFloat(promo.discountValue) / 100);
      } else if (promo.promoType === "fixed" && promo.discountValue) {
        discountAmount = parseFloat(promo.discountValue);
      } else if (promo.promoType === "free_pickup") {
        discountAmount = parseFloat(order.pickupFee);
      } else if (promo.promoType === "free_delivery") {
        discountAmount = parseFloat(order.deliveryFee);
      }
      const newTotal = Math.max(0, orderTotal - discountAmount);
      const depositPaid = parseFloat(order.depositPaid);
      const newBalance = Math.max(0, newTotal - depositPaid);
      const [updated] = await db.update(orders).set({
        promotionId,
        discountAmount: String(discountAmount),
        totalAmount: String(newTotal),
        balanceDue: String(newBalance),
        updatedAt: new Date(),
      }).where(eq(orders.id, orderId)).returning();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Reviews
  app.post("/api/reviews", authMiddleware, async (req, res) => {
    try {
      const { orderId, rating, comment } = req.body;
      if (!orderId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Order ID and rating (1-5) are required" });
      }
      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.customerId !== req.userId) return res.status(403).json({ message: "Access denied" });
      if (order.status !== "COMPLETED") return res.status(400).json({ message: "Can only review completed orders" });
      const existing = await storage.getReviewsByOrder(orderId);
      if (existing.length > 0) return res.status(400).json({ message: "You have already reviewed this order" });
      const review = await storage.createReview({
        orderId,
        customerId: req.userId!,
        rating,
        comment: comment || null,
        isPublic: true,
      });
      res.json(review);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/reviews/public", async (_req, res) => {
    const publicReviews = await storage.getPublicReviews();
    res.json(publicReviews);
  });

  app.get("/api/media/public", async (_req, res) => {
    const publicMedia = await storage.getPublicMedia();
    res.json(publicMedia);
  });

  // Order photos upload
  app.post("/api/orders/:id/photos", authMiddleware, async (req, res) => {
    try {
      const order = await storage.getOrder(paramId(req));
      if (!order) return res.status(404).json({ message: "Order not found" });
      const { fileKey, photoType } = req.body;
      if (!fileKey) return res.status(400).json({ message: "fileKey is required" });
      const photo = await storage.createOrderPhoto({
        orderId: order.id,
        fileKey,
        photoType: photoType || "before",
      });
      res.json(photo);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/orders/:id/photos", authMiddleware, async (req, res) => {
    const photos = await storage.getOrderPhotos(paramId(req));
    res.json(photos);
  });

  // Admin - Extended routes
  app.get("/api/admin/users/all", authMiddleware, adminMiddleware, async (_req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers);
  });

  app.post("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { phone, name, role, email, tag } = req.body;
      if (!phone || !name) return res.status(400).json({ message: "Phone and name are required" });
      const parsed = loginSchema.safeParse({ phone });
      if (!parsed.success) return res.status(400).json({ message: "Invalid phone number" });
      const existing = await storage.getUserByPhone(parsed.data.phone);
      if (existing) return res.status(400).json({ message: "User with this phone already exists" });
      const user = await storage.createUser({
        phone: parsed.data.phone,
        name,
        role: role || "customer",
        email: email || undefined,
      });
      if (tag) await storage.updateUserTag(user.id, tag);
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      await storage.deleteUser(paramId(req));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/pricing/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const updated = await storage.updatePricingRule(paramId(req), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin - Media/CMS
  app.get("/api/admin/media", authMiddleware, adminMiddleware, async (_req, res) => {
    const media = await storage.getMediaLibrary();
    res.json(media);
  });

  app.post("/api/admin/media", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { title, fileKey, mimeType, category } = req.body;
      if (!title || !fileKey || !mimeType) return res.status(400).json({ message: "Title, fileKey, and mimeType are required" });
      const media = await storage.createMedia({ title, fileKey, mimeType, category: category || "general" });
      res.json(media);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/media/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { title, subtitle, isPublic, category } = req.body;
      const updated = await storage.updateMedia(paramId(req), { title, subtitle, isPublic, category });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/admin/media/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      await storage.deleteMedia(paramId(req));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Admin - Extended stats with revenue, active jobs, top carpet types
  app.get("/api/admin/stats/extended", authMiddleware, adminMiddleware, async (_req, res) => {
    try {
      const stats = await storage.getStats();
      const allOrders = await storage.getAllOrders();
      const allItems = [];
      for (const order of allOrders) {
        const items = await storage.getOrderItems(order.id);
        allItems.push(...items);
      }
      const carpetTypeCounts: Record<string, number> = {};
      for (const item of allItems) {
        carpetTypeCounts[item.carpetType] = (carpetTypeCounts[item.carpetType] || 0) + (item.quantity || 1);
      }
      const topCarpetTypes = Object.entries(carpetTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }));
      const activeJobs = allOrders.filter(o => !["PENDING", "COMPLETED"].includes(o.status)).length;
      res.json({ ...stats, activeJobs, topCarpetTypes });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // File upload endpoint for photos/media
  app.post("/api/upload", authMiddleware, async (req, res) => {
    try {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", async () => {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers["content-type"] || "application/octet-stream";
        const ext = contentType.includes("png") ? ".png" : contentType.includes("jpeg") || contentType.includes("jpg") ? ".jpg" : contentType.includes("webp") ? ".webp" : contentType.includes("mp4") ? ".mp4" : ".bin";
        const filename = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
        const fs = await import("fs");
        const path = await import("path");
        const uploadDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        res.json({ fileKey: `/uploads/${filename}`, filename });
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (await import("express")).static("uploads"));

  // Technician routes
  app.get("/api/technician/tasks", authMiddleware, techMiddleware, async (req, res) => {
    const tasks = await storage.getOrdersByTechnician(req.userId!);
    const unassigned = await storage.getUnassignedOrders();
    res.json([...tasks, ...unassigned]);
  });

  app.patch("/api/technician/tasks/:id/complete", authMiddleware, techMiddleware, async (req, res) => {
    try {
      const order = await storage.getOrder(paramId(req));
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (order.technicianId && order.technicianId !== req.userId) {
        return res.status(403).json({ message: "This order is assigned to another technician" });
      }

      if (!order.technicianId) {
        await storage.assignTechnician(order.id, req.userId!);
      }

      await storage.updateOrderStatus(paramId(req), "COMPLETED");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
