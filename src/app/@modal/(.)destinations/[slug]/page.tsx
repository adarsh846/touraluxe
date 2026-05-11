"use client";

import { use } from "react";
import { DestinationModal } from "@/components/modals/DestinationModal";
import { DestinationDetailContent } from "@/components/modals/DestinationDetailContent";

export default function InterceptedDestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  return (
    <DestinationModal>
      <DestinationDetailContent slug={slug} />
    </DestinationModal>
  );
}
