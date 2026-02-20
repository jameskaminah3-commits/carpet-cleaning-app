import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  users, sessions, orders, orderItems, orderPhotos, pricingRules, deliveryZones, mediaLibrary,
  type User, type InsertUser,
  type PricingRule, type InsertPricingRule,
  type DeliveryZone, type InsertDeliveryZone,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type OrderPhoto, type InsertOrderPhoto,
  type Media, type InsertMedia,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOtp(id: string, otp: string, expiry: Date): Promise<void>;
  clearUserOtp(id: string): Promise<void>;

  createSession(userId: string, token: string, expiresAt: Date): Promise<string>;
  getSessionByToken(token: string): Promise<{ userId: string } | undefined>;
  deleteSession(token: string): Promise<void>;

  getPricingRules(): Promise<PricingRule[]>;
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  deletePricingRule(id: string): Promise<void>;

  getDeliveryZones(): Promise<DeliveryZone[]>;
  createDeliveryZone(zone: InsertDeliveryZone): Promise<DeliveryZone>;
  deleteDeliveryZone(id: string): Promise<void>;

  createOrder(order: Omit<InsertOrder, "createdAt" | "updatedAt">): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getAllOrders(): Promise<(Order & { customer?: User })[]>;
  getOrdersByTechnician(technicianId: string): Promise<(Order & { customer?: User })[]>;
  getUnassignedOrders(): Promise<(Order & { customer?: User })[]>;
  updateOrderStatus(id: string, status: string): Promise<void>;
  updateOrderLock(id: string, isLocked: boolean): Promise<void>;
  updateOrderPrice(id: string, totalAmount: string): Promise<void>;
  assignTechnician(orderId: string, technicianId: string): Promise<void>;

  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  getStats(): Promise<{ total: number; pending: number; inProgress: number; completed: number; revenue: number }>;

  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUserOtp(id: string, otp: string, expiry: Date): Promise<void> {
    await db.update(users).set({ otpCode: otp, otpExpiry: expiry }).where(eq(users.id, id));
  }

  async clearUserOtp(id: string): Promise<void> {
    await db.update(users).set({ otpCode: null, otpExpiry: null }).where(eq(users.id, id));
  }

  async createSession(userId: string, token: string, expiresAt: Date): Promise<string> {
    const [session] = await db.insert(sessions).values({ userId, token, expiresAt }).returning();
    return session.id;
  }

  async getSessionByToken(token: string): Promise<{ userId: string } | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    if (!session) return undefined;
    if (new Date() > session.expiresAt) {
      await db.delete(sessions).where(eq(sessions.id, session.id));
      return undefined;
    }
    return { userId: session.userId };
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async getPricingRules(): Promise<PricingRule[]> {
    return db.select().from(pricingRules).where(eq(pricingRules.isActive, true));
  }

  async createPricingRule(rule: InsertPricingRule): Promise<PricingRule> {
    const [created] = await db.insert(pricingRules).values(rule).returning();
    return created;
  }

  async deletePricingRule(id: string): Promise<void> {
    await db.delete(pricingRules).where(eq(pricingRules.id, id));
  }

  async getDeliveryZones(): Promise<DeliveryZone[]> {
    return db.select().from(deliveryZones).where(eq(deliveryZones.isActive, true));
  }

  async createDeliveryZone(zone: InsertDeliveryZone): Promise<DeliveryZone> {
    const [created] = await db.insert(deliveryZones).values(zone).returning();
    return created;
  }

  async deleteDeliveryZone(id: string): Promise<void> {
    await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
  }

  async createOrder(order: Omit<InsertOrder, "createdAt" | "updatedAt">): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<(Order & { customer?: User })[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const result: (Order & { customer?: User })[] = [];
    for (const order of allOrders) {
      const [customer] = await db.select().from(users).where(eq(users.id, order.customerId));
      result.push({ ...order, customer });
    }
    return result;
  }

  async getOrdersByTechnician(technicianId: string): Promise<(Order & { customer?: User })[]> {
    const techOrders = await db.select().from(orders).where(eq(orders.technicianId, technicianId)).orderBy(desc(orders.createdAt));
    const result: (Order & { customer?: User })[] = [];
    for (const order of techOrders) {
      const [customer] = await db.select().from(users).where(eq(users.id, order.customerId));
      result.push({ ...order, customer });
    }
    return result;
  }

  async getUnassignedOrders(): Promise<(Order & { customer?: User })[]> {
    const unassigned = await db.select().from(orders).where(sql`${orders.technicianId} IS NULL AND ${orders.status} != 'COMPLETED'`).orderBy(desc(orders.createdAt));
    const result: (Order & { customer?: User })[] = [];
    for (const order of unassigned) {
      const [customer] = await db.select().from(users).where(eq(users.id, order.customerId));
      result.push({ ...order, customer });
    }
    return result;
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(eq(orders.id, id));
  }

  async updateOrderLock(id: string, isLocked: boolean): Promise<void> {
    const order = await this.getOrder(id);
    if (order) {
      const balanceDue = isLocked ? (parseFloat(order.totalAmount) - parseFloat(order.depositPaid)).toString() : order.balanceDue;
      await db.update(orders).set({ isLocked, balanceDue, updatedAt: new Date() }).where(eq(orders.id, id));
    }
  }

  async updateOrderPrice(id: string, totalAmount: string): Promise<void> {
    const order = await this.getOrder(id);
    if (order) {
      const balanceDue = (parseFloat(totalAmount) - parseFloat(order.depositPaid)).toString();
      await db.update(orders).set({ totalAmount, balanceDue, updatedAt: new Date() }).where(eq(orders.id, id));
    }
  }

  async assignTechnician(orderId: string, technicianId: string): Promise<void> {
    await db.update(orders).set({ technicianId, updatedAt: new Date() }).where(eq(orders.id, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [created] = await db.insert(orderItems).values(item).returning();
    return created;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async getStats(): Promise<{ total: number; pending: number; inProgress: number; completed: number; revenue: number }> {
    const allOrders = await db.select().from(orders);
    const total = allOrders.length;
    const pending = allOrders.filter((o) => o.status === "PENDING").length;
    const completed = allOrders.filter((o) => o.status === "COMPLETED").length;
    const inProgress = allOrders.filter((o) => !["PENDING", "COMPLETED"].includes(o.status)).length;
    const revenue = allOrders.filter((o) => o.status === "COMPLETED").reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    return { total, pending, inProgress, completed, revenue };
  }

  async seedData(): Promise<void> {
    const existingRules = await db.select().from(pricingRules);
    if (existingRules.length > 0) return;

    await db.insert(pricingRules).values([
      { name: "Persian/Oriental Standard", carpetType: "Persian/Oriental", pricePerSqMeter: "800", description: "Handwoven oriental carpet cleaning", isActive: true },
      { name: "Shag Deep Clean", carpetType: "Shag", pricePerSqMeter: "600", description: "Deep cleaning for shag carpets", isActive: true },
      { name: "Berber Standard", carpetType: "Berber", pricePerSqMeter: "500", description: "Standard berber carpet cleaning", isActive: true },
      { name: "Silk Premium", carpetType: "Silk", pricePerSqMeter: "1200", description: "Delicate silk carpet treatment", isActive: true },
      { name: "Area Rug Standard", carpetType: "Area Rug", pricePerSqMeter: "450", description: "Standard area rug cleaning", isActive: true },
      { name: "Wall-to-Wall Basic", carpetType: "Wall-to-Wall", pricePerSqMeter: "350", description: "Wall-to-wall carpet cleaning", isActive: true },
      { name: "Sisal/Jute Care", carpetType: "Sisal/Jute", pricePerSqMeter: "550", description: "Natural fiber carpet cleaning", isActive: true },
      { name: "Frieze Standard", carpetType: "Frieze", pricePerSqMeter: "500", description: "Frieze carpet deep clean", isActive: true },
    ]);

    await db.insert(deliveryZones).values([
      { name: "Westlands", fee: "500", description: "Westlands area", isActive: true },
      { name: "Karen", fee: "800", description: "Karen area", isActive: true },
      { name: "Kilimani", fee: "400", description: "Kilimani area", isActive: true },
      { name: "Lavington", fee: "600", description: "Lavington area", isActive: true },
      { name: "Nairobi CBD", fee: "300", description: "Central business district", isActive: true },
    ]);

    const [admin] = await db.insert(users).values({
      phone: "+254700000001",
      name: "Admin User",
      role: "admin",
      email: "admin@carpetpro.co.ke",
    }).returning();

    const [tech] = await db.insert(users).values({
      phone: "+254700000002",
      name: "John Kamau",
      role: "technician",
      email: "john@carpetpro.co.ke",
    }).returning();

    const [customer] = await db.insert(users).values({
      phone: "+254712345678",
      name: "Sarah Muthoni",
      role: "customer",
      email: "sarah@example.com",
    }).returning();

    const zones = await db.select().from(deliveryZones);
    const westlands = zones.find((z) => z.name === "Westlands");

    const [order1] = await db.insert(orders).values({
      customerId: customer.id,
      technicianId: tech.id,
      status: "IN_CLEANING",
      totalAmount: "4800",
      depositPaid: "2400",
      balanceDue: "2400",
      isLocked: true,
      deliveryZoneId: westlands?.id,
      pickupAddress: "Brookside Apartments, Apt 4B",
      locationName: "Westlands, Nairobi",
      notes: "Please handle with care - antique rug",
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order1.id, carpetType: "Persian/Oriental", width: "3", length: "2", quantity: 1, unitPrice: "800", subtotal: "4800", description: "Antique Persian rug" },
    ]);

    const [order2] = await db.insert(orders).values({
      customerId: customer.id,
      status: "PENDING",
      totalAmount: "2700",
      depositPaid: "0",
      balanceDue: "2700",
      isLocked: false,
      pickupAddress: "Riverside Drive, House 12",
      locationName: "Kilimani, Nairobi",
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order2.id, carpetType: "Shag", width: "2.5", length: "1.8", quantity: 1, unitPrice: "600", subtotal: "2700", description: "Living room shag carpet" },
    ]);
  }
}

export const storage = new DatabaseStorage();
