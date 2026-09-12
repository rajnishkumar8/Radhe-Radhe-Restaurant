import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "owner",
  "manager",
  "order_staff",
  "menu_manager",
  "driver",
]);

export const fulfillmentTypeEnum = pgEnum("fulfillment_type", ["delivery", "pickup"]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "direct_upi",
  "cash_on_delivery",
  "pay_at_pickup",
  "razorpay",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "payment_initiated",
  "payment_claimed",
  "payment_pending_verification",
  "payment_verified",
  "payment_rejected",
  "refund_pending",
  "refunded",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "payment_claimed",
  "payment_verified",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export const dietaryTypeEnum = pgEnum("dietary_type", [
  "veg",
  "non_veg",
  "egg",
  "vegan",
  "jain",
]);

export const couponTypeEnum = pgEnum("coupon_type", [
  "percentage",
  "flat",
  "free_delivery",
]);

export const busyModeEnum = pgEnum("busy_mode", ["normal", "busy", "very_busy"]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "requested",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
]);

// 1. Profiles & Users
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  authUserId: varchar("auth_user_id", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 160 }),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 32 }),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").default("customer").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Delivery Addresses
export const deliveryAddresses = pgTable("delivery_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 60 }).notNull(),
  addressLine: text("address_line").notNull(),
  city: varchar("city", { length: 100 }).default("Darbhanga").notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  landmark: varchar("landmark", { length: 160 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Menu Items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description").notNull(),
  shortDescription: varchar("short_description", { length: 255 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discountPrice: decimal("discount_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  imagePlacement: varchar("image_placement", { length: 40 }).default("menu").notNull(),
  dietary: dietaryTypeEnum("dietary").default("veg").notNull(),
  spiceLevel: integer("spice_level").default(0).notNull(),
  prepTimeMinutes: integer("prep_time_minutes").default(25).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isBestseller: boolean("is_bestseller").default(false).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Menu Variants (Sizes, Portions)
export const menuVariants = pgTable("menu_variants", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  priceDelta: decimal("price_delta", { precision: 10, scale: 2 }).default("0.00").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

// 6. Menu Add-on Groups & Add-ons
export const menuAddonGroups = pgTable("menu_addon_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  minSelection: integer("min_selection").default(0).notNull(),
  maxSelection: integer("max_selection").default(5).notNull(),
  isRequired: boolean("is_required").default(false).notNull(),
});

export const menuItemAddonGroups = pgTable("menu_item_addon_groups", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  addonGroupId: integer("addon_group_id").notNull().references(() => menuAddonGroups.id, { onDelete: "cascade" }),
});

export const menuAddons = pgTable("menu_addons", {
  id: serial("id").primaryKey(),
  addonGroupId: integer("addon_group_id").notNull().references(() => menuAddonGroups.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

// 7. Coupons
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  description: text("description"),
  discountType: couponTypeEnum("discount_type").notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minCartValue: decimal("min_cart_value", { precision: 10, scale: 2 }).default("0.00").notNull(),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  perUserLimit: integer("per_user_limit").default(1).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. Orders & Order Items
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 32 }).notNull().unique(),
  userId: integer("user_id").references(() => profiles.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
  customerEmail: varchar("customer_email", { length: 320 }),
  fulfillmentType: fulfillmentTypeEnum("fulfillment_type").default("delivery").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("direct_upi").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("payment_initiated").notNull(),
  orderStatus: orderStatusEnum("order_status").default("pending_payment").notNull(),
  addressSnapshot: text("address_snapshot"),
  addressNotes: text("address_notes"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  packagingFee: decimal("packaging_fee", { precision: 10, scale: 2 }).default("0.00").notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0.00").notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  couponCodeSnapshot: varchar("coupon_code_snapshot", { length: 32 }),
  assignedDriverId: integer("assigned_driver_id").references(() => profiles.id, { onDelete: "set null" }),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id").references(() => menuItems.id, { onDelete: "set null" }),
  itemNameSnapshot: varchar("item_name_snapshot", { length: 180 }).notNull(),
  variantNameSnapshot: varchar("variant_name_snapshot", { length: 100 }),
  unitPriceSnapshot: decimal("unit_price_snapshot", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  totalPriceSnapshot: decimal("total_price_snapshot", { precision: 10, scale: 2 }).notNull(),
  specialInstructions: varchar("special_instructions", { length: 255 }),
});

export const orderItemAddons = pgTable("order_item_addons", {
  id: serial("id").primaryKey(),
  orderItemId: integer("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  addonNameSnapshot: varchar("addon_name_snapshot", { length: 120 }).notNull(),
  addonPriceSnapshot: decimal("addon_price_snapshot", { precision: 10, scale: 2 }).notNull(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  previousStatus: varchar("previous_status", { length: 40 }),
  newStatus: varchar("new_status", { length: 40 }).notNull(),
  changedByUserId: integer("changed_by_user_id").references(() => profiles.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. Payments & UPI Verifications
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  method: varchar("method", { length: 30 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  upiReference: varchar("upi_reference", { length: 64 }),
  proofImageUrl: text("proof_image_url"),
  status: paymentStatusEnum("status").default("payment_initiated").notNull(),
  verifiedByUserId: integer("verified_by_user_id").references(() => profiles.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => profiles.id, { onDelete: "set null" }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. Restaurant Settings
export const restaurantSettings = pgTable("restaurant_settings", {
  id: integer("id").primaryKey().default(1),
  restaurantName: varchar("restaurant_name", { length: 160 }).default("Shri Radhe Radhe Restaurant").notNull(),
  tagline: varchar("tagline", { length: 200 }).default("Authentic Dining & Culinary Hospitality on Lohna Road").notNull(),
  phone: varchar("phone", { length: 32 }).default("+919876543210").notNull(),
  email: varchar("email", { length: 320 }).default("contact@radheradhe.com").notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }).default("+919876543210").notNull(),
  address: text("address").default("Near Radhe Communication, Lohna Road, Dharampur, Manigachhi, Darbhanga, Bihar 847407").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).default("26.2182293").notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).default("86.2272110").notNull(),
  upiId: varchar("upi_id", { length: 100 }).default("radheradhe@upi").notNull(),
  upiName: varchar("upi_name", { length: 160 }).default("Shri Radhe Radhe Restaurant").notNull(),
  currency: varchar("currency", { length: 10 }).default("INR").notNull(),
  orderingPaused: boolean("ordering_paused").default(false).notNull(),
  orderingPauseMessage: text("ordering_pause_message").default("We are temporarily paused for kitchen restock. Online orders will resume shortly.").notNull(),
  busyMode: busyModeEnum("busy_mode").default("normal").notNull(),
  prepTimeNormal: integer("prep_time_normal").default(30).notNull(),
  prepTimeBusy: integer("prep_time_busy").default(50).notNull(),
  prepTimeVeryBusy: integer("prep_time_very_busy").default(75).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default("150.00").notNull(),
  packagingFee: decimal("packaging_fee", { precision: 10, scale: 2 }).default("25.00").notNull(),
  taxPercentage: decimal("tax_percentage", { precision: 5, scale: 2 }).default("5.00").notNull(),
  baseDeliveryFee: decimal("base_delivery_fee", { precision: 10, scale: 2 }).default("40.00").notNull(),
  freeDeliveryThreshold: decimal("free_delivery_threshold", { precision: 10, scale: 2 }).default("499.00").notNull(),
  announcementText: text("announcement_text"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 11. Driver Telemetry
export const driverLocations = pgTable("driver_locations", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  accuracy: decimal("accuracy", { precision: 6, scale: 2 }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});

// 12. Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").references(() => profiles.id, { onDelete: "set null" }),
  actorRole: varchar("actor_role", { length: 32 }),
  action: varchar("action", { length: 80 }).notNull(),
  resource: varchar("resource", { length: 60 }).notNull(),
  resourceId: integer("resource_id"),
  diffSnapshot: jsonb("diff_snapshot"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 14. Order Reviews
export const orderReviews = pgTable("order_reviews", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => profiles.id, { onDelete: "set null" }),
  customerNameSnapshot: varchar("customer_name_snapshot", { length: 160 }).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 13. Table Reservations
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => profiles.id, { onDelete: "set null" }),
  guestName: varchar("guest_name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }),
  partySize: integer("party_size").notNull(),
  reservationDate: varchar("reservation_date", { length: 32 }).notNull(),
  reservationTime: varchar("reservation_time", { length: 16 }).notNull(),
  status: reservationStatusEnum("status").default("requested").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Inferred Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type User = Profile;
export type InsertUser = InsertProfile;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;
export type MenuVariant = typeof menuVariants.$inferSelect;
export type MenuAddon = typeof menuAddons.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type RestaurantSettings = typeof restaurantSettings.$inferSelect;
export type DriverLocation = typeof driverLocations.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type CouponRedemption = typeof couponRedemptions.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type OrderReview = typeof orderReviews.$inferSelect;
export type InsertOrderReview = typeof orderReviews.$inferInsert;
