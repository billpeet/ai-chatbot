import { HydrateClient /*, prefetch, trpc */ } from "@/trpc/server";
import Documents from "./documents";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

export default async function Home() {
  // prefetch(trpc.resources.resources.queryOptions({ pageNo: 1, pageSize: 10 }));

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<div>Error</div>}>
        <Suspense fallback={<div>Loading...</div>}>
          <Documents />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
