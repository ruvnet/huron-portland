'use client';

import Link from 'next/link';
import { FileText, Plus, Search, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProposals } from '@/lib/hooks/use-proposals';
import { formatCurrency } from '@/lib/utils';
import type { ProposalStatus } from '@/lib/types';

const statusCounts: Record<ProposalStatus, { label: string; color: string }> = {
  draft: { label: 'Drafts', color: 'text-gray-500' },
  submitted: { label: 'Submitted', color: 'text-blue-500' },
  approved: { label: 'Approved', color: 'text-green-500' },
  rejected: { label: 'Rejected', color: 'text-red-500' },
  archived: { label: 'Archived', color: 'text-gray-400' },
};

export default function DashboardPage(): JSX.Element {
  const { data, isLoading, error } = useProposals({ pageSize: 100 });

  const proposals = data?.data ?? [];

  const stats = {
    total: proposals.length,
    totalValue: proposals.reduce((sum, p) => sum + p.amount, 0),
    byStatus: Object.keys(statusCounts).reduce(
      (acc, status) => ({
        ...acc,
        [status]: proposals.filter((p) => p.status === status).length,
      }),
      {} as Record<string, number>
    ),
    recentCount: proposals.filter((p) => {
      const created = new Date(p.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length,
  };

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your proposals and track performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/proposals?search=true">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Link>
          </Button>
          <Button asChild>
            <Link href="/proposals/new">
              <Plus className="mr-2 h-4 w-4" />
              New Proposal
            </Link>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Failed to load dashboard data. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {!isLoading && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="stats-cards">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Proposals
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.recentCount} created this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Value
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all proposals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.byStatus.approved ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? `${Math.round(((stats.byStatus.approved ?? 0) / stats.total) * 100)}% approval rate`
                    : 'No proposals yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats.byStatus.draft ?? 0) + (stats.byStatus.submitted ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting review or approval
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Overview</CardTitle>
                <CardDescription>
                  Proposals by current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(statusCounts).map(([status, { label, color }]) => {
                    const count = stats.byStatus[status] ?? 0;
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={color}>{label}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full bg-current ${color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2" data-testid="quick-actions">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/proposals/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Proposal
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/proposals">
                      <FileText className="mr-2 h-4 w-4" />
                      View All Proposals
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/proposals?search=true">
                      <Search className="mr-2 h-4 w-4" />
                      Semantic Search
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/proposals?status=draft">
                      <Clock className="mr-2 h-4 w-4" />
                      Review Drafts ({stats.byStatus.draft ?? 0})
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
