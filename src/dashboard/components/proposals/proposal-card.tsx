"use client";

import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import type { Proposal } from "@/lib/types";
import { StatusBadge } from "./status-badge";

export function ProposalCard({ proposal }: { proposal: Proposal }) {
  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">
            {proposal.title}
          </h3>
          <p className="text-sm text-default-500">
            {proposal.principalInvestigator}
          </p>
        </div>
        <StatusBadge status={proposal.status} />
      </CardHeader>
      <CardBody className="pt-0 space-y-3">
        <p className="text-sm text-default-600 line-clamp-2">
          {proposal.description}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-default-500">{proposal.department}</span>
          <span className="font-mono font-medium">
            ${(proposal.requestedAmount / 1_000_000).toFixed(1)}M
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-default-400">{proposal.sponsor}</span>
          {proposal.approvedAmount && (
            <span className="font-mono text-success">
              ${(proposal.approvedAmount / 1_000_000).toFixed(1)}M approved
            </span>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {proposal.tags.map((tag) => (
            <Chip key={tag} size="sm" variant="bordered" className="text-xs">
              {tag}
            </Chip>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
