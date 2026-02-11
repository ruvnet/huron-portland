"use client";

import { Card, CardBody } from "@heroui/react";
import type { SearchResult } from "@/lib/types";
import { StatusBadge } from "@/components/proposals/status-badge";
import { SimilarityBadge } from "./similarity-badge";

export function SearchResults({ results }: { results: SearchResult[] }) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-default-500">
        {results.length} result{results.length !== 1 ? "s" : ""} found
      </p>
      {results.map((r) => (
        <Card key={r.proposal.id}>
          <CardBody>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">
                    {r.proposal.title}
                  </h3>
                  <StatusBadge status={r.proposal.status} />
                </div>
                <p className="text-sm text-default-600 line-clamp-2">
                  {r.proposal.description}
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm text-default-400">
                  <span>{r.proposal.principalInvestigator}</span>
                  <span>{r.proposal.department}</span>
                  <span className="font-mono">
                    ${(r.proposal.requestedAmount / 1_000_000).toFixed(1)}M
                  </span>
                </div>
              </div>
              <SimilarityBadge score={r.similarity} />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
