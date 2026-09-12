import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { commerceRouter } from "./routers/commerce";
import { adminProcedure, driverProcedure, protectedProcedure, publicProcedure, router, staffProcedure } from "./_core/trpc";
import {
  calculateCartTotals,
  createMenuItem,
  createOrder,
  createReservation,
  deleteMenuItem,
  getDashboardSummary,
  getLatestDriverLocation,
  getMenuItemById,
  getOrderById,
  getRestaurantSettings,
  getUserById,
  getUserByOpenId,
  listAuditLogs,
  listCategories,
  listMenuItems,
  listOrders,
  listPayments,
  listReservations,
  recordAuditLog,
  recordDriverLocation,
  rejectPayment,
  submitPaymentClaim,
  updateMenuItem,
  updateOrderStatus,
  updateRestaurantSettings,
  createTeamMember,
  findUserByIdentifier,
  listTeamMembers,
  removeTeamMember,
  updateUserPassword,
  hashPassword,
  verifyPassword,
  verifyAndUpgradeUserPassword,
  updateUserProfile,
  upsertUser,
  verifyPayment,
  createOrderReview,
  listOrderReviews,
  getOrderReviewByOrderId,
} from "./db";
import { directUpiProvider } from "./services/payment/PaymentProvider";
import { mapProvider } from "./services/maps/MapProvider";
import { storageService } from "./services/storage/StorageProvider";

// Zod Schemas
const cartItemInput = z.object({
  menuItemId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
  specialInstructions: z.string().max(200).optional(),
  nameSnapshot: z.string().optional(),
  priceSnapshot: z.string().optional(),
});

export const appRouter = router({
  system: systemRouter,
  commerce: commerceRouter,

  // ============================================================
  // AUTH ROUTER
  // ============================================================
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),

    // Customer Registration (Role is ALWAYS "customer")
    customerRegister: publicProcedure
      .input(
        z.object({
          name: z.string().min(2, "Full name must be at least 2 characters").max(100),
          phone: z.string().min(10, "Valid 10-digit phone number is required").max(15),
          email: z.string().email("Valid email required").optional().or(z.literal("")),
          password: z.string().min(6, "Password must be at least 6 characters").optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const cleanPhone = input.phone.replace(/[\s-]/g, "");
        const authUserId = `cust_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
        const profile = await upsertUser({
          authUserId,
          name: input.name,
          phone: cleanPhone,
          email: input.email || null,
          role: "customer",
          lastSignedIn: new Date(),
        });

        if (input.password) {
          const hashedPassword = await hashPassword(input.password);
          await updateUserPassword(profile.id, hashedPassword);
        }

        const token = await sdk.createSessionToken(profile.authUserId, {
          name: profile.name || "Customer",
          expiresInMs: ONE_YEAR_MS,
        });

        ctx.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: ONE_YEAR_MS,
        });

        return { success: true, profile, token };
      }),

    // Customer Login (Phone or Email)
    customerLogin: publicProcedure
      .input(
        z.object({
          identifier: z.string().min(3, "Enter phone number or email"),
          password: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await findUserByIdentifier(input.identifier);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No customer account found with this phone/email. Please register first.",
          });
        }

        if (user.passwordHash && input.password) {
          const valid = await verifyAndUpgradeUserPassword(user, input.password);
          if (!valid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Incorrect password. Please try again.",
            });
          }
        }

        const token = await sdk.createSessionToken(user.authUserId, {
          name: user.name || "Customer",
          expiresInMs: ONE_YEAR_MS,
        });

        ctx.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: ONE_YEAR_MS,
        });

        return { success: true, profile: user, token };
      }),

    // Administrator & Staff Login (Credentials strictly validated server-side)
    adminLogin: publicProcedure
      .input(
        z.object({
          username: z.string().min(2, "Enter admin username or email"),
          password: z.string().min(4, "Enter admin password"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await findUserByIdentifier(input.username);
        if (!user || !["owner", "manager", "order_staff"].includes(user.role)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid administrator or staff credentials.",
          });
        }

        if (user.passwordHash) {
          const valid = await verifyAndUpgradeUserPassword(user, input.password);
          if (!valid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Incorrect administrator password.",
            });
          }
        }

        await recordAuditLog({
          actorId: user.id,
          actorRole: user.role,
          action: "admin_login_success",
          resource: "admin_portal",
        });

        const token = await sdk.createSessionToken(user.authUserId, {
          name: user.name || "Administrator",
          expiresInMs: ONE_YEAR_MS,
        });

        ctx.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: ONE_YEAR_MS,
        });

        return { success: true, profile: user, token };
      }),

    // Delivery Driver Login (Credentials assigned by admin)
    driverLogin: publicProcedure
      .input(
        z.object({
          phoneOrUsername: z.string().min(3, "Enter assigned driver phone or ID"),
          password: z.string().min(3, "Enter password"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await findUserByIdentifier(input.phoneOrUsername);
        if (!user || user.role !== "driver") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "No delivery driver profile associated with these credentials.",
          });
        }

        if (user.passwordHash) {
          const valid = await verifyAndUpgradeUserPassword(user, input.password);
          if (!valid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Incorrect driver password.",
            });
          }
        }

        const token = await sdk.createSessionToken(user.authUserId, {
          name: user.name || "Delivery Driver",
          expiresInMs: ONE_YEAR_MS,
        });

        ctx.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: ONE_YEAR_MS,
        });

        return { success: true, profile: user, token };
      }),

    // Change Password for Authenticated User (Owner or Customer)
    changePassword: protectedProcedure
      .input(
        z.object({
          currentPassword: z.string().optional(),
          newPassword: z.string().min(6, "New password must be at least 6 characters"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });

        if (user.passwordHash && input.currentPassword) {
          const valid = await verifyPassword(input.currentPassword, user.passwordHash);
          if (!valid) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Current password does not match.",
            });
          }
        }

        const hashed = await hashPassword(input.newPassword);
        await updateUserPassword(user.id, hashed);
        await recordAuditLog({
          actorId: user.id,
          actorRole: user.role,
          action: "password_changed",
          resource: "profiles",
          resourceId: user.id,
        });

        return { success: true };
      }),

    // Update Profile Details (Name, Email, Phone) for Authenticated User
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
          email: z.string().email("Valid email required").optional().or(z.literal("")),
          phone: z.string().min(10, "Valid 10-digit phone number is required").max(15).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const updateData: { name?: string; email?: string | null; phone?: string | null } = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.email !== undefined) updateData.email = input.email || null;
        if (input.phone !== undefined) updateData.phone = input.phone;

        const updated = await updateUserProfile(ctx.user.id, updateData);

        await recordAuditLog({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "profile_updated",
          resource: "profiles",
          resourceId: ctx.user.id,
          diffSnapshot: updateData,
        });

        return { success: true, profile: updated };
      }),

    // Development-only role switch helper for testing (Disabled in production)
    loginAsRole: publicProcedure
      .input(
        z.object({
          role: z.enum(["owner", "order_staff", "driver", "customer"]),
          name: z.string().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (process.env.NODE_ENV === "production") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Development backdoor loginAsRole is strictly disabled in production.",
          });
        }
        const authUserId = input.role === "owner" ? "admin" : `demo_${input.role}_${Date.now().toString().slice(-4)}`;
        const displayName =
          input.name ||
          (input.role === "owner"
            ? "Rajesh Sharma (Owner)"
            : input.role === "order_staff"
            ? "Vikram Singh (Staff)"
            : input.role === "driver"
            ? "Amit Kumar (Driver)"
            : "Priya Sharma (Customer)");

        const profile = await upsertUser({
          authUserId,
          name: displayName,
          email: `${input.role}@radheradhe.com`,
          phone: input.phone || "+919876543210",
          role: input.role as any,
          lastSignedIn: new Date(),
        });

        const token = await sdk.createSessionToken(authUserId, {
          name: displayName,
          expiresInMs: ONE_YEAR_MS,
        });

        ctx.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: ONE_YEAR_MS,
        });

        return { success: true, profile };
      }),
  }),

  // ============================================================
  // PUBLIC MENU & CATEGORY DISCOVERY
  // ============================================================
  menu: router({
    list: publicProcedure
      .input(
        z
          .object({
            categoryId: z.number().optional(),
            dietary: z.enum(["veg", "non_veg", "egg", "vegan", "jain"]).optional(),
            search: z.string().optional(),
            isFeatured: z.boolean().optional(),
            isBestseller: z.boolean().optional(),
            includeUnavailable: z.boolean().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return listMenuItems(input);
      }),
    categories: publicProcedure.query(async () => {
      return listCategories();
    }),
    byId: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      return getMenuItemById(input.id);
    }),
  }),

  // ============================================================
  // CART & PRICING ENGINE (SERVER AUTHORITATIVE)
  // ============================================================
  cart: router({
    calculate: publicProcedure
      .input(
        z.object({
          items: z.array(cartItemInput).min(1).max(50),
          couponCode: z.string().max(32).optional(),
          fulfillmentType: z.enum(["delivery", "pickup"]).default("delivery"),
        })
      )
      .mutation(async ({ input }) => {
        return calculateCartTotals(input);
      }),
  }),

  // ============================================================
  // CUSTOMER ORDERING & TRACKING
  // ============================================================
  customer: router({
    placeOrder: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(2, "Full name must be at least 2 characters").max(160),
          customerPhone: z.string().regex(/^\+?[0-9]{10,14}$/, "Valid 10–14 digit phone number is required"),
          customerEmail: z.string().email().optional().or(z.literal("")),
          fulfillmentType: z.enum(["delivery", "pickup"]),
          paymentMethod: z.enum(["direct_upi", "cash_on_delivery", "pay_at_pickup", "razorpay"]),
          addressSnapshot: z.string().max(800).optional(),
          addressNotes: z.string().max(300).optional(),
          couponCode: z.string().max(32).optional(),
          items: z.array(cartItemInput).min(1, "Cart cannot be empty").max(50),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Enforce ordering paused status from restaurant settings
        const settings = await getRestaurantSettings();
        if (settings.orderingPaused) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: settings.orderingPauseMessage || "Online ordering is temporarily paused by the restaurant.",
          });
        }

        if (input.fulfillmentType === "delivery" && input.paymentMethod === "pay_at_pickup") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Pay at pickup is not available for home delivery orders.",
          });
        }

        if (input.fulfillmentType === "pickup" && input.paymentMethod === "cash_on_delivery") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cash on delivery is not applicable for pickup orders.",
          });
        }

        if (input.fulfillmentType === "delivery" && (!input.addressSnapshot || input.addressSnapshot.trim().length < 10)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A complete delivery address with landmark and PIN code is required.",
          });
        }

        return createOrder({
          ...input,
          customerEmail: input.customerEmail || undefined,
          userId: ctx.user?.id,
        });
      }),

    getOrder: publicProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new Error("Order not found");
        return order;
      }),

    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return listOrders({ userId: ctx.user.id });
    }),

    reserve: publicProcedure
      .input(
        z.object({
          guestName: z.string().min(2).max(160),
          phone: z.string().min(10).max(15),
          email: z.string().email().optional(),
          partySize: z.number().int().min(1).max(200),
          reservationDate: z.string().min(8).max(32),
          reservationTime: z.string().min(3).max(16),
          notes: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createReservation({ ...input, userId: ctx.user?.id });
      }),

    submitReview: publicProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
          rating: z.number().int().min(1).max(5),
          comment: z.string().max(500).optional(),
          customerName: z.string().min(1).max(120).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
        }
        const existing = await getOrderReviewByOrderId(input.orderId);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "This order has already been reviewed. Thank you!" });
        }

        const customerName =
          ctx.user?.name ||
          input.customerName ||
          order.customerName ||
          "Valued Guest";

        const review = await createOrderReview({
          orderId: input.orderId,
          userId: ctx.user?.id ?? null,
          customerNameSnapshot: customerName,
          rating: input.rating,
          comment: input.comment,
        });

        await recordAuditLog({
          actorId: ctx.user?.id,
          actorRole: ctx.user?.role || "customer",
          action: "SUBMIT_ORDER_REVIEW",
          resource: "order_reviews",
          resourceId: review.id,
          diffSnapshot: { orderId: input.orderId, rating: input.rating },
        });

        return review;
      }),

    getOrderReview: publicProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return getOrderReviewByOrderId(input.orderId);
      }),

    addresses: protectedProcedure.query(async () => {
      return [];
    }),

    saveAddress: protectedProcedure
      .input(
        z.object({
          label: z.string().min(1).max(80),
          addressLine: z.string().min(5).max(500),
          city: z.string().min(2).max(100),
          postalCode: z.string().min(3).max(24),
          landmark: z.string().max(160).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return { id: 1, ...input };
      }),
  }),

  // ============================================================
  // DIRECT UPI PAYMENT & CLAIMS
  // ============================================================
  payment: router({
    getUpiIntent: publicProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new Error("Order not found");

        const settings = await getRestaurantSettings();
        return directUpiProvider.generateIntent({
          orderNumber: order.orderNumber,
          amount: String(order.totalAmount),
          upiId: settings.upiId,
          payeeName: settings.upiName,
          note: `Order ${order.orderNumber} - Radhe Radhe`,
        });
      }),

    claimPayment: publicProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
          upiReference: z.string().min(4, "Please enter your 12-digit UPI reference / UTR").max(64),
          proofImageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return submitPaymentClaim({
          orderId: input.orderId,
          method: "direct_upi",
          upiReference: input.upiReference,
          proofImageUrl: input.proofImageUrl,
        });
      }),
  }),

  // ============================================================
  // DRIVER DISPATCH & LIVE LOCATION TELEMETRY (/driver)
  // ============================================================
  driver: router({
    assignedOrders: driverProcedure.query(async ({ ctx }) => {
      const orders = await listOrders();
      return orders.filter(
        o =>
          (o.assignedDriverId === ctx.user.id || !o.assignedDriverId) &&
          ["ready", "out_for_delivery"].includes(o.orderStatus)
      );
    }),

    sendLocationPing: driverProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
          latitude: z.string(),
          longitude: z.string(),
          accuracy: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return recordDriverLocation({
          driverId: ctx.user.id,
          orderId: input.orderId,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
        });
      }),

    startDelivery: driverProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        return updateOrderStatus(input.orderId, "out_for_delivery", ctx.user.id, "Driver started delivery");
      }),

    markDelivered: driverProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        return updateOrderStatus(input.orderId, "delivered", ctx.user.id, "Driver handed over order to customer");
      }),
  }),

  // ============================================================
  // CUSTOMER LIVE DELIVERY TRACKING
  // ============================================================
  tracking: router({
    getLiveStatus: publicProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new Error("Order not found");

        const settings = await getRestaurantSettings();
        const restaurantCoords: [number, number] = [Number(settings.latitude), Number(settings.longitude)];

        // Driver coordinates only emitted when order is actively OUT_FOR_DELIVERY
        let driverCoords: [number, number] | null = null;
        let distanceEst = null;

        if (order.orderStatus === "out_for_delivery") {
          const latest = await getLatestDriverLocation(order.id);
          if (latest) {
            driverCoords = [Number(latest.latitude), Number(latest.longitude)];
            distanceEst = mapProvider.calculateDistance(driverCoords, restaurantCoords);
          }
        }

        return {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          orderStatus: order.orderStatus,
          fulfillmentType: order.fulfillmentType,
          addressSnapshot: order.addressSnapshot,
          restaurantCoords,
          restaurantAddress: settings.address,
          driverCoords,
          distanceEstimate: distanceEst,
          tileStyleUrl: mapProvider.getTileStyleUrl(),
          attribution: mapProvider.getAttribution(),
        };
      }),
  }),

  // ============================================================
  // RESTAURANT OPERATIONS & ADMIN CONSOLE (/admin)
  // ============================================================
  operations: router({
    summary: staffProcedure.query(async () => {
      return getDashboardSummary();
    }),

    orders: staffProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return listOrders({ status: input?.status });
      }),

    updateOrderStatus: staffProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.enum([
            "pending_payment",
            "payment_claimed",
            "payment_verified",
            "accepted",
            "preparing",
            "ready",
            "out_for_delivery",
            "delivered",
            "cancelled",
          ]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await recordAuditLog({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "order_status_updated",
          resource: "orders",
          resourceId: input.id,
          diffSnapshot: { newStatus: input.status, notes: input.notes },
        });
        return updateOrderStatus(input.id, input.status, ctx.user.id, input.notes);
      }),

    pendingPayments: staffProcedure.query(async () => {
      return listPayments("payment_claimed");
    }),

    verifyPayment: staffProcedure
      .input(z.object({ paymentId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await recordAuditLog({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "payment_verified",
          resource: "payments",
          resourceId: input.paymentId,
        });
        return verifyPayment(input.paymentId, ctx.user.id);
      }),

    rejectPayment: staffProcedure
      .input(
        z.object({
          paymentId: z.number().int().positive(),
          reason: z.string().min(3).max(200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await recordAuditLog({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "payment_rejected",
          resource: "payments",
          resourceId: input.paymentId,
          diffSnapshot: { reason: input.reason },
        });
        return rejectPayment(input.paymentId, ctx.user.id, input.reason);
      }),

    reservations: staffProcedure.query(async () => {
      return listReservations();
    }),
  }),

  // ============================================================
  // ADMIN CMS, SETTINGS & AUDIT LOGS
  // ============================================================
  admin: router({
    getSettings: adminProcedure.query(async () => {
      return getRestaurantSettings();
    }),

    updateSettings: adminProcedure
      .input(
        z.object({
          restaurantName: z.string().optional(),
          tagline: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          address: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          upiId: z.string().optional(),
          upiName: z.string().optional(),
          packagingFee: z.string().optional(),
          taxPercentage: z.string().optional(),
          baseDeliveryFee: z.string().optional(),
          freeDeliveryThreshold: z.string().optional(),
          orderingPaused: z.boolean().optional(),
          orderingPauseMessage: z.string().optional(),
          busyMode: z.enum(["normal", "busy", "very_busy"]).optional(),
          announcementText: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await recordAuditLog({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "settings_updated",
          resource: "restaurant_settings",
          diffSnapshot: input,
        });
        return updateRestaurantSettings(input as any);
      }),

    toggleOrderPause: adminProcedure
      .input(z.object({ paused: z.boolean(), message: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await recordAuditLog({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: input.paused ? "orders_paused" : "orders_resumed",
          resource: "restaurant_settings",
          diffSnapshot: input,
        });
        return updateRestaurantSettings({
          orderingPaused: input.paused,
          orderingPauseMessage: input.message || "Online ordering is temporarily paused.",
        });
      }),

    createMenuItem: adminProcedure
      .input(
        z.object({
          name: z.string().min(1, "Dish name is required"),
          description: z.string().min(1, "Description is required"),
          categoryId: z.number().int().positive("Category is required"),
          price: z.string().min(1, "Price is required"),
          discountPrice: z.string().optional().nullable(),
          imageUrl: z.string().optional().nullable(),
          dietary: z.enum(["veg", "non_veg", "egg", "vegan", "jain"]).default("veg"),
          spiceLevel: z.number().int().min(0).max(3).default(0),
          prepTimeMinutes: z.number().int().min(1).max(180).default(25),
          isFeatured: z.boolean().default(false),
          isBestseller: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const cleanPrice = input.price.replace(/[^0-9.]/g, "");
        if (!cleanPrice || !/^\d+(\.\d{1,2})?$/.test(cleanPrice)) {
          throw new Error("Valid price is required (e.g. 350 or 350.00)");
        }
        let cleanDiscount: string | null = null;
        if (input.discountPrice) {
          const disc = input.discountPrice.replace(/[^0-9.]/g, "");
          if (/^\d+(\.\d{1,2})?$/.test(disc)) {
            cleanDiscount = disc;
          }
        }
        const item = await createMenuItem({
          ...input,
          price: cleanPrice,
          discountPrice: cleanDiscount,
        });
        await recordAuditLog({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "menu_item_created",
          resource: "menu_items",
          resourceId: item.id,
          diffSnapshot: input,
        });
        return item;
      }),

    updateMenuItem: adminProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(1).optional(),
          description: z.string().min(1).optional(),
          categoryId: z.number().int().positive().optional(),
          price: z.string().optional(),
          discountPrice: z.string().optional().nullable(),
          imageUrl: z.string().optional().nullable(),
          dietary: z.enum(["veg", "non_veg", "egg", "vegan", "jain"]).optional(),
          spiceLevel: z.number().int().min(0).max(3).optional(),
          prepTimeMinutes: z.number().int().min(1).max(180).optional(),
          isFeatured: z.boolean().optional(),
          isBestseller: z.boolean().optional(),
          isAvailable: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...changes } = input;
        const sanitized: Record<string, any> = { ...changes };
        if (changes.price) {
          const clean = changes.price.replace(/[^0-9.]/g, "");
          if (/^\d+(\.\d{1,2})?$/.test(clean)) {
            sanitized.price = clean;
          }
        }
        if (changes.discountPrice !== undefined) {
          if (changes.discountPrice) {
            const cleanDisc = changes.discountPrice.replace(/[^0-9.]/g, "");
            sanitized.discountPrice = /^\d+(\.\d{1,2})?$/.test(cleanDisc) ? cleanDisc : null;
          } else {
            sanitized.discountPrice = null;
          }
        }
        await recordAuditLog({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "menu_item_updated",
          resource: "menu_items",
          resourceId: id,
          diffSnapshot: sanitized,
        });
        return updateMenuItem(id, sanitized);
      }),

    deleteMenuItem: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await recordAuditLog({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "menu_item_deleted",
          resource: "menu_items",
          resourceId: input.id,
        });
        return deleteMenuItem(input.id);
      }),

    uploadImage: staffProcedure
      .input(z.object({ base64Data: z.string(), originalName: z.string().optional() }))
      .mutation(async ({ input }) => {
        return storageService.saveBase64Image(input.base64Data, input.originalName);
      }),

    auditLogs: adminProcedure.query(async () => {
      return listAuditLogs();
    }),

    teamMembers: adminProcedure.query(async () => {
      return listTeamMembers();
    }),

    createTeamMember: adminProcedure
      .input(
        z.object({
          name: z.string().min(2, "Name required"),
          phone: z.string().min(10, "10-digit phone required"),
          email: z.string().email().optional().or(z.literal("")),
          role: z.enum(["order_staff", "driver", "manager"]),
          password: z.string().min(4).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const member = await createTeamMember({
          ...input,
          email: input.email || undefined,
        });
        await recordAuditLog({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "staff_member_created",
          resource: "profiles",
          resourceId: member.id,
          diffSnapshot: { name: input.name, role: input.role, phone: input.phone },
        });
        return member;
      }),

    removeTeamMember: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await recordAuditLog({
          actorId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "staff_member_removed",
          resource: "profiles",
          resourceId: input.id,
        });
        return removeTeamMember(input.id);
      }),
  }),

  // ============================================================
  // PUBLIC RESTAURANT INFO & SETTINGS
  // ============================================================
  restaurant: router({
    publicSettings: publicProcedure.query(async () => {
      const s = await getRestaurantSettings();
      return {
        restaurantName: s?.restaurantName || "Shri Radhe Radhe Restaurant",
        tagline: s?.tagline || "Authentic Pure Vegetarian Flavors",
        phone: s?.phone || "+919876543210",
        whatsapp: s?.whatsapp || "+919876543210",
        email: s?.email || "radheradhekitchen@gmail.com",
        address: s?.address || "Near Radhe Communication, Lohna Road, Dharampur, Manigachhi, Darbhanga",
        busyMode: s?.busyMode || "normal",
        orderingPaused: Boolean(s?.orderingPaused),
        orderingPauseMessage: s?.orderingPauseMessage || "Ordering is temporarily paused.",
        upiId: s?.upiId || "9876543210@upi",
        packagingFee: s?.packagingFee || "20.00",
        baseDeliveryFee: s?.baseDeliveryFee || "40.00",
        freeDeliveryThreshold: s?.freeDeliveryThreshold || "500.00",
        // Daily special / announcement — set by admin via updateSettings.announcementText
        dailySpecial: s?.announcementText || null,
      };
    }),
  }),

  reviews: router({
    featured: publicProcedure.query(async () => {
      return listOrderReviews(6);
    }),
  }),
});

export type AppRouter = typeof appRouter;
