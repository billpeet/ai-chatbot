import { getResources } from "@/lib/db/queries";
import { baseProcedure, createTRPCRouter } from "../init";
import { z } from "zod";
import { deleteResourceAndFiles } from "@/lib/actions/resources";

export const resourcesRouter = createTRPCRouter({
  resources: baseProcedure
    .input(
      z.object({
        pageNo: z.number().optional(),
        pageSize: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const resources = await getResources(
        input.pageNo ?? 1,
        input.pageSize ?? 10
      );
      return resources;
    }),
  deleteResource: baseProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const result = await deleteResourceAndFiles(input.id);
      return result;
    }),
});

export type ResourcesRouter = typeof resourcesRouter;
