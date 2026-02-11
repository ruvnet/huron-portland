export type ProposalStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'archived';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}

export interface ProposalCreateInput {
  title: string;
  description: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  metadata?: Record<string, unknown>;
}

export interface ProposalUpdateInput extends Partial<ProposalCreateInput> {
  status?: ProposalStatus;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  proposal: Proposal;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}
