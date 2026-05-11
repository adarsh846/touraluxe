"use client";

import { DestinationModal } from "@/components/modals/DestinationModal";
import { DestinationPortalContent } from "@/components/modals/DestinationPortalContent";

export default function InterceptedDestinationsPage() {
  return (
    <DestinationModal>
      <DestinationPortalContent />
    </DestinationModal>
  );
}
