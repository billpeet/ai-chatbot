import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { resourcesRouter } from "../routers/resources";
import { votesRouter } from "../routers/votes";
import { crawlRouter } from "../routers/crawl";

export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
  resources: resourcesRouter,
  votes: votesRouter,
  crawl: crawlRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
