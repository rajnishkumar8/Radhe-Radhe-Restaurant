import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { HttpError } from "@shared/_core/errors";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  authError?: string;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let authError: string | undefined;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    // But we track the error type for better UX in protected procedures
    if (error instanceof HttpError) {
      authError = error.message;
    } else if (error instanceof Error) {
      authError = error.message;
    }
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    authError,
  };
}
