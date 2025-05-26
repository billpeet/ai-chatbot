"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { DataTable } from "@/components/admin/votes/data-table";
import { columns } from "@/components/admin/votes/columns";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Votes() {
  const trpc = useTRPC();
  const { data, refetch, isRefetching } = useSuspenseQuery(
    trpc.votes.votes.queryOptions({ pageNo: 1, pageSize: 10 })
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Votes</h1>
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
        </div>
      </div>
      <DataTable columns={columns()} data={data?.items || []} />
    </div>
  );
}
