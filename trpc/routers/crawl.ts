import { baseProcedure, createTRPCRouter } from "../init";
import { z } from "zod";
import { WebCrawler } from "@/lib/services/crawler";
import { tracked } from "@trpc/server";

export const crawlRouter = createTRPCRouter({
  crawl: baseProcedure
    .input(
      z.object({
        url: z.string().url(),
        maxPages: z.number().min(1).max(1000).optional(),
      })
    )
    .subscription(async function* ({ input, ctx }) {
      const crawler = new WebCrawler({
        baseUrl: input.url,
        maxPages: input.maxPages,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      });

      try {
        for await (const page of crawler.crawl()) {
          yield tracked(page.url, {
            url: page.url,
            title: page.title,
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("An error occurred while crawling");
      }
    }),
});

export type CrawlRouter = typeof crawlRouter;
