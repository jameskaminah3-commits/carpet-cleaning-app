import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID, randomInt } from "crypto";
import { loginSchema, verifyOtpSchema } from "@shared/schema";

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

      const order = await storage.createOrder({
        customerId: req.userId!,
        status: "PENDING",
        totalAmount: String(totalAmount || 0),
        depositPaid: "0",
        balanceDue: String(totalAmount || 0),
        isLocked: false,
        deliveryZoneId: deliveryZoneId || null,
        pickupAddress: pickupAddress || null,
        locationName: locationName || null,
        notes: notes || null,
        locationLat: null,
        locationLng: null,
        technicianId: null,
        pricingSnapshot: { rules: pricingRulesSnapshot, timestamp: new Date().toISOString() },
        promotionId: promotionId || null,
        discountAmount: String(discountAmount || 0),
        pickupFee: String(pickupFee || 0),
        deliveryFee: String(deliveryFee || 0),
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
      await storage.updateOrderStatus(paramId(req), req.body.status);
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
      await storage.updateOrderPrice(paramId(req), String(amount));
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
