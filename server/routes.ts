import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID, randomInt } from "crypto";
import { loginSchema, verifyOtpSchema } from "@shared/schema";

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
      res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, phone: user.phone } });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const user = await storage.getUser(req.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ id: user.id, name: user.name, role: user.role, phone: user.phone, email: user.email });
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
      const { items, deliveryZoneId, pickupAddress, locationName, notes, totalAmount } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "At least one carpet item is required" });
      }

      for (const item of items) {
        if (!item.carpetType || !item.width || !item.length || item.width <= 0 || item.length <= 0) {
          return res.status(400).json({ message: "Each carpet item must have valid type, width, and length" });
        }
      }

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
      });

      if (items && Array.isArray(items)) {
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
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/orders/my", authMiddleware, async (req, res) => {
    const orders = await storage.getOrdersByCustomer(req.userId!);
    res.json(orders);
  });

  app.get("/api/orders/:id", authMiddleware, async (req, res) => {
    const order = await storage.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const user = await storage.getUser(req.userId!);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.role === "customer" && order.customerId !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const items = await storage.getOrderItems(order.id);
    res.json({ ...order, items });
  });

  app.get("/api/admin/orders", authMiddleware, adminMiddleware, async (_req, res) => {
    const orders = await storage.getAllOrders();
    res.json(orders);
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
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      await storage.updateOrderStatus(req.params.id, req.body.status);
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
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      await storage.updateOrderLock(req.params.id, req.body.isLocked);
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
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      await storage.updateOrderPrice(req.params.id, String(amount));
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
    try {
      await storage.deletePricingRule(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
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
    try {
      await storage.deleteDeliveryZone(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/technician/tasks", authMiddleware, techMiddleware, async (req, res) => {
    const tasks = await storage.getOrdersByTechnician(req.userId!);
    const unassigned = await storage.getUnassignedOrders();
    res.json([...tasks, ...unassigned]);
  });

  app.patch("/api/technician/tasks/:id/complete", authMiddleware, techMiddleware, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (order.technicianId && order.technicianId !== req.userId) {
        return res.status(403).json({ message: "This order is assigned to another technician" });
      }

      if (!order.technicianId) {
        await storage.assignTechnician(order.id, req.userId!);
      }

      await storage.updateOrderStatus(req.params.id, "COMPLETED");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
