"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { useProposals, useStatusCounts } from "@/hooks/use-proposals";
import { StatusBadge } from "@/components/proposals/status-badge";
import type { ProposalStatus } from "@/lib/types";

export default function DashboardPage() {
  const { data: proposals } = useProposals();
  const { data: statusCounts } = useStatusCounts();

  const totalRequested = proposals?.reduce(
    (sum, p) => sum + p.requestedAmount,
    0,
  );
  const totalApproved = proposals?.reduce(
    (sum, p) => sum + (p.approvedAmount || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-default-500">
          Huron Grants Consulting Intelligence Platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">Total Proposals</p>
            <p className="text-3xl font-bold">{proposals?.length ?? 0}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">Total Requested</p>
            <p className="text-3xl font-bold">
              ${((totalRequested ?? 0) / 1_000_000).toFixed(1)}M
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">Total Approved</p>
            <p className="text-3xl font-bold">
              ${((totalApproved ?? 0) / 1_000_000).toFixed(1)}M
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">Approval Rate</p>
            <p className="text-3xl font-bold">
              {totalRequested
                ? Math.round(((totalApproved ?? 0) / totalRequested) * 100)
                : 0}
              %
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Status Overview</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            {statusCounts?.map((sc) => (
              <div
                key={sc.status}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-100"
              >
                <StatusBadge status={sc.status as ProposalStatus} />
                <span className="font-mono text-sm font-semibold">
                  {sc.count}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Recent Proposals</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {proposals?.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg bg-default-50"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-default-500">
                    {p.principalInvestigator} &middot; {p.department}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono">
                    ${(p.requestedAmount / 1_000_000).toFixed(1)}M
                  </span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
