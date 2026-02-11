import type {
  Proposal,
  ProposalCreateInput,
  ProposalUpdateInput,
  PaginatedResponse,
  VectorSearchResult,
  ApiError,
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      }));
      throw new Error(error.message);
    }

    return response.json() as Promise<T>;
  }

  // Proposals API
  async getProposals(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Proposal>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<PaginatedResponse<Proposal>>(
      `/proposals${query ? `?${query}` : ''}`
    );
  }

  async getProposal(id: string): Promise<Proposal> {
    return this.request<Proposal>(`/proposals/${id}`);
  }

  async createProposal(data: ProposalCreateInput): Promise<Proposal> {
    return this.request<Proposal>('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProposal(id: string, data: ProposalUpdateInput): Promise<Proposal> {
    return this.request<Proposal>(`/proposals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProposal(id: string): Promise<void> {
    await this.request<void>(`/proposals/${id}`, {
      method: 'DELETE',
    });
  }

  // Vector search API
  async searchProposals(
    query: string,
    options?: { limit?: number; threshold?: number }
  ): Promise<VectorSearchResult[]> {
    return this.request<VectorSearchResult[]>('/vectors/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        limit: options?.limit ?? 10,
        threshold: options?.threshold ?? 0.7,
      }),
    });
  }

  async syncVectors(): Promise<{ synced: number; timestamp: string }> {
    return this.request<{ synced: number; timestamp: string }>('/vectors/sync', {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
