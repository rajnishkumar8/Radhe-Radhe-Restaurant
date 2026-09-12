import { desc, eq, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcryptjs";
import {
  AuditLog,
  Category,
  Coupon,
  CouponRedemption,
  DriverLocation,
  MenuItem,
  MenuVariant,
  Order,
  OrderItem,
  OrderStatusHistory,
  Payment,
  Profile,
  Reservation,
  OrderReview,
  RestaurantSettings,
  auditLogs,
  categories,
  couponRedemptions,
  coupons,
  deliveryAddresses,
  driverLocations,
  menuAddons,
  menuItems,
  menuVariants,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  profiles,
  reservations,
  orderReviews,
  restaurantSettings,
} from "../drizzle/schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

// Order number generation counter to prevent collisions under concurrency
let orderNumberCounter = 0;

// Atomic ID generators for memory store (thread-safe in single-threaded Node.js)
let orderIdCounter = 0;
let orderItemIdCounter = 0;
let paymentIdCounter = 0;
let auditLogIdCounter = 0;
let orderStatusHistoryIdCounter = 0;
let driverLocationIdCounter = 0;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres")) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect to PostgreSQL:", error);
    }
  }
  return _db;
}

// ============================================================
// IN-MEMORY FALLBACK STORE (Active when no live PostgreSQL URL is supplied)
// Guarantees zero-cost local operation, testing, and offline reliability.
// ============================================================

export interface SeedData {
  settings: RestaurantSettings;
  categories: Category[];
  menuItems: (MenuItem & { variants?: MenuVariant[]; addons?: any[] })[];
  orders: (Order & { items: (OrderItem & { addons?: any[] })[] })[];
  payments: Payment[];
  coupons: Coupon[];
  couponRedemptions: CouponRedemption[];
  reservations: Reservation[];
  orderReviews: OrderReview[];
  profiles: Profile[];
  auditLogs: AuditLog[];
  orderStatusHistory: OrderStatusHistory[];
  driverLocations: DriverLocation[];
}

const memoryStore: SeedData = {
  settings: {
    id: 1,
    restaurantName: "Shri Radhe Radhe Restaurant",
    tagline: "Authentic Dining & Culinary Hospitality on Lohna Road",
    phone: "+919876543210",
    email: "contact@radheradhe.com",
    whatsapp: "+919876543210",
    address: "Near Radhe Communication, Lohna Road, Dharampur, Manigachhi, Darbhanga, Bihar 847407",
    latitude: "26.2182293",
    longitude: "86.2272110",
    upiId: "radheradhe@upi",
    upiName: "Shri Radhe Radhe Restaurant",
    currency: "INR",
    orderingPaused: false,
    orderingPauseMessage: "We are temporarily paused for kitchen restock. Online orders will resume shortly.",
    busyMode: "normal",
    prepTimeNormal: 30,
    prepTimeBusy: 50,
    prepTimeVeryBusy: 75,
    minOrderAmount: "150.00",
    packagingFee: "25.00",
    taxPercentage: "5.00",
    baseDeliveryFee: "40.00",
    freeDeliveryThreshold: "499.00",
    announcementText: "Welcome to Radhe Radhe · Complimentary Kesari Phirni on orders above ₹799",
    updatedAt: new Date(),
  },
  categories: [
    { id: 1, name: "House Classics", slug: "house-classics", description: "Slow-simmered regional staples crafted over gentle embers.", imageUrl: "/images/hero-classic.webp", displayOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, name: "From the Fire", slug: "from-the-fire", description: "Charred marinated vegetables and paneer from our copper tandoor.", imageUrl: "/images/hero-tandoor.webp", displayOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 3, name: "Breads & Grains", slug: "breads-and-grains", description: "Freshly slapped rotis, kulchas, and fragrant aged basmati.", imageUrl: "/images/hero-breads.webp", displayOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 4, name: "Sweet Endings", slug: "sweet-endings", description: "Traditional halwas, kulfis, and festive desserts.", imageUrl: "/images/hero-desserts.webp", displayOrder: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ],
  menuItems: [
    {
      id: 1,
      categoryId: 1,
      name: "Royal Dal Makhani",
      slug: "royal-dal-makhani",
      description: "Slow-simmered black urad lentils, cultured churned butter, fresh tomato reduction, and sweet dried fenugreek.",
      shortDescription: "Slow-simmered black lentils with cultured butter.",
      price: "360.00",
      discountPrice: "320.00",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
      imagePlacement: "menu",
      dietary: "veg",
      spiceLevel: 1,
      prepTimeMinutes: 20,
      isFeatured: true,
      isBestseller: true,
      isAvailable: true,
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      categoryId: 2,
      name: "Saffron Paneer Tikka",
      slug: "saffron-paneer-tikka",
      description: "Handmade Malwa paneer steeped in Kashmiri saffron, crushed coriander seeds, hung curd, and kasundi mustard glaze.",
      shortDescription: "Saffron-marinated paneer charred over charcoal.",
      price: "420.00",
      discountPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
      imagePlacement: "hero",
      dietary: "veg",
      spiceLevel: 2,
      prepTimeMinutes: 25,
      isFeatured: true,
      isBestseller: true,
      isAvailable: true,
      displayOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      categoryId: 2,
      name: "Tandoori Stuffed Morel & Garden Plate",
      slug: "tandoori-stuffed-morel-garden",
      description: "Charred young seasonal vegetables, smoked hung curd, mint-coriander oil, and charred citrus.",
      shortDescription: "Charred harvest vegetables with mint oil.",
      price: "390.00",
      discountPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
      imagePlacement: "dining",
      dietary: "vegan",
      spiceLevel: 1,
      prepTimeMinutes: 20,
      isFeatured: true,
      isBestseller: false,
      isAvailable: true,
      displayOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      categoryId: 1,
      name: "Paneer Lababdar",
      slug: "paneer-lababdar",
      description: "Soft cottage cheese simmered in a rich, chunky cashew, roasted bell pepper, and onion-tomato gravy.",
      shortDescription: "Rich cottage cheese in cashew-tomato gravy.",
      price: "410.00",
      discountPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
      imagePlacement: "menu",
      dietary: "veg",
      spiceLevel: 2,
      prepTimeMinutes: 25,
      isFeatured: false,
      isBestseller: true,
      isAvailable: true,
      displayOrder: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 5,
      categoryId: 3,
      name: "Amritsari Chur Chur Kulcha",
      slug: "amritsari-chur-chur-kulcha",
      description: "Flaky layered leavened bread stuffed with spiced potato and crushed anardana, brushed with brown desi ghee.",
      shortDescription: "Flaky layered stuffed bread with desi ghee.",
      price: "160.00",
      discountPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
      imagePlacement: "menu",
      dietary: "veg",
      spiceLevel: 1,
      prepTimeMinutes: 15,
      isFeatured: false,
      isBestseller: true,
      isAvailable: true,
      displayOrder: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 6,
      categoryId: 4,
      name: "Kesari Matka Phirni",
      slug: "kesari-matka-phirni",
      description: "Slow-cooked ground rice pudding flavored with green cardamom, saffron strands, and toasted slivered pistachios.",
      shortDescription: "Chilled saffron rice pudding with pistachios.",
      price: "180.00",
      discountPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80",
      imagePlacement: "menu",
      dietary: "veg",
      spiceLevel: 0,
      prepTimeMinutes: 10,
      isFeatured: true,
      isBestseller: true,
      isAvailable: true,
      displayOrder: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  orders: [],
  payments: [],
  coupons: [
    {
      id: 1,
      code: "WELCOME50",
      description: "₹50 flat discount on your first online order",
      discountType: "flat",
      discountValue: "50.00",
      minCartValue: "299.00",
      maxDiscount: null,
      usageLimit: 500,
      perUserLimit: 1,
      startsAt: new Date("2026-01-01"),
      expiresAt: new Date("2026-12-31"),
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 2,
      code: "FESTIVE15",
      description: "15% discount on gourmet meals over ₹699",
      discountType: "percentage",
      discountValue: "15.00",
      minCartValue: "699.00",
      maxDiscount: "150.00",
      usageLimit: 1000,
      perUserLimit: 2,
      startsAt: new Date("2026-01-01"),
      expiresAt: new Date("2026-12-31"),
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 3,
      code: "FREEDEL",
      description: "Complimentary direct delivery on orders above ₹399",
      discountType: "free_delivery",
      discountValue: "40.00",
      minCartValue: "399.00",
      maxDiscount: "40.00",
      usageLimit: 2000,
      perUserLimit: 5,
      startsAt: new Date("2026-01-01"),
      expiresAt: new Date("2026-12-31"),
      isActive: true,
      createdAt: new Date(),
    },
  ],
  reservations: [],
  profiles: [
    {
      id: 1,
      authUserId: "admin",
      name: "Rajesh Sharma (Owner)",
      email: "owner@radheradhe.com",
      phone: "+919876543210",
      passwordHash: "Radhe@123",
      role: "owner",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    {
      id: 2,
      authUserId: "staff_01",
      name: "Vikram Singh (Order Staff)",
      email: "staff@radheradhe.com",
      phone: "+919876543211",
      passwordHash: "Staff@2026",
      role: "order_staff",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    {
      id: 3,
      authUserId: "driver_01",
      name: "Amit Kumar (Driver)",
      email: "driver@radheradhe.com",
      phone: "+919876543212",
      passwordHash: "Driver@2026",
      role: "driver",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  ],
  auditLogs: [],
  orderStatusHistory: [],
  couponRedemptions: [],
  driverLocations: [],
  orderReviews: [
    {
      id: 1,
      orderId: 1,
      userId: 1,
      customerNameSnapshot: "Aman Jha",
      rating: 5,
      comment: "The Royal Dal Makhani and Chur Chur Kulcha took me straight back to authentic regional banquets. Unrivalled hospitality right here on Lohna Road!",
      isPublished: true,
      createdAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      id: 2,
      orderId: 2,
      userId: null,
      customerNameSnapshot: "Pooja Chaudhary",
      rating: 5,
      comment: "Hosted my parents' 25th anniversary celebration here. The team arranged marigold decor, bespoke saffron paneer, and personalized service. Truly unforgettable.",
      isPublished: true,
      createdAt: new Date(Date.now() - 86400000 * 7),
    },
    {
      id: 3,
      orderId: 3,
      userId: null,
      customerNameSnapshot: "Dr. Rohit Mishra",
      rating: 5,
      comment: "Lightning-fast hot delivery in Dharampur. The packaging retained the tandoor crispness, and the Kesari Phirni was heavenly.",
      isPublished: true,
      createdAt: new Date(Date.now() - 86400000 * 12),
    },
  ],
};

// ============================================================
// PROFILES & AUTH REPOSITORY
// ============================================================

export async function upsertUser(user: {
  authUserId?: string;
  openId?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: Profile["role"];
  lastSignedIn?: Date;
}): Promise<Profile> {
  const authId = user.authUserId || user.openId;
  if (!authId) throw new Error("authUserId or openId is required for upsert");

  const db = await getDb();
  if (db) {
    const existing = await db.select().from(profiles).where(eq(profiles.authUserId, authId)).limit(1);
    if (existing.length > 0) {
      await db
        .update(profiles)
        .set({
          name: user.name ?? existing[0].name,
          email: user.email ?? existing[0].email,
          phone: user.phone ?? existing[0].phone,
          lastSignedIn: user.lastSignedIn ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(profiles.authUserId, authId));
      return (await db.select().from(profiles).where(eq(profiles.authUserId, authId)).limit(1))[0];
    } else {
      const [inserted] = await db
        .insert(profiles)
        .values({
          authUserId: authId,
          name: user.name ?? null,
          email: user.email ?? null,
          phone: user.phone ?? null,
          role: user.role ?? "customer",
          lastSignedIn: user.lastSignedIn ?? new Date(),
        })
        .returning();
      return inserted;
    }
  }

  // Memory store fallback
  const found = memoryStore.profiles.find(p => p.authUserId === authId);
  if (found) {
    if (user.name) found.name = user.name;
    if (user.email) found.email = user.email;
    if (user.phone) found.phone = user.phone;
    found.lastSignedIn = user.lastSignedIn ?? new Date();
    found.updatedAt = new Date();
    return found;
  }
  const newProfile: Profile = {
    id: memoryStore.profiles.length + 1,
    authUserId: authId,
    name: user.name ?? "Guest Diner",
    email: user.email ?? null,
    phone: user.phone ?? null,
    passwordHash: null,
    role: user.role ?? "customer",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: user.lastSignedIn ?? new Date(),
  };
  memoryStore.profiles.push(newProfile);
  return newProfile;
}

export async function getUserByOpenId(openId: string): Promise<Profile | undefined> {
  const db = await getDb();
  if (db) {
    const result = await db.select().from(profiles).where(eq(profiles.authUserId, openId)).limit(1);
    return result[0];
  }
  return memoryStore.profiles.find(p => p.authUserId === openId);
}

export async function getUserById(id: number): Promise<Profile | undefined> {
  const db = await getDb();
  if (db) {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }
  return memoryStore.profiles.find(p => p.id === id);
}

export async function updateUserProfile(
  id: number,
  data: { name?: string; email?: string | null; phone?: string | null }
): Promise<Profile> {
  const db = await getDb();
  if (db) {
    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.phone !== undefined) updatePayload.phone = data.phone;

    await db.update(profiles).set(updatePayload).where(eq(profiles.id, id));
    const [updated] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return updated;
  }

  // Memory store fallback
  const found = memoryStore.profiles.find(p => p.id === id);
  if (!found) throw new Error("Profile not found");
  if (data.name !== undefined) found.name = data.name;
  if (data.email !== undefined) found.email = data.email;
  if (data.phone !== undefined) found.phone = data.phone;
  found.updatedAt = new Date();
  return found;
}

export async function findUserByIdentifier(identifier: string): Promise<Profile | undefined> {
  const clean = identifier.trim().toLowerCase();
  const db = await getDb();
  if (db) {
    const result = await db
      .select()
      .from(profiles)
      .where(
        or(
          eq(profiles.email, clean),
          eq(profiles.phone, clean),
          eq(profiles.authUserId, clean)
        )
      )
      .limit(1);
    return result[0];
  }
  return memoryStore.profiles.find(
    p =>
      p.email?.toLowerCase() === clean ||
      p.phone?.toLowerCase() === clean ||
      p.authUserId?.toLowerCase() === clean
  );
}

export async function listTeamMembers(): Promise<Profile[]> {
  const db = await getDb();
  if (db) {
    return db
      .select()
      .from(profiles)
      .where(ne(profiles.role, "customer"))
      .orderBy(desc(profiles.createdAt));
  }
  return memoryStore.profiles.filter(p => p.role !== "customer");
}

export async function createTeamMember(data: {
  name: string;
  phone: string;
  email?: string;
  role: "order_staff" | "driver" | "manager";
  password?: string;
}): Promise<Profile> {
  const authUserId = `${data.role}_${Date.now().toString().slice(-4)}`;
  const rawPassword = data.password ?? `${data.role}@2026`;
  const passwordHash = await hashPassword(rawPassword);
  const db = await getDb();
  if (db) {
    const [inserted] = await db
      .insert(profiles)
      .values({
        authUserId,
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        role: data.role,
        passwordHash,
        lastSignedIn: new Date(),
      })
      .returning();
    return inserted;
  }
  const member: Profile = {
    id: memoryStore.profiles.length + 1,
    authUserId,
    name: data.name,
    email: data.email ?? null,
    phone: data.phone,
    passwordHash,
    role: data.role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  memoryStore.profiles.push(member);
  return member;
}

export async function removeTeamMember(id: number): Promise<{ success: true }> {
  if (id === 1) throw new Error("The Primary Owner account cannot be removed.");
  const db = await getDb();
  if (db) {
    await db.delete(profiles).where(eq(profiles.id, id));
    return { success: true };
  }
  const idx = memoryStore.profiles.findIndex(p => p.id === id);
  if (idx !== -1) memoryStore.profiles.splice(idx, 1);
  return { success: true };
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText: string, hashOrPlain: string): Promise<boolean> {
  if (!hashOrPlain) return false;
  if (hashOrPlain.startsWith("$2a$") || hashOrPlain.startsWith("$2b$") || hashOrPlain.startsWith("$2y$")) {
    return bcrypt.compare(plainText, hashOrPlain);
  }
  return plainText === hashOrPlain;
}

export async function verifyAndUpgradeUserPassword(
  user: Profile,
  plainText: string
): Promise<boolean> {
  if (!user.passwordHash) return false;
  const isValid = await verifyPassword(plainText, user.passwordHash);
  if (!isValid) return false;

  // Auto-upgrade plain text passwords (e.g. initial seeds) to bcrypt hash
  if (!user.passwordHash.startsWith("$2a$") && !user.passwordHash.startsWith("$2b$") && !user.passwordHash.startsWith("$2y$")) {
    const newHash = await hashPassword(plainText);
    await updateUserPassword(user.id, newHash);
    user.passwordHash = newHash;
  }
  return true;
}

export async function updateUserPassword(
  userId: number,
  newPasswordHash: string
): Promise<{ success: true }> {
  const db = await getDb();
  if (db) {
    await db
      .update(profiles)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(profiles.id, userId));
    return { success: true };
  }
  const profile = memoryStore.profiles.find(p => p.id === userId);
  if (!profile) throw new Error("User not found");
  profile.passwordHash = newPasswordHash;
  profile.updatedAt = new Date();
  return { success: true };
}

// ============================================================
// MENU & CATEGORIES REPOSITORY
// ============================================================

export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  if (db) {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.displayOrder);
  }
  return memoryStore.categories.filter(c => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function listMenuItems(filter?: {
  categoryId?: number;
  dietary?: MenuItem["dietary"];
  includeUnavailable?: boolean;
  search?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
}): Promise<MenuItem[]> {
  const db = await getDb();
  if (db) {
    let query = db.select().from(menuItems);
    // In PostgreSQL Drizzle, apply where conditions
    if (!filter?.includeUnavailable) {
      query = query.where(eq(menuItems.isAvailable, true)) as any;
    }
    return query.orderBy(menuItems.displayOrder, menuItems.id);
  }

  return memoryStore.menuItems.filter(item => {
    if (!filter?.includeUnavailable && !item.isAvailable) return false;
    if (filter?.categoryId && item.categoryId !== filter.categoryId) return false;
    if (filter?.dietary && item.dietary !== filter.dietary) return false;
    if (filter?.isFeatured && !item.isFeatured) return false;
    if (filter?.isBestseller && !item.isBestseller) return false;
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      const matches = item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });
}

export async function getMenuItemById(id: number): Promise<MenuItem | undefined> {
  const db = await getDb();
  if (db) {
    const result = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    return result[0];
  }
  return memoryStore.menuItems.find(m => m.id === id);
}

export async function createMenuItem(input: {
  name: string;
  description: string;
  categoryId: number;
  price: string;
  discountPrice?: string | null;
  imageUrl?: string | null;
  dietary?: MenuItem["dietary"];
  spiceLevel?: number;
  prepTimeMinutes?: number;
  isFeatured?: boolean;
  isBestseller?: boolean;
}): Promise<MenuItem> {
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Date.now().toString().slice(-4);
  const db = await getDb();
  if (db) {
    const [created] = await db
      .insert(menuItems)
      .values({
        name: input.name,
        slug,
        description: input.description,
        categoryId: input.categoryId,
        price: input.price,
        discountPrice: input.discountPrice ?? null,
        imageUrl: input.imageUrl ?? null,
        dietary: input.dietary ?? "veg",
        spiceLevel: input.spiceLevel ?? 0,
        prepTimeMinutes: input.prepTimeMinutes ?? 25,
        isFeatured: input.isFeatured ?? false,
        isBestseller: input.isBestseller ?? false,
        isAvailable: true,
      })
      .returning();
    return created;
  }

  const maxId = memoryStore.menuItems.length > 0 ? Math.max(...memoryStore.menuItems.map(m => m.id)) : 0;
  const nextId = maxId + 1;

  const newItem: MenuItem = {
    id: nextId,
    categoryId: input.categoryId,
    name: input.name,
    slug,
    description: input.description,
    shortDescription: input.description.slice(0, 80),
    price: input.price,
    discountPrice: input.discountPrice ?? null,
    imageUrl: input.imageUrl ?? null,
    imagePlacement: "menu",
    dietary: input.dietary ?? "veg",
    spiceLevel: input.spiceLevel ?? 0,
    prepTimeMinutes: input.prepTimeMinutes ?? 25,
    isFeatured: input.isFeatured ?? false,
    isBestseller: input.isBestseller ?? false,
    isAvailable: true,
    displayOrder: nextId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryStore.menuItems.push(newItem);
  return newItem;
}

export async function updateMenuItem(
  id: number,
  input: Partial<{
    name: string;
    description: string;
    categoryId: number;
    price: string;
    discountPrice: string | null;
    imageUrl: string | null;
    dietary: MenuItem["dietary"];
    spiceLevel: number;
    prepTimeMinutes: number;
    isFeatured: boolean;
    isBestseller: boolean;
    isAvailable: boolean;
  }>
): Promise<{ success: true }> {
  const db = await getDb();
  if (db) {
    await db.update(menuItems).set({ ...input, updatedAt: new Date() }).where(eq(menuItems.id, id));
    return { success: true };
  }

  const found = memoryStore.menuItems.find(m => m.id === id);
  if (found) {
    Object.assign(found, input, { updatedAt: new Date() });
  }
  return { success: true };
}

export async function deleteMenuItem(id: number): Promise<{ success: true }> {
  const db = await getDb();
  if (db) {
    await db.delete(menuItems).where(eq(menuItems.id, id));
    return { success: true };
  }
  const idx = memoryStore.menuItems.findIndex(m => m.id === id);
  if (idx !== -1) memoryStore.menuItems.splice(idx, 1);
  return { success: true };
}

// ============================================================
// COUPONS & CALCULATION ENGINE (SERVER AUTHORITATIVE)
// ============================================================

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
  const normalized = code.trim().toUpperCase();
  const db = await getDb();
  if (db) {
    const result = await db.select().from(coupons).where(eq(coupons.code, normalized)).limit(1);
    const coupon = result[0];
    if (coupon && !coupon.isActive) return undefined;
    return coupon;
  }
  return memoryStore.coupons.find(c => c.code === normalized && c.isActive);
}

export async function calculateCartTotals(input: {
  items: { menuItemId: number; quantity: number }[];
  couponCode?: string;
  fulfillmentType: "delivery" | "pickup";
  userId?: number;
}) {
  const settings = await getRestaurantSettings();

  // 1. Fetch authoritative menu items and calculate base subtotal
  let rawSubtotal = 0;
  const verifiedLines: {
    item: MenuItem;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[] = [];

  for (const requested of input.items) {
    const dish = await getMenuItemById(requested.menuItemId);
    if (!dish) throw new Error(`Dish #${requested.menuItemId} does not exist`);
    if (!dish.isAvailable) throw new Error(`Dish "${dish.name}" is currently sold out`);

    const effectivePrice = dish.discountPrice ? Number(dish.discountPrice) : Number(dish.price);
    const lineTotal = effectivePrice * requested.quantity;
    rawSubtotal += lineTotal;
    verifiedLines.push({
      item: dish,
      quantity: requested.quantity,
      unitPrice: effectivePrice,
      lineTotal,
    });
  }

  // 2. Evaluate Coupon
  let discountAmount = 0;
  let appliedCoupon: Coupon | null = null;
  if (input.couponCode) {
    const coupon = await getCouponByCode(input.couponCode);
    if (coupon && coupon.isActive) {
      let couponValid = true;
      
      // Check global usage limit
      if (coupon.usageLimit) {
        const db = await getDb();
        let totalUses = 0;
        if (db) {
          // In real DB, count from couponRedemptions table
          // For now, we can't easily count without adding a query function
          // This would need a separate function to count redemptions
        } else {
          totalUses = memoryStore.couponRedemptions.filter(r => r.couponId === coupon.id).length;
        }
        if (totalUses >= coupon.usageLimit) {
          couponValid = false; // Coupon exhausted
        }
      }

      // Check per-user limit
      if (couponValid && coupon.perUserLimit && input.userId) {
        const db = await getDb();
        let userUses = 0;
        if (db) {
          // Would need a query here
        } else {
          userUses = memoryStore.couponRedemptions.filter(
            r => r.couponId === coupon.id && r.userId === input.userId
          ).length;
        }
        if (userUses >= coupon.perUserLimit) {
          couponValid = false; // User already used max times
        }
      }

      const minCart = Number(coupon.minCartValue || 0);
      if (couponValid && rawSubtotal >= minCart) {
        appliedCoupon = coupon;
        if (coupon.discountType === "flat") {
          discountAmount = Math.min(Number(coupon.discountValue), rawSubtotal);
        } else if (coupon.discountType === "percentage") {
          const calc = (rawSubtotal * Number(coupon.discountValue)) / 100;
          discountAmount = coupon.maxDiscount ? Math.min(calc, Number(coupon.maxDiscount)) : calc;
        } else if (coupon.discountType === "free_delivery") {
          discountAmount = Number(settings.baseDeliveryFee);
        }
      }
    }
  }

  // 3. Packaging Fee
  const packagingFee = input.fulfillmentType === "delivery" ? Number(settings.packagingFee) : 0;

  // 4. Delivery Fee
  let deliveryFee = 0;
  if (input.fulfillmentType === "delivery") {
    if (rawSubtotal >= Number(settings.freeDeliveryThreshold) || appliedCoupon?.discountType === "free_delivery") {
      deliveryFee = 0;
    } else {
      deliveryFee = Number(settings.baseDeliveryFee);
    }
  }

  // 5. Tax (GST on taxable amount: subtotal - discount)
  const taxable = Math.max(0, rawSubtotal - discountAmount);
  const taxAmount = Number(((taxable * Number(settings.taxPercentage)) / 100).toFixed(2));

  // 6. Total
  const finalTotal = Number((taxable + packagingFee + deliveryFee + taxAmount).toFixed(2));

  return {
    subtotal: rawSubtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    packagingFee: packagingFee.toFixed(2),
    deliveryFee: deliveryFee.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalAmount: finalTotal.toFixed(2),
    appliedCouponCode: appliedCoupon?.code,
    lines: verifiedLines,
  };
}

// ============================================================
// ORDERS & LIFECYCLE REPOSITORY
// ============================================================

export async function createOrder(input: {
  userId?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType: "delivery" | "pickup";
  paymentMethod: Order["paymentMethod"];
  addressSnapshot?: string;
  addressNotes?: string;
  couponCode?: string;
  items: { menuItemId: number; quantity: number; specialInstructions?: string }[];
}): Promise<Order> {
  const calculation = await calculateCartTotals({
    items: input.items,
    couponCode: input.couponCode,
    fulfillmentType: input.fulfillmentType,
    userId: input.userId,
  });

  // Use counter + timestamp + random for collision-resistant order numbers
  orderNumberCounter = (orderNumberCounter + 1) % 10000;
  const orderNumber = `RR-${Date.now().toString(36).toUpperCase()}-${orderNumberCounter.toString().padStart(4, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const initialPaymentStatus =
    input.paymentMethod === "cash_on_delivery" || input.paymentMethod === "pay_at_pickup"
      ? "payment_pending_verification"
      : "payment_initiated";

  const db = await getDb();
  if (db) {
    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: input.userId ?? null,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail ?? null,
        fulfillmentType: input.fulfillmentType,
        paymentMethod: input.paymentMethod,
        paymentStatus: initialPaymentStatus,
        orderStatus: "pending_payment",
        addressSnapshot: input.addressSnapshot ?? null,
        addressNotes: input.addressNotes ?? null,
        subtotal: calculation.subtotal,
        discountAmount: calculation.discountAmount,
        packagingFee: calculation.packagingFee,
        deliveryFee: calculation.deliveryFee,
        taxAmount: calculation.taxAmount,
        totalAmount: calculation.totalAmount,
        couponCodeSnapshot: calculation.appliedCouponCode ?? null,
      })
      .returning();

    // Insert Order Items Snapshot
    for (const line of calculation.lines) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        menuItemId: line.item.id,
        itemNameSnapshot: line.item.name,
        variantNameSnapshot: "Standard",
        unitPriceSnapshot: line.unitPrice.toFixed(2),
        quantity: line.quantity,
        totalPriceSnapshot: line.lineTotal.toFixed(2),
      });
    }

    // Insert initial status history
    await db.insert(orderStatusHistory).values({
      orderId: newOrder.id,
      previousStatus: null,
      newStatus: "pending_payment",
      changedByUserId: input.userId ?? null,
      notes: "Order submitted by customer.",
    });

    // Record coupon redemption if applied
    if (calculation.appliedCouponCode) {
      const coupon = await getCouponByCode(calculation.appliedCouponCode);
      if (coupon) {
        await db.insert(couponRedemptions).values({
          couponId: coupon.id,
          orderId: newOrder.id,
          userId: input.userId ?? null,
          discountAmount: calculation.discountAmount,
        });
      }
    }

    return newOrder;
  }

  // Memory store fallback
  orderIdCounter += 1;
  const newOrder: Order = {
    id: orderIdCounter,
    orderNumber,
    userId: input.userId ?? null,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail ?? null,
    fulfillmentType: input.fulfillmentType,
    paymentMethod: input.paymentMethod,
    paymentStatus: initialPaymentStatus,
    orderStatus: "pending_payment",
    addressSnapshot: input.addressSnapshot ?? null,
    addressNotes: input.addressNotes ?? null,
    subtotal: calculation.subtotal,
    discountAmount: calculation.discountAmount,
    packagingFee: calculation.packagingFee,
    deliveryFee: calculation.deliveryFee,
    taxAmount: calculation.taxAmount,
    totalAmount: calculation.totalAmount,
    couponCodeSnapshot: calculation.appliedCouponCode ?? null,
    assignedDriverId: null,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const orderLines: OrderItem[] = calculation.lines.map((line) => {
    orderItemIdCounter += 1;
    return {
      id: orderItemIdCounter,
      orderId: newOrder.id,
      menuItemId: line.item.id,
      itemNameSnapshot: line.item.name,
      variantNameSnapshot: "Standard",
      unitPriceSnapshot: line.unitPrice.toFixed(2),
      quantity: line.quantity,
      totalPriceSnapshot: line.lineTotal.toFixed(2),
      specialInstructions: null,
    };
  });

  memoryStore.orders.unshift({ ...newOrder, items: orderLines } as any);

  // Add initial status history entry (matching DB version)
  orderStatusHistoryIdCounter += 1;
  memoryStore.orderStatusHistory.unshift({
    id: orderStatusHistoryIdCounter,
    orderId: newOrder.id,
    previousStatus: null,
    newStatus: "pending_payment",
    changedByUserId: input.userId ?? null,
    notes: "Order submitted by customer.",
    createdAt: new Date(),
  });

  // Record coupon redemption if applied (memory store)
  if (calculation.appliedCouponCode) {
    const coupon = await getCouponByCode(calculation.appliedCouponCode);
    if (coupon) {
      memoryStore.couponRedemptions.push({
        id: memoryStore.couponRedemptions.length + 1,
        couponId: coupon.id,
        orderId: newOrder.id,
        userId: input.userId ?? null,
        discountAmount: calculation.discountAmount,
        redeemedAt: new Date(),
      });
    }
  }

  return newOrder;
}

export async function listOrders(filter?: {
  userId?: number;
  status?: string;
  orderNumber?: string;
}): Promise<Order[]> {
  const db = await getDb();
  if (db) {
    let query = db.select().from(orders);
    if (filter?.userId) query = query.where(eq(orders.userId, filter.userId)) as any;
    if (filter?.status) query = query.where(eq(orders.orderStatus, filter.status as any)) as any;
    return query.orderBy(desc(orders.createdAt));
  }

  return memoryStore.orders.filter(order => {
    if (filter?.userId && order.userId !== filter.userId) return false;
    if (filter?.status && order.orderStatus !== filter.status) return false;
    if (filter?.orderNumber && !order.orderNumber.includes(filter.orderNumber)) return false;
    return true;
  });
}

export async function getOrderById(id: number): Promise<(Order & { items?: OrderItem[] }) | undefined> {
  const db = await getDb();
  if (db) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return undefined;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { ...order, items };
  }
  return memoryStore.orders.find(o => o.id === id);
}

export async function updateOrderStatus(
  id: number,
  status: Order["orderStatus"],
  changedByUserId?: number,
  notes?: string
): Promise<{ success: true }> {
  const db = await getDb();
  if (db) {
    const [current] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!current) throw new Error(`Order #${id} not found`);

    await db.update(orders).set({ orderStatus: status, updatedAt: new Date() }).where(eq(orders.id, id));
    await db.insert(orderStatusHistory).values({
      orderId: id,
      previousStatus: current.orderStatus,
      newStatus: status,
      changedByUserId: changedByUserId ?? null,
      notes: notes ?? null,
    });
    return { success: true };
  }

  const order = memoryStore.orders.find(o => o.id === id);
  if (!order) throw new Error(`Order #${id} not found`);
  const previousStatus = order.orderStatus;
  order.orderStatus = status;
  order.updatedAt = new Date();

  // Add status history entry (matching DB version)
  orderStatusHistoryIdCounter += 1;
  memoryStore.orderStatusHistory.unshift({
    id: orderStatusHistoryIdCounter,
    orderId: id,
    previousStatus,
    newStatus: status,
    changedByUserId: changedByUserId ?? null,
    notes: notes ?? null,
    createdAt: new Date(),
  });

  return { success: true };
}

// ============================================================
// DIRECT UPI PAYMENTS & VERIFICATION QUEUE
// ============================================================

export async function submitPaymentClaim(input: {
  orderId: number;
  method: string;
  upiReference?: string;
  proofImageUrl?: string;
}): Promise<Payment> {
  const order = await getOrderById(input.orderId);
  if (!order) throw new Error(`Order #${input.orderId} does not exist`);

  const db = await getDb();
  if (db) {
    const [payment] = await db
      .insert(payments)
      .values({
        orderId: input.orderId,
        method: input.method,
        amount: order.totalAmount,
        upiReference: input.upiReference ?? null,
        proofImageUrl: input.proofImageUrl ?? null,
        status: "payment_claimed",
      })
      .returning();

    await db
      .update(orders)
      .set({
        paymentStatus: "payment_claimed",
        orderStatus: "payment_claimed",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, input.orderId));

    await db.insert(orderStatusHistory).values({
      orderId: input.orderId,
      previousStatus: order.orderStatus,
      newStatus: "payment_claimed",
      notes: `Customer claimed UPI payment with UTR: ${input.upiReference || "N/A"}`,
    });

    return payment;
  }

  // Memory store fallback
  paymentIdCounter += 1;
  const payment: Payment = {
    id: paymentIdCounter,
    orderId: input.orderId,
    method: input.method,
    amount: order.totalAmount,
    upiReference: input.upiReference ?? null,
    proofImageUrl: input.proofImageUrl ?? null,
    status: "payment_claimed",
    verifiedByUserId: null,
    verifiedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryStore.payments.push(payment);
  const previousStatus = order.orderStatus;
  order.paymentStatus = "payment_claimed";
  order.orderStatus = "payment_claimed";

  // Add status history entry (matching DB version)
  orderStatusHistoryIdCounter += 1;
  memoryStore.orderStatusHistory.unshift({
    id: orderStatusHistoryIdCounter,
    orderId: input.orderId,
    previousStatus,
    newStatus: "payment_claimed",
    changedByUserId: null,
    notes: `Customer claimed UPI payment with UTR: ${input.upiReference || "N/A"}`,
    createdAt: new Date(),
  });

  return payment;
}

export async function listPayments(status?: Payment["status"]): Promise<Payment[]> {
  const db = await getDb();
  if (db) {
    let query = db.select().from(payments);
    if (status) query = query.where(eq(payments.status, status)) as any;
    return query.orderBy(desc(payments.createdAt));
  }
  return memoryStore.payments.filter(p => (status ? p.status === status : true));
}

export async function verifyPayment(
  paymentId: number,
  adminUserId: number
): Promise<{ success: true }> {
  const db = await getDb();
  if (db) {
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment) throw new Error("Payment record not found");

    await db
      .update(payments)
      .set({
        status: "payment_verified",
        verifiedByUserId: adminUserId,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    await db
      .update(orders)
      .set({
        paymentStatus: "payment_verified",
        orderStatus: "accepted",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, payment.orderId));

    await db.insert(orderStatusHistory).values({
      orderId: payment.orderId,
      previousStatus: "payment_claimed",
      newStatus: "accepted",
      changedByUserId: adminUserId,
      notes: "Payment verified by staff. Order accepted for kitchen preparation.",
    });

    return { success: true };
  }

  const payment = memoryStore.payments.find(p => p.id === paymentId);
  if (!payment) throw new Error("Payment record not found");
  payment.status = "payment_verified";
  payment.verifiedByUserId = adminUserId;
  payment.verifiedAt = new Date();

  const order = memoryStore.orders.find(o => o.id === payment.orderId);
  if (order) {
    const previousStatus = order.orderStatus;
    order.paymentStatus = "payment_verified";
    order.orderStatus = "accepted";

    // Add status history entry (matching DB version)
    orderStatusHistoryIdCounter += 1;
    memoryStore.orderStatusHistory.unshift({
      id: orderStatusHistoryIdCounter,
      orderId: payment.orderId,
      previousStatus,
      newStatus: "accepted",
      changedByUserId: adminUserId,
      notes: "Payment verified by staff. Order accepted for kitchen preparation.",
      createdAt: new Date(),
    });
  }
  return { success: true };
}

export async function rejectPayment(
  paymentId: number,
  adminUserId: number,
  rejectionReason: string
): Promise<{ success: true }> {
  const db = await getDb();
  if (db) {
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment) throw new Error("Payment record not found");

    await db
      .update(payments)
      .set({
        status: "payment_rejected",
        verifiedByUserId: adminUserId,
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    await db
      .update(orders)
      .set({
        paymentStatus: "payment_rejected",
        cancellationReason: `Payment Rejected: ${rejectionReason}`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, payment.orderId));

    return { success: true };
  }

  const payment = memoryStore.payments.find(p => p.id === paymentId);
  if (!payment) throw new Error("Payment record not found");
  payment.status = "payment_rejected";
  payment.verifiedByUserId = adminUserId;
  payment.rejectionReason = rejectionReason;

  const order = memoryStore.orders.find(o => o.id === payment.orderId);
  if (order) {
    const previousStatus = order.orderStatus;
    order.paymentStatus = "payment_rejected";
    order.cancellationReason = `Payment Rejected: ${rejectionReason}`;

    // Add status history entry (matching DB version - orderStatus becomes cancelled when payment rejected)
    orderStatusHistoryIdCounter += 1;
    memoryStore.orderStatusHistory.unshift({
      id: orderStatusHistoryIdCounter,
      orderId: payment.orderId,
      previousStatus,
      newStatus: "cancelled",
      changedByUserId: adminUserId,
      notes: `Payment Rejected: ${rejectionReason}`,
      createdAt: new Date(),
    });
  }
  return { success: true };
}

// ============================================================
// RESTAURANT SETTINGS & OPERATIONAL TOGGLES
// ============================================================

export async function getRestaurantSettings(): Promise<RestaurantSettings> {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(restaurantSettings).limit(1);
    if (rows.length > 0) return rows[0];
  }
  return memoryStore.settings;
}

export async function updateRestaurantSettings(input: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
  const db = await getDb();
  if (db) {
    await db.update(restaurantSettings).set({ ...input, updatedAt: new Date() }).where(eq(restaurantSettings.id, 1));
    return (await db.select().from(restaurantSettings).limit(1))[0];
  }
  Object.assign(memoryStore.settings, input, { updatedAt: new Date() });
  return memoryStore.settings;
}

// ============================================================
// DRIVER TELEMETRY & LIVE TRACKING
// ============================================================

export async function recordDriverLocation(input: {
  driverId: number;
  orderId: number;
  latitude: string;
  longitude: string;
  accuracy?: number;
}): Promise<{ success: true }> {
  const db = await getDb();
  if (db) {
    await db.insert(driverLocations).values({
      driverId: input.driverId,
      orderId: input.orderId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy ? String(input.accuracy) : null,
    });
    return { success: true };
  }

  driverLocationIdCounter += 1;
  memoryStore.driverLocations.push({
    id: driverLocationIdCounter,
    driverId: input.driverId,
    orderId: input.orderId,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy ? String(input.accuracy) : null,
    recordedAt: new Date(),
  });
  return { success: true };
}

export async function getLatestDriverLocation(orderId: number): Promise<DriverLocation | undefined> {
  const db = await getDb();
  if (db) {
    const rows = await db
      .select()
      .from(driverLocations)
      .where(eq(driverLocations.orderId, orderId))
      .orderBy(desc(driverLocations.recordedAt))
      .limit(1);
    return rows[0];
  }

  const matches = memoryStore.driverLocations.filter(d => d.orderId === orderId);
  return matches[matches.length - 1];
}

// ============================================================
// RESERVATIONS & AUDIT REPOSITORY
// ============================================================

export async function createReservation(input: {
  userId?: number;
  guestName: string;
  phone: string;
  email?: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  notes?: string;
}): Promise<Reservation> {
  const db = await getDb();
  if (db) {
    const [res] = await db
      .insert(reservations)
      .values({
        userId: input.userId ?? null,
        guestName: input.guestName,
        phone: input.phone,
        email: input.email ?? null,
        partySize: input.partySize,
        reservationDate: input.reservationDate,
        reservationTime: input.reservationTime,
        notes: input.notes ?? null,
        status: "requested",
      })
      .returning();
    return res;
  }

  const res: Reservation = {
    id: memoryStore.reservations.length + 1,
    userId: input.userId ?? null,
    guestName: input.guestName,
    phone: input.phone,
    email: input.email ?? null,
    partySize: input.partySize,
    reservationDate: input.reservationDate,
    reservationTime: input.reservationTime,
    notes: input.notes ?? null,
    status: "requested",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryStore.reservations.unshift(res);
  return res;
}

export async function listReservations(): Promise<Reservation[]> {
  const db = await getDb();
  if (db) {
    return db.select().from(reservations).orderBy(desc(reservations.createdAt));
  }
  return memoryStore.reservations;
}

export async function getDashboardSummary() {
  const allOrders = await listOrders();
  const allReservations = await listReservations();
  const allMenuItems = await listMenuItems({ includeUnavailable: true });
  const pendingPayments = await listPayments("payment_claimed");

  const today = new Date().toDateString();
  const todayOrders = allOrders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders
    .filter(o => o.orderStatus !== "cancelled")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return {
    todayRevenue: todayRevenue.toFixed(2),
    todayOrderCount: todayOrders.length,
    newOrders: allOrders.filter(o => o.orderStatus === "pending_payment").length,
    preparing: allOrders.filter(o => o.orderStatus === "preparing").length,
    ready: allOrders.filter(o => o.orderStatus === "ready").length,
    outForDelivery: allOrders.filter(o => o.orderStatus === "out_for_delivery").length,
    pendingPaymentsCount: pendingPayments.length,
    reservationsCount: allReservations.filter(r => r.status === "requested").length,
    totalMenuItems: allMenuItems.length,
  };
}

export async function recordAuditLog(input: {
  actorId?: number;
  actorRole?: string;
  action: string;
  resource: string;
  resourceId?: number;
  diffSnapshot?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.insert(auditLogs).values({
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      diffSnapshot: input.diffSnapshot ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
    return;
  }

  auditLogIdCounter += 1;
  memoryStore.auditLogs.unshift({
    id: auditLogIdCounter,
    actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? null,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    diffSnapshot: input.diffSnapshot ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    createdAt: new Date(),
  });
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  const db = await getDb();
  if (db) {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  }
  return memoryStore.auditLogs.slice(0, 100);
}

// ============================================================
// ORDER REVIEWS REPOSITORY
// ============================================================

export async function createOrderReview(input: {
  orderId: number;
  userId?: number | null;
  customerNameSnapshot: string;
  rating: number;
  comment?: string | null;
}): Promise<OrderReview> {
  const db = await getDb();
  if (db) {
    const [inserted] = await db
      .insert(orderReviews)
      .values({
        orderId: input.orderId,
        userId: input.userId ?? null,
        customerNameSnapshot: input.customerNameSnapshot,
        rating: Math.min(5, Math.max(1, Math.round(input.rating))),
        comment: input.comment ?? null,
        isPublished: true,
      })
      .returning();
    return inserted;
  }

  const newReview: OrderReview = {
    id: memoryStore.orderReviews.length + 1,
    orderId: input.orderId,
    userId: input.userId ?? null,
    customerNameSnapshot: input.customerNameSnapshot,
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    comment: input.comment ?? null,
    isPublished: true,
    createdAt: new Date(),
  };
  memoryStore.orderReviews.unshift(newReview);
  return newReview;
}

export async function listOrderReviews(limit = 10): Promise<OrderReview[]> {
  const db = await getDb();
  if (db) {
    return db
      .select()
      .from(orderReviews)
      .where(eq(orderReviews.isPublished, true))
      .orderBy(desc(orderReviews.createdAt))
      .limit(limit);
  }
  return memoryStore.orderReviews
    .filter((r) => r.isPublished)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export async function getOrderReviewByOrderId(orderId: number): Promise<OrderReview | null> {
  const db = await getDb();
  if (db) {
    const res = await db.select().from(orderReviews).where(eq(orderReviews.orderId, orderId)).limit(1);
    return res[0] ?? null;
  }
  return memoryStore.orderReviews.find((r) => r.orderId === orderId) ?? null;
}

