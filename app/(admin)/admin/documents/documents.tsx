"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { DataTable } from "@/components/admin/documents/data-table";
import { columns, type Document } from "@/components/admin/documents/columns";
import { UploadButton } from "@/components/admin/documents/upload-button";
import { CrawlButton } from "@/components/admin/documents/crawl-button";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Documents() {
  const trpc = useTRPC();
  const { data, refetch, isRefetching } = useSuspenseQuery(
    trpc.resources.resources.queryOptions({ pageNo: 1, pageSize: 10 })
  );

  const deleteResource = useMutation(
    trpc.resources.deleteResource.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    })
  );

  const deleteResourceByBaseUrl = useMutation(
    trpc.resources.deleteResourceByBaseUrl.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    })
  );

  const handleDeleteResource = (doc: Document) => {
    if (doc.id) {
      deleteResource.mutate({ id: doc.id });
    } else if (doc.baseUrl) {
      deleteResourceByBaseUrl.mutate({ baseUrl: doc.baseUrl });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">RAG Documents</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`size-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <CrawlButton />
          <UploadButton />
        </div>
      </div>
      <DataTable
        columns={columns({
          deleteResource: handleDeleteResource,
        })}
        data={data?.items || []}
        totalCount={data?.totalCount || 0}
      />
    </div>
  );
}
