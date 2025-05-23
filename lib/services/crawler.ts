import { URL } from "node:url";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { createResourceAndEmbedding } from "@/lib/actions/resources";

export interface CrawlOptions {
  baseUrl: string;
  maxPages?: number;
  createdBy: string;
  updatedBy: string;
  onProgress?: (page: CrawledPage) => void;
}

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
}

export class WebCrawler {
  private visitedUrls: Set<string> = new Set();
  private baseUrl: string;
  private maxPages: number;
  private createdBy: string;
  private updatedBy: string;
  private onProgress?: (page: CrawledPage) => void;
  private turndownService: TurndownService;
  private isCancelled: boolean;

  constructor(options: CrawlOptions) {
    this.baseUrl = options.baseUrl;
    this.maxPages = options.maxPages ?? 100;
    this.createdBy = options.createdBy;
    this.updatedBy = options.updatedBy;
    this.onProgress = options.onProgress;
    this.isCancelled = false;

    this.turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const baseParsedUrl = new URL(this.baseUrl);
      return parsedUrl.hostname === baseParsedUrl.hostname;
    } catch {
      return false;
    }
  }

  private async fetchPage(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.text();
  }

  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const links = new Set<string>();
    $("a").each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).toString();
          if (this.isValidUrl(absoluteUrl)) {
            links.add(absoluteUrl);
          }
        } catch {
          // Invalid URL, skip
        }
      }
    });
    return Array.from(links);
  }

  private async processPage(url: string): Promise<CrawledPage | null> {
    if (this.isCancelled) {
      return null;
    }

    if (this.visitedUrls.has(url)) {
      return null;
    }

    this.visitedUrls.add(url);

    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $("script, style, nav, footer, header, aside").remove();

      // Extract title
      const title = $("title").text() || url;

      // Convert to markdown
      const content = this.turndownService.turndown($("body").html() || "");

      const page: CrawledPage = {
        url,
        title,
        content,
      };

      if (this.onProgress) {
        this.onProgress(page);
      }

      return page;
    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      return null;
    }
  }

  public cancel() {
    this.isCancelled = true;
  }

  public async *crawl(): AsyncGenerator<CrawledPage> {
    const queue: string[] = [this.baseUrl];

    while (
      queue.length > 0 &&
      this.visitedUrls.size < this.maxPages &&
      !this.isCancelled
    ) {
      const url = queue.shift();
      if (!url) {
        break;
      }
      const page = await this.processPage(url);

      if (page) {
        // Add the page to the RAG database
        await createResourceAndEmbedding({
          content: page.content,
          name: page.title,
          url: page.url,
          contentType: "text",
          type: "url",
          createdBy: this.createdBy,
          updatedBy: this.updatedBy,
        });

        yield page;

        if (this.visitedUrls.size < this.maxPages && !this.isCancelled) {
          const $ = cheerio.load(await this.fetchPage(url));
          const links = this.extractLinks($, url);
          queue.push(...links.filter((link) => !this.visitedUrls.has(link)));
        }
      } else {
        console.log(`Skipping ${url} because it was already visited`);
      }
    }
  }
}
