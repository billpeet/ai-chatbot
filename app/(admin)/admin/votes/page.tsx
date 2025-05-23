import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import Votes from "./votes";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

export default async function Home() {
  prefetch(trpc.votes.votes.queryOptions({ pageNo: 1, pageSize: 10 }));

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<div>Error</div>}>
        <Suspense fallback={<div>Loading...</div>}>
          <Votes />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
