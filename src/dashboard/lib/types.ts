export type ProposalStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "revisions_requested"
  | "approved"
  | "rejected"
  | "active"
  | "amendments_requested"
  | "amended"
  | "suspended"
  | "closed"
  | "archived"
  | "withdrawn"
  | "pending_approval"
  | "compliance_review"
  | "budget_review"
  | "final_review"
  | "awaiting_signature"
  | "executed"
  | "reporting"
  | "closeout";

export interface Proposal {
  id: string;
  title: string;
  status: ProposalStatus;
  principalInvestigator: string;
  department: string;
  sponsor: string;
  requestedAmount: number;
  approvedAmount: number | null;
  submittedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string;
  tags: string[];
  tenantId: string;
}

export interface BudgetLineItem {
  id: string;
  proposalId: string;
  category: string;
  description: string;
  amount: number;
  approved: boolean;
}

export interface SearchResult {
  proposal: Proposal;
  similarity: number;
}

export interface VectorSearchOptions {
  query: string;
  topK?: number;
  threshold?: number;
}

export interface StatusCount {
  status: ProposalStatus;
  count: number;
}

export interface DepartmentBudget {
  department: string;
  requested: number;
  approved: number;
}
