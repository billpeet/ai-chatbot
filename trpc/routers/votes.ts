import { getVotes } from "@/lib/db/queries";
import { baseProcedure, createTRPCRouter } from "../init";
import { z } from "zod";

export const votesRouter = createTRPCRouter({
  votes: baseProcedure
    .input(
      z.object({
        pageNo: z.number().optional(),
        pageSize: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getVotes(input.pageNo ?? 1, input.pageSize ?? 10);
    }),
});

export type VotesRouter = typeof votesRouter;
