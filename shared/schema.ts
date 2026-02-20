import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
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

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("customer"),
  otpCode: text("otp_code"),
  otpExpiry: timestamp("otp_expiry"),
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
  fileKey: text("file_key").notNull(),
  mimeType: text("mime_type").notNull(),
  category: text("category").notNull().default("general"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, otpCode: true, otpExpiry: true });
export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({ id: true });
export const insertDeliveryZoneSchema = createInsertSchema(deliveryZones).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertOrderPhotoSchema = createInsertSchema(orderPhotos).omit({ id: true, uploadedAt: true });
export const insertMediaSchema = createInsertSchema(mediaLibrary).omit({ id: true, uploadedAt: true });

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
  { value: "AWAITING_PICKUP", label: "Awaiting Pickup", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { value: "IN_CLEANING", label: "In Cleaning", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "DRYING", label: "Drying", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "READY", label: "Ready", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: "COMPLETED", label: "Completed", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
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
