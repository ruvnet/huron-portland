"use client";

import { useState } from "react";
import { Tabs, Tab, Input } from "@heroui/react";
import { useProposals } from "@/hooks/use-proposals";
import { ProposalCard } from "@/components/proposals/proposal-card";
import { ProposalTable } from "@/components/proposals/proposal-table";

export default function ProposalsPage() {
  const { data: proposals, isLoading } = useProposals();
  const [filter, setFilter] = useState("");
  const [view, setView] = useState("cards");

  const filtered = proposals?.filter(
    (p) =>
      p.title.toLowerCase().includes(filter.toLowerCase()) ||
      p.principalInvestigator.toLowerCase().includes(filter.toLowerCase()) ||
      p.department.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Proposals</h1>
        <p className="text-default-500">
          Manage and track grant proposals across all stages
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter by title, PI, or department..."
          value={filter}
          onValueChange={setFilter}
          className="max-w-md"
          startContent={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-default-400"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        />
        <Tabs
          selectedKey={view}
          onSelectionChange={(key) => setView(key as string)}
          size="sm"
        >
          <Tab key="cards" title="Cards" />
          <Tab key="table" title="Table" />
        </Tabs>
      </div>

      {isLoading ? (
        <p className="text-default-500">Loading proposals...</p>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      ) : (
        <ProposalTable proposals={filtered || []} />
      )}

      {filtered && (
        <p className="text-sm text-default-400">
          Showing {filtered.length} of {proposals?.length ?? 0} proposals
        </p>
      )}
    </div>
  );
}
