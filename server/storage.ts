import { db } from "./db";
import { eq, and, desc, sql, isNull, ne } from "drizzle-orm";
import {
  users, sessions, orders, orderItems, orderPhotos, pricingRules, deliveryZones,
  mediaLibrary, deliveries, promotions, savedAddresses, notifications, reviews,
  mpesaTransactions,
  type User, type InsertUser,
  type PricingRule, type InsertPricingRule,
  type DeliveryZone, type InsertDeliveryZone,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type OrderPhoto, type InsertOrderPhoto,
  type Media, type InsertMedia,
  type Delivery, type InsertDelivery,
  type Promotion, type InsertPromotion,
  type SavedAddress, type InsertSavedAddress,
  type Notification, type InsertNotification,
  type Review, type InsertReview,
  type MpesaTransaction, type InsertMpesaTransaction,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOtp(id: string, otp: string, expiry: Date): Promise<void>;
  clearUserOtp(id: string): Promise<void>;
  updateUserProfile(id: string, data: Partial<{ name: string; email: string; phone: string }>): Promise<User>;
  updateUserTag(id: string, tag: string | null): Promise<void>;
  updateUserActive(id: string, isActive: boolean): Promise<void>;
  getAllCustomers(): Promise<User[]>;

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
  updateOrderPrice(id: string, totalAmount: string): Promise<Order>;
  assignTechnician(orderId: string, technicianId: string): Promise<void>;

  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  getDeliveries(): Promise<(Delivery & { order?: Order; technician?: User })[]>;
  getDeliveriesByOrder(orderId: string): Promise<Delivery[]>;
  getDeliveriesByTechnician(technicianId: string): Promise<(Delivery & { order?: Order })[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDeliveryStatus(id: string, status: string): Promise<void>;
  updateDeliveryTechnician(id: string, technicianId: string): Promise<void>;
  rescheduleDelivery(id: string, date: Date, timeWindow: string): Promise<void>;
  getTechnicians(): Promise<User[]>;

  getPromotions(): Promise<Promotion[]>;
  getActivePromotions(): Promise<Promotion[]>;
  getPromotionsForUser(userId: string): Promise<Promotion[]>;
  createPromotion(promo: InsertPromotion): Promise<Promotion>;
  deletePromotion(id: string): Promise<void>;
  getPromotionByCode(code: string): Promise<Promotion | undefined>;

  getSavedAddresses(userId: string): Promise<SavedAddress[]>;
  createSavedAddress(address: InsertSavedAddress): Promise<SavedAddress>;
  deleteSavedAddress(id: string): Promise<void>;

  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsForUser(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  createReview(review: InsertReview): Promise<Review>;
  getReviewsByOrder(orderId: string): Promise<Review[]>;
  getPublicReviews(): Promise<(Review & { customer?: User })[]>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  updatePricingRule(id: string, data: Partial<{ name: string; pricePerSqMeter: string; description: string; carpetType: string; isActive: boolean }>): Promise<PricingRule>;
  getOrderPhotos(orderId: string): Promise<OrderPhoto[]>;
  createOrderPhoto(photo: InsertOrderPhoto): Promise<OrderPhoto>;
  getMediaLibrary(): Promise<Media[]>;
  getPublicMedia(): Promise<Media[]>;
  createMedia(media: InsertMedia): Promise<Media>;
  updateMedia(id: string, data: Partial<{ title: string; subtitle: string; isPublic: boolean; category: string }>): Promise<Media>;
  deleteMedia(id: string): Promise<void>;

  createMpesaTransaction(tx: InsertMpesaTransaction): Promise<MpesaTransaction>;
  getMpesaTransaction(id: string): Promise<MpesaTransaction | undefined>;
  getMpesaTransactionByCheckoutRequestId(checkoutRequestId: string): Promise<MpesaTransaction | undefined>;
  updateMpesaTransactionStatus(id: string, data: Partial<{ status: string; mpesaReceiptNumber: string; resultCode: number; resultDesc: string; rawCallback: any }>): Promise<MpesaTransaction>;
  getMpesaTransactionsByOrder(orderId: string): Promise<MpesaTransaction[]>;

  getStats(): Promise<{
    totalUsers: number; totalOrders: number; scheduledDeliveries: number; activePromotions: number;
    total: number; pending: number; inProgress: number; completed: number; revenue: number;
  }>;

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

  async updateUserProfile(id: string, data: Partial<{ name: string; email: string; phone: string }>): Promise<User> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async updateUserTag(id: string, tag: string | null): Promise<void> {
    await db.update(users).set({ tag: tag as any }).where(eq(users.id, id));
  }

  async updateUserActive(id: string, isActive: boolean): Promise<void> {
    await db.update(users).set({ isActive }).where(eq(users.id, id));
  }

  async getAllCustomers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "customer")).orderBy(desc(users.createdAt));
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
    await db.update(users).set({
      totalOrders: sql`${users.totalOrders} + 1`,
      lastOrderDate: new Date(),
      lifetimeValue: sql`${users.lifetimeValue} + ${parseFloat(String(order.totalAmount || "0"))}`,
    }).where(eq(users.id, order.customerId));
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

  async updateOrderPrice(id: string, totalAmount: string): Promise<Order> {
    const order = await this.getOrder(id);
    const depositPaid = order ? parseFloat(order.depositPaid) : 0;
    const newBalance = Math.max(0, parseFloat(totalAmount) - depositPaid);
    const [updated] = await db.update(orders).set({ 
      totalAmount, 
      balanceDue: String(newBalance),
      updatedAt: new Date()
    }).where(eq(orders.id, id)).returning();
    return updated;
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

  async getDeliveries(): Promise<(Delivery & { order?: Order; technician?: User })[]> {
    const allDeliveries = await db.select().from(deliveries).orderBy(desc(deliveries.createdAt));
    const result: (Delivery & { order?: Order; technician?: User })[] = [];
    for (const delivery of allDeliveries) {
      const [order] = await db.select().from(orders).where(eq(orders.id, delivery.orderId));
      let technician: User | undefined;
      if (delivery.technicianId) {
        const [tech] = await db.select().from(users).where(eq(users.id, delivery.technicianId));
        technician = tech;
      }
      result.push({ ...delivery, order, technician });
    }
    return result;
  }

  async getDeliveriesByOrder(orderId: string): Promise<Delivery[]> {
    return db.select().from(deliveries).where(eq(deliveries.orderId, orderId));
  }

  async getDeliveriesByTechnician(technicianId: string): Promise<(Delivery & { order?: Order })[]> {
    const techDeliveries = await db.select().from(deliveries)
      .where(eq(deliveries.technicianId, technicianId))
      .orderBy(desc(deliveries.createdAt));
    const result: (Delivery & { order?: Order })[] = [];
    for (const delivery of techDeliveries) {
      const [order] = await db.select().from(orders).where(eq(orders.id, delivery.orderId));
      result.push({ ...delivery, order });
    }
    return result;
  }

  async getTechnicians(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "technician"));
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const [created] = await db.insert(deliveries).values(delivery).returning();
    return created;
  }

  async updateDeliveryStatus(id: string, status: string): Promise<void> {
    const updates: any = { status };
    if (status === "completed") updates.completedAt = new Date();
    await db.update(deliveries).set(updates).where(eq(deliveries.id, id));
  }

  async updateDeliveryTechnician(id: string, technicianId: string): Promise<void> {
    await db.update(deliveries).set({ technicianId }).where(eq(deliveries.id, id));
  }

  async rescheduleDelivery(id: string, date: Date, timeWindow: string): Promise<void> {
    await db.update(deliveries).set({ scheduledDate: date, scheduledTimeWindow: timeWindow }).where(eq(deliveries.id, id));
  }

  async getPromotions(): Promise<Promotion[]> {
    return db.select().from(promotions).orderBy(desc(promotions.createdAt));
  }

  async getActivePromotions(): Promise<Promotion[]> {
    return db.select().from(promotions).where(eq(promotions.isActive, true));
  }

  async getPromotionsForUser(userId: string): Promise<Promotion[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    const all = await db.select().from(promotions).where(eq(promotions.isActive, true));
    return all.filter(p => {
      if (p.expiresAt && new Date() > p.expiresAt) return false;
      if (p.targetUserId && p.targetUserId !== userId) return false;
      if (p.minOrders > 0 && user.totalOrders < p.minOrders) return false;
      if (p.targetTag && p.targetTag !== user.tag) return false;
      if (p.isVipOnly && user.tag !== "VIP") return false;
      return true;
    });
  }

  async createPromotion(promo: InsertPromotion): Promise<Promotion> {
    const [created] = await db.insert(promotions).values(promo).returning();
    return created;
  }

  async deletePromotion(id: string): Promise<void> {
    await db.delete(promotions).where(eq(promotions.id, id));
  }

  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const [promo] = await db.select().from(promotions).where(eq(promotions.couponCode, code));
    return promo;
  }

  async getSavedAddresses(userId: string): Promise<SavedAddress[]> {
    return db.select().from(savedAddresses).where(eq(savedAddresses.userId, userId));
  }

  async createSavedAddress(address: InsertSavedAddress): Promise<SavedAddress> {
    const [created] = await db.insert(savedAddresses).values(address).returning();
    return created;
  }

  async deleteSavedAddress(id: string): Promise<void> {
    await db.delete(savedAddresses).where(eq(savedAddresses.id, id));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result[0]?.count || 0);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async getReviewsByOrder(orderId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.orderId, orderId));
  }

  async getPublicReviews(): Promise<(Review & { customer?: User })[]> {
    const allReviews = await db.select().from(reviews).where(eq(reviews.isPublic, true)).orderBy(desc(reviews.createdAt));
    const result: (Review & { customer?: User })[] = [];
    for (const review of allReviews) {
      const [customer] = await db.select().from(users).where(eq(users.id, review.customerId));
      result.push({ ...review, customer });
    }
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<void> {
    await db.update(users).set({ isActive: false }).where(eq(users.id, id));
  }

  async updatePricingRule(id: string, data: Partial<{ name: string; pricePerSqMeter: string; description: string; carpetType: string; isActive: boolean }>): Promise<PricingRule> {
    const [updated] = await db.update(pricingRules).set(data).where(eq(pricingRules.id, id)).returning();
    return updated;
  }

  async getOrderPhotos(orderId: string): Promise<OrderPhoto[]> {
    return db.select().from(orderPhotos).where(eq(orderPhotos.orderId, orderId));
  }

  async createOrderPhoto(photo: InsertOrderPhoto): Promise<OrderPhoto> {
    const [created] = await db.insert(orderPhotos).values(photo).returning();
    return created;
  }

  async getMediaLibrary(): Promise<Media[]> {
    return db.select().from(mediaLibrary).orderBy(desc(mediaLibrary.uploadedAt));
  }

  async createMedia(media: InsertMedia): Promise<Media> {
    const [created] = await db.insert(mediaLibrary).values(media).returning();
    return created;
  }

  async getPublicMedia(): Promise<Media[]> {
    return db.select().from(mediaLibrary).where(eq(mediaLibrary.isPublic, true)).orderBy(mediaLibrary.uploadedAt);
  }

  async updateMedia(id: string, data: Partial<{ title: string; subtitle: string; isPublic: boolean; category: string }>): Promise<Media> {
    const [updated] = await db.update(mediaLibrary).set(data).where(eq(mediaLibrary.id, id)).returning();
    return updated;
  }

  async deleteMedia(id: string): Promise<void> {
    await db.delete(mediaLibrary).where(eq(mediaLibrary.id, id));
  }

  async createMpesaTransaction(tx: InsertMpesaTransaction): Promise<MpesaTransaction> {
    const [created] = await db.insert(mpesaTransactions).values(tx).returning();
    return created;
  }

  async getMpesaTransaction(id: string): Promise<MpesaTransaction | undefined> {
    const [tx] = await db.select().from(mpesaTransactions).where(eq(mpesaTransactions.id, id));
    return tx;
  }

  async getMpesaTransactionByCheckoutRequestId(checkoutRequestId: string): Promise<MpesaTransaction | undefined> {
    const [tx] = await db.select().from(mpesaTransactions).where(eq(mpesaTransactions.checkoutRequestId, checkoutRequestId));
    return tx;
  }

  async updateMpesaTransactionStatus(id: string, data: Partial<{ status: string; mpesaReceiptNumber: string; resultCode: number; resultDesc: string; rawCallback: any }>): Promise<MpesaTransaction> {
    const [updated] = await db.update(mpesaTransactions).set({ ...data, updatedAt: new Date() } as any).where(eq(mpesaTransactions.id, id)).returning();
    return updated;
  }

  async getMpesaTransactionsByOrder(orderId: string): Promise<MpesaTransaction[]> {
    return db.select().from(mpesaTransactions).where(eq(mpesaTransactions.orderId, orderId)).orderBy(desc(mpesaTransactions.createdAt));
  }

  async getStats() {
    const allOrders = await db.select().from(orders);
    const allUsers = await db.select().from(users).where(eq(users.role, "customer"));
    const allDeliveries = await db.select().from(deliveries).where(eq(deliveries.status, "scheduled"));
    const activePromos = await db.select().from(promotions).where(eq(promotions.isActive, true));

    const total = allOrders.length;
    const pending = allOrders.filter((o) => o.status === "PENDING").length;
    const completed = allOrders.filter((o) => o.status === "COMPLETED").length;
    const inProgress = allOrders.filter((o) => !["PENDING", "COMPLETED"].includes(o.status)).length;
    const revenue = allOrders.filter((o) => o.status === "COMPLETED").reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

    return {
      totalUsers: allUsers.length,
      totalOrders: total,
      scheduledDeliveries: allDeliveries.length,
      activePromotions: activePromos.length,
      total, pending, inProgress, completed, revenue,
    };
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
      email: "admin@sparklenglee.co.ke",
    }).returning();

    const [tech] = await db.insert(users).values({
      phone: "+254700000002",
      name: "John Kamau",
      role: "technician",
      email: "john@sparklenglee.co.ke",
    }).returning();

    const [customer1] = await db.insert(users).values({
      phone: "+254712345678",
      name: "Sarah Wanjiku",
      role: "customer",
      email: "sarah@example.com",
      tag: "Frequent",
      totalOrders: 5,
      lifetimeValue: "43500",
    }).returning();

    const [customer2] = await db.insert(users).values({
      phone: "+254791234567",
      name: "Mark Ndungu",
      role: "customer",
      email: "mark@example.com",
      tag: "Frequent",
      totalOrders: 1,
      lifetimeValue: "6500",
    }).returning();

    const [customer3] = await db.insert(users).values({
      phone: "+254791234568",
      name: "John Mwangi",
      role: "customer",
      email: "john.m@example.com",
      tag: "Corporate",
      totalOrders: 2,
      lifetimeValue: "6500",
    }).returning();

    const zones = await db.select().from(deliveryZones);
    const westlands = zones.find((z) => z.name === "Westlands");

    const [order1] = await db.insert(orders).values({
      customerId: customer1.id,
      technicianId: tech.id,
      status: "COMPLETED",
      totalAmount: "9000",
      depositPaid: "9000",
      balanceDue: "0",
      isLocked: true,
      deliveryZoneId: westlands?.id,
      pickupAddress: "Brookside Apartments, Apt 4B",
      locationName: "Westlands, Nairobi",
      notes: "Office carpets - 2 pieces",
      pricingSnapshot: { rules: [{ carpetType: "Persian/Oriental", pricePerSqMeter: 800 }], pickupFee: 500, deliveryFee: 500 },
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order1.id, carpetType: "Persian/Oriental", width: "3", length: "2", quantity: 2, unitPrice: "800", subtotal: "9600", description: "Office Carpets, 2 pcs. - 120 sqft" },
    ]);

    const [order2] = await db.insert(orders).values({
      customerId: customer1.id,
      status: "IN_CLEANING",
      totalAmount: "4800",
      depositPaid: "2400",
      balanceDue: "2400",
      isLocked: true,
      technicianId: tech.id,
      pickupAddress: "Riverside Drive, House 12",
      locationName: "Kilimani, Nairobi",
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order2.id, carpetType: "Shag", width: "2.5", length: "1.8", quantity: 1, unitPrice: "600", subtotal: "2700", description: "Living room shag carpet" },
    ]);

    const [order3] = await db.insert(orders).values({
      customerId: customer2.id,
      status: "AWAITING_PICKUP",
      totalAmount: "6500",
      depositPaid: "3000",
      balanceDue: "3500",
      isLocked: false,
      technicianId: tech.id,
      pickupAddress: "Ngong Road, Building 5",
      locationName: "Lavington, Nairobi",
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order3.id, carpetType: "Silk", width: "4", length: "3", quantity: 1, unitPrice: "1200", subtotal: "6500", description: "Silk carpet premium clean" },
    ]);

    await db.insert(deliveries).values([
      {
        orderId: order1.id,
        technicianId: tech.id,
        deliveryType: "pickup",
        status: "completed",
        scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        scheduledTimeWindow: "9:00 AM - 12:00 PM",
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        orderId: order1.id,
        technicianId: tech.id,
        deliveryType: "return",
        status: "completed",
        scheduledDate: new Date(),
        scheduledTimeWindow: "2:00 PM - 5:00 PM",
        completedAt: new Date(),
      },
      {
        orderId: order3.id,
        technicianId: tech.id,
        deliveryType: "pickup",
        status: "scheduled",
        scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        scheduledTimeWindow: "9:00 AM - 12:00 PM",
      },
    ]);

    await db.insert(promotions).values([
      {
        name: "Frequent Discount",
        description: "10% Off for repeat clients",
        promoType: "percentage",
        appliesTo: "order",
        discountValue: "10",
        isActive: true,
        minOrders: 3,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
      {
        name: "Free Pickup",
        description: "Save KES 1000 on pickup",
        promoType: "free_pickup",
        appliesTo: "delivery",
        isActive: true,
        freePickupThreshold: "5000",
        minOrders: 0,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        name: "VIP Welcome",
        description: "20% off for VIP customers",
        promoType: "percentage",
        appliesTo: "order",
        discountValue: "20",
        isVipOnly: true,
        isActive: true,
        minOrders: 0,
      },
    ]);

    await db.insert(savedAddresses).values([
      { userId: customer1.id, label: "Home", address: "Brookside Apartments, Apt 4B, Westlands", isDefault: true },
      { userId: customer1.id, label: "Office", address: "ABC Tower, 5th Floor, Nairobi CBD" },
    ]);

    await db.insert(mediaLibrary).values([
      { title: "Persian Rug — Before", subtitle: "Heavy soil and coffee stains", fileKey: "/gallery/before-persian.png", mimeType: "image/png", category: "before-after", isPublic: true },
      { title: "Persian Rug — After", subtitle: "Original colors fully restored", fileKey: "/gallery/after-persian.png", mimeType: "image/png", category: "before-after", isPublic: true },
      { title: "Shag Carpet — Before", subtitle: "Pet stains and discoloration", fileKey: "/gallery/before-shag.png", mimeType: "image/png", category: "before-after", isPublic: true },
      { title: "Shag Carpet — After", subtitle: "Bright white pile restored", fileKey: "/gallery/after-shag.png", mimeType: "image/png", category: "before-after", isPublic: true },
      { title: "Office Carpet — Before", subtitle: "Traffic wear and coffee spills", fileKey: "/gallery/before-office.png", mimeType: "image/png", category: "before-after", isPublic: true },
      { title: "Office Carpet — After", subtitle: "Uniform color restored", fileKey: "/gallery/after-office.png", mimeType: "image/png", category: "before-after", isPublic: true },
      { title: "Silk Rug — Before", subtitle: "Water damage and yellowing", fileKey: "/gallery/before-silk.png", mimeType: "image/png", category: "before-after", isPublic: true },
      { title: "Silk Rug — After", subtitle: "Lustrous finish restored", fileKey: "/gallery/after-silk.png", mimeType: "image/png", category: "before-after", isPublic: true },
    ]);
  }
}

export const storage = new DatabaseStorage();
