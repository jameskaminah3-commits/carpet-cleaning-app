import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["customer", "technician", "admin"]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "AWAITING_PICKUP",
  "IN_CLEANING",
  "DRYING",
  "READY",
  "COMPLETED",
]);

export const deliveryTypeEnum = pgEnum("delivery_type", ["pickup", "return"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["scheduled", "in_transit", "completed", "failed"]);
export const promoTypeEnum = pgEnum("promo_type", ["percentage", "fixed", "free_pickup", "free_delivery"]);
export const promoAppliesEnum = pgEnum("promo_applies", ["order", "delivery", "invoice"]);
export const customerTagEnum = pgEnum("customer_tag", ["VIP", "Frequent", "Corporate", "One-time"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("customer"),
  otpCode: text("otp_code"),
  otpExpiry: timestamp("otp_expiry"),
  profilePhoto: text("profile_photo"),
  isActive: boolean("is_active").notNull().default(true),
  tag: customerTagEnum("tag"),
  lifetimeValue: decimal("lifetime_value", { precision: 12, scale: 2 }).notNull().default("0"),
  totalOrders: integer("total_orders").notNull().default(0),
  lastOrderDate: timestamp("last_order_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  pricePerSqMeter: decimal("price_per_sq_meter", { precision: 10, scale: 2 }).notNull(),
  carpetType: text("carpet_type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const deliveryZones = pgTable("delivery_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  technicianId: varchar("technician_id").references(() => users.id),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  depositPaid: decimal("deposit_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  balanceDue: decimal("balance_due", { precision: 10, scale: 2 }).notNull().default("0"),
  isLocked: boolean("is_locked").notNull().default(false),
  deliveryZoneId: varchar("delivery_zone_id").references(() => deliveryZones.id),
  pickupAddress: text("pickup_address"),
  notes: text("notes"),
  locationLat: text("location_lat"),
  locationLng: text("location_lng"),
  locationName: text("location_name"),
  pricingSnapshot: jsonb("pricing_snapshot"),
  promotionId: varchar("promotion_id"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  pickupFee: decimal("pickup_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  expressFee: decimal("express_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  carpetType: text("carpet_type").notNull(),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  length: decimal("length", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
});

export const orderPhotos = pgTable("order_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  fileKey: text("file_key").notNull(),
  photoType: text("photo_type").notNull().default("before"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const mediaLibrary = pgTable("media_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  fileKey: text("file_key").notNull(),
  mimeType: text("mime_type").notNull(),
  category: text("category").notNull().default("general"),
  isPublic: boolean("is_public").notNull().default(false),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  technicianId: varchar("technician_id").references(() => users.id),
  deliveryType: deliveryTypeEnum("delivery_type").notNull(),
  status: deliveryStatusEnum("status").notNull().default("scheduled"),
  scheduledDate: timestamp("scheduled_date"),
  scheduledTimeWindow: text("scheduled_time_window"),
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const promotions = pgTable("promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  promoType: promoTypeEnum("promo_type").notNull(),
  appliesTo: promoAppliesEnum("applies_to").notNull().default("order"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
  couponCode: text("coupon_code"),
  isVipOnly: boolean("is_vip_only").notNull().default(false),
  isSingleUse: boolean("is_single_use").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  freePickupThreshold: decimal("free_pickup_threshold", { precision: 10, scale: 2 }),
  expiresAt: timestamp("expires_at"),
  targetUserId: varchar("target_user_id"),
  minOrders: integer("min_orders").notNull().default(0),
  targetTag: customerTagEnum("target_tag"),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const savedAddresses = pgTable("saved_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  label: text("label").notNull(),
  address: text("address").notNull(),
  locationLat: text("location_lat"),
  locationLng: text("location_lng"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationTypeEnum = pgEnum("notification_type", ["order_status", "payment_request", "promotion", "system"]);

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  orderId: varchar("order_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mpesaTransactionStatusEnum = pgEnum("mpesa_transaction_status", ["pending", "success", "failed"]);

export const mpesaTransactions = pgTable("mpesa_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  phone: text("phone").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  mpesaReceiptNumber: text("mpesa_receipt_number"),
  merchantRequestId: text("merchant_request_id"),
  checkoutRequestId: text("checkout_request_id"),
  status: mpesaTransactionStatusEnum("status").notNull().default("pending"),
  resultCode: integer("result_code"),
  resultDesc: text("result_desc"),
  rawCallback: jsonb("raw_callback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMpesaTransactionSchema = createInsertSchema(mpesaTransactions).omit({ id: true, createdAt: true, updatedAt: true });

export const insertUserSchema = createInsertSchema(users).omit({ id: true, otpCode: true, otpExpiry: true, createdAt: true });
export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({ id: true });
export const insertDeliveryZoneSchema = createInsertSchema(deliveryZones).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertOrderPhotoSchema = createInsertSchema(orderPhotos).omit({ id: true, uploadedAt: true });
export const insertMediaSchema = createInsertSchema(mediaLibrary).omit({ id: true, uploadedAt: true });
export const insertDeliverySchema = createInsertSchema(deliveries).omit({ id: true, createdAt: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true, usageCount: true, createdAt: true });
export const insertSavedAddressSchema = createInsertSchema(savedAddresses).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertDeliveryZone = z.infer<typeof insertDeliveryZoneSchema>;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderPhoto = z.infer<typeof insertOrderPhotoSchema>;
export type OrderPhoto = typeof orderPhotos.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof mediaLibrary.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertSavedAddress = z.infer<typeof insertSavedAddressSchema>;
export type SavedAddress = typeof savedAddresses.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertMpesaTransaction = z.infer<typeof insertMpesaTransactionSchema>;
export type MpesaTransaction = typeof mpesaTransactions.$inferSelect;

export const phoneSchema = z.string().transform((val) => {
  let cleaned = val.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+254" + cleaned.slice(1);
  } else if (cleaned.startsWith("254")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+254")) {
    cleaned = "+254" + cleaned;
  }
  return cleaned;
}).pipe(z.string().regex(/^\+254\d{9}$/, "Invalid Kenyan phone number"));

export const loginSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6),
});

export const bookingSchema = z.object({
  carpetType: z.string().min(1),
  width: z.number().positive(),
  length: z.number().positive(),
  quantity: z.number().int().positive(),
  description: z.string().optional(),
});

export const ORDER_STATUSES = [
  { value: "PENDING", label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { value: "AWAITING_PICKUP", label: "Picked Up", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { value: "IN_CLEANING", label: "Cleaning", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "DRYING", label: "Drying", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "READY", label: "Ready", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: "COMPLETED", label: "Delivered", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
] as const;

export const CARPET_TYPES = [
  "Persian/Oriental",
  "Shag",
  "Berber",
  "Frieze",
  "Sisal/Jute",
  "Area Rug",
  "Wall-to-Wall",
  "Silk",
] as const;

export const TAG_COLORS: Record<string, string> = {
  "VIP": "bg-amber-500 text-white",
  "Frequent": "bg-blue-500 text-white",
  "Corporate": "bg-slate-700 text-white",
  "One-time": "bg-gray-400 text-white",
};
