"use client";

import { Chip } from "@heroui/react";
import type { ProposalStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

const STATUS_VARIANT: Record<string, "success" | "danger" | "warning" | "primary" | "secondary" | "default"> = {
  draft: "default",
  submitted: "primary",
  under_review: "secondary",
  revisions_requested: "warning",
  approved: "success",
  rejected: "danger",
  active: "primary",
  amendments_requested: "warning",
  amended: "secondary",
  suspended: "danger",
  closed: "default",
  archived: "default",
  withdrawn: "default",
  pending_approval: "secondary",
  compliance_review: "secondary",
  budget_review: "primary",
  final_review: "secondary",
  awaiting_signature: "warning",
  executed: "success",
  reporting: "primary",
  closeout: "default",
};

export function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <Chip
      size="sm"
      variant="flat"
      color={STATUS_VARIANT[status] || "default"}
    >
      {STATUS_LABELS[status] || status}
    </Chip>
  );
}
