import { initTRPC } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";
import { auth } from "@/app/(auth)/auth";

interface Context {
  userId: string;
}

export const createTRPCContext = cache(async (): Promise<Context> => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  const session = await auth();
  return {
    userId: session?.user?.dbId ?? session?.user?.id ?? "anonymous",
  };
});

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
