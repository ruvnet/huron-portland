import type { Proposal, SearchResult } from "../types";
import {
  getMockProposals,
  getMockProposalById,
  getMockStatusCounts,
  getMockDepartmentBudgets,
} from "./mock-data";

const USE_MOCK =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false"
    : true;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

async function apiFetch<T>(path: string): Promise<T> {
  if (USE_MOCK) {
    throw new Error("Mock mode: use mock functions instead");
  }
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchProposals(): Promise<Proposal[]> {
  if (USE_MOCK) return getMockProposals();
  return apiFetch<Proposal[]>("/proposals");
}

export async function fetchProposalById(
  id: string,
): Promise<Proposal | undefined> {
  if (USE_MOCK) return getMockProposalById(id);
  return apiFetch<Proposal>(`/proposals/${id}`);
}

export async function fetchStatusCounts() {
  if (USE_MOCK) return getMockStatusCounts();
  return apiFetch<{ status: string; count: number }[]>(
    "/proposals/status-counts",
  );
}

export async function fetchDepartmentBudgets() {
  if (USE_MOCK) return getMockDepartmentBudgets();
  return apiFetch<
    { department: string; requested: number; approved: number }[]
  >("/proposals/department-budgets");
}

export async function searchProposals(
  query: string,
): Promise<SearchResult[]> {
  if (USE_MOCK) {
    const proposals = getMockProposals();
    const lq = query.toLowerCase();
    return proposals
      .map((proposal) => {
        const text =
          `${proposal.title} ${proposal.description} ${proposal.tags.join(" ")}`.toLowerCase();
        const words = lq.split(/\s+/);
        const matches = words.filter((w) => text.includes(w)).length;
        const similarity = matches / Math.max(words.length, 1);
        return { proposal, similarity };
      })
      .filter((r) => r.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity);
  }
  return apiFetch<SearchResult[]>(
    `/search?q=${encodeURIComponent(query)}`,
  );
}
