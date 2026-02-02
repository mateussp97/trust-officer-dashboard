export const dynamic = "force-dynamic";

import { SiteHeader } from "@/components/site-header";
import { RequestQueue } from "@/components/queue/request-queue";
import { ErrorBoundary } from "@/components/error-boundary";

export default function QueuePage() {
  return (
    <>
      <SiteHeader
        title="Request Queue"
        description="Review and process beneficiary distribution requests"
      />
      <div className="flex flex-col gap-6 p-6">
        <ErrorBoundary fallbackTitle="Failed to load request queue">
          <RequestQueue />
        </ErrorBoundary>
      </div>
    </>
  );
}
