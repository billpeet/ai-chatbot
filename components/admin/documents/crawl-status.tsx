import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTRPC } from "@/trpc/client";
import { useSubscription } from "@trpc/tanstack-react-query";
import { X } from "lucide-react";
import type { CrawledPage } from "./crawl-button";
import { useState } from "react";
export function CrawlStatus({
  url,
  maxPages,
  onDone,
  onCancel,
}: {
  url: string;
  maxPages: number;
  onDone: (pages: CrawledPage[]) => void;
  onCancel: () => void;
}) {
  const trpc = useTRPC();

  const [crawledPages, setCrawledPages] = useState<CrawledPage[]>([]);

  const { data, error } = useSubscription(
    trpc.crawl.crawl.subscriptionOptions(
      {
        url,
        maxPages,
      },
      {
        onData: (data: {
          id: string;
          data: { url: string; title: string };
        }) => {
          setCrawledPages((prev: CrawledPage[]) => [...prev, data.data]);
        },
      }
    )
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Crawled Pages ({crawledPages.length})</Label>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onCancel()}
        >
          <X className="mr-2 size-4" />
          Cancel
        </Button>
      </div>
      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="space-y-2">
          {crawledPages.map((page) => (
            <div
              key={page.url}
              className="flex flex-col space-y-1 rounded-md bg-muted p-2"
            >
              <div className="text-sm font-medium">{page.title}</div>
              <div className="text-xs text-muted-foreground">{page.url}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
