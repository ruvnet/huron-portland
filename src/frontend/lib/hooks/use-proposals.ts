'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type {
  Proposal,
  ProposalCreateInput,
  ProposalUpdateInput,
  PaginatedResponse,
} from '@/lib/types';

const PROPOSALS_KEY = 'proposals';

interface UseProposalsOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export function useProposals(options: UseProposalsOptions = {}) {
  return useQuery<PaginatedResponse<Proposal>>({
    queryKey: [PROPOSALS_KEY, options],
    queryFn: () => apiClient.getProposals(options),
  });
}

export function useProposal(id: string) {
  return useQuery<Proposal>({
    queryKey: [PROPOSALS_KEY, id],
    queryFn: () => apiClient.getProposal(id),
    enabled: Boolean(id),
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProposalCreateInput) => apiClient.createProposal(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
    },
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProposalUpdateInput }) =>
      apiClient.updateProposal(id, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
      void queryClient.invalidateQueries({
        queryKey: [PROPOSALS_KEY, variables.id],
      });
    },
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteProposal(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
    },
  });
}
