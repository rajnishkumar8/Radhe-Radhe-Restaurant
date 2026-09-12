import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    const message = ctx.authError ? `Session expired: ${ctx.authError}` : UNAUTHED_ERR_MSG;
    throw new TRPCError({ code: "UNAUTHORIZED", message });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const staffProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const role = (ctx.user?.role as string) || "";
    const isStaff = ["owner", "manager", "order_staff", "admin"].includes(role);

    if (!ctx.user || !isStaff) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Staff access required" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const role = (ctx.user?.role as string) || "";
    const isAdmin = ["owner", "manager", "admin"].includes(role);

    if (!ctx.user || !isAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);

export const driverProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const role = (ctx.user?.role as string) || "";
    const isDriver = role === "driver";

    if (!ctx.user || !isDriver) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Driver access required" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);
