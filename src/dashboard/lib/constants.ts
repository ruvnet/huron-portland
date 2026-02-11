import type { ProposalStatus } from "./types";

export const APP_NAME = "HCG Dashboard";
export const APP_DESCRIPTION = "Huron Grants Consulting Intelligence Platform";

export const STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: "#94A3B8",
  submitted: "#3B82F6",
  under_review: "#8B5CF6",
  revisions_requested: "#F59E0B",
  approved: "#10B981",
  rejected: "#EF4444",
  active: "#06B6D4",
  amendments_requested: "#F97316",
  amended: "#6366F1",
  suspended: "#DC2626",
  closed: "#6B7280",
  archived: "#9CA3AF",
  withdrawn: "#78716C",
  pending_approval: "#A855F7",
  compliance_review: "#EC4899",
  budget_review: "#14B8A6",
  final_review: "#8B5CF6",
  awaiting_signature: "#EAB308",
  executed: "#22C55E",
  reporting: "#0EA5E9",
  closeout: "#64748B",
};

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  revisions_requested: "Revisions Requested",
  approved: "Approved",
  rejected: "Rejected",
  active: "Active",
  amendments_requested: "Amendments Requested",
  amended: "Amended",
  suspended: "Suspended",
  closed: "Closed",
  archived: "Archived",
  withdrawn: "Withdrawn",
  pending_approval: "Pending Approval",
  compliance_review: "Compliance Review",
  budget_review: "Budget Review",
  final_review: "Final Review",
  awaiting_signature: "Awaiting Signature",
  executed: "Executed",
  reporting: "Reporting",
  closeout: "Closeout",
};

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "home" },
  { label: "Proposals", href: "/proposals", icon: "file-text" },
  { label: "Analytics", href: "/analytics", icon: "bar-chart" },
  { label: "Search", href: "/search", icon: "search" },
] as const;
