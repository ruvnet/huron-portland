"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import type { Proposal } from "@/lib/types";
import { StatusBadge } from "./status-badge";

const columns = [
  { key: "title", label: "Title" },
  { key: "pi", label: "PI" },
  { key: "department", label: "Department" },
  { key: "sponsor", label: "Sponsor" },
  { key: "amount", label: "Requested" },
  { key: "status", label: "Status" },
];

export function ProposalTable({ proposals }: { proposals: Proposal[] }) {
  return (
    <Table aria-label="Proposals table" isStriped>
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.key}>{column.label}</TableColumn>
        )}
      </TableHeader>
      <TableBody items={proposals}>
        {(proposal) => (
          <TableRow key={proposal.id}>
            <TableCell>
              <span className="font-medium">{proposal.title}</span>
            </TableCell>
            <TableCell>{proposal.principalInvestigator}</TableCell>
            <TableCell>{proposal.department}</TableCell>
            <TableCell>{proposal.sponsor}</TableCell>
            <TableCell className="font-mono">
              ${(proposal.requestedAmount / 1_000_000).toFixed(1)}M
            </TableCell>
            <TableCell>
              <StatusBadge status={proposal.status} />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
