"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchProposals,
  fetchStatusCounts,
  fetchDepartmentBudgets,
} from "@/lib/api/client";

export function useProposals() {
  return useQuery({
    queryKey: ["proposals"],
    queryFn: fetchProposals,
  });
}

export function useStatusCounts() {
  return useQuery({
    queryKey: ["status-counts"],
    queryFn: fetchStatusCounts,
  });
}

export function useDepartmentBudgets() {
  return useQuery({
    queryKey: ["department-budgets"],
    queryFn: fetchDepartmentBudgets,
  });
}
