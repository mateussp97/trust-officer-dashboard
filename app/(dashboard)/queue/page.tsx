"use client";

import { SiteHeader } from "@/components/site-header";
import { RequestQueue } from "@/components/queue/request-queue";

export default function QueuePage() {
  return (
    <>
      <SiteHeader
        title="Request Queue"
        description="Review and process beneficiary distribution requests"
      />
      <div className="flex flex-col gap-6 p-6">
        <RequestQueue />
      </div>
    </>
  );
}
