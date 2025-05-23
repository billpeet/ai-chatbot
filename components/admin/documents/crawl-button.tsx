"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";
import { CrawlStatus } from "./crawl-status";

export type CrawledPage = {
  url: string;
  title: string;
};

export function CrawlButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState(100);
  const [crawledPages, setCrawledPages] = useState<CrawledPage[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrawledPages([]);
    setIsCrawling(true);
  };

  const handleCancel = () => {
    setIsCrawling(false);
    setCrawledPages([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          handleCancel();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Globe className="mr-2 size-4" />
          Crawl Website
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        {
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Crawl Website</DialogTitle>
              <DialogDescription>
                Enter a URL to crawl. The crawler will follow internal links and
                add the content to the RAG database.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  disabled={isCrawling}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxPages">Maximum Pages</Label>
                <Input
                  id="maxPages"
                  type="number"
                  min="1"
                  max="1000"
                  value={maxPages}
                  onChange={(e) => setMaxPages(Number.parseInt(e.target.value))}
                  required
                  disabled={isCrawling}
                />
              </div>
              {isCrawling && (
                <CrawlStatus
                  url={url}
                  maxPages={maxPages}
                  onDone={setCrawledPages}
                  onCancel={handleCancel}
                />
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCrawling}>
                {isCrawling ? "Crawling..." : "Start Crawling"}
              </Button>
            </DialogFooter>
          </form>
        }
      </DialogContent>
    </Dialog>
  );
}
