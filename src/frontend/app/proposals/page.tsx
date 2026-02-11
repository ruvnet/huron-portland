'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
// Badge is imported but will be used for status indicators in future
// import { Badge } from '@/components/ui/badge';
import { ProposalCard } from '@/components/proposals/proposal-card';
import { ProposalSearch } from '@/components/proposals/proposal-search';
import { useProposals } from '@/lib/hooks/use-proposals';
import type { ProposalStatus } from '@/lib/types';

const statusFilters: { value: ProposalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];

function ProposalsContent(): JSX.Element {
  const searchParams = useSearchParams();
  const showSearch = searchParams.get('search') === 'true';
  const initialStatus = searchParams.get('status') ?? 'all';

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>(
    initialStatus as ProposalStatus | 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useProposals({
    page,
    pageSize: 12,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
  });

  const proposals = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (showSearch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vector Search</h1>
            <p className="text-muted-foreground">
              Find proposals using semantic similarity search
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/proposals">View All Proposals</Link>
          </Button>
        </div>
        <ProposalSearch />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="proposal-list">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground">
            Manage and track your proposals
          </p>
        </div>
        <Button asChild>
          <Link href="/proposals/new">
            <Plus className="mr-2 h-4 w-4" />
            New Proposal
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card data-testid="proposal-filters">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setPage(1);
                  }}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-64"
              />
              <Button variant="outline" asChild>
                <Link href="/proposals?search=true">
                  Vector Search
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Failed to load proposals. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Proposals Grid */}
      {!isLoading && !error && proposals.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2" data-testid="proposal-pagination">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && proposals.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No proposals found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'Get started by creating your first proposal.'}
            </p>
            <Button asChild>
              <Link href="/proposals/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Proposal
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ProposalsPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProposalsContent />
    </Suspense>
  );
}
