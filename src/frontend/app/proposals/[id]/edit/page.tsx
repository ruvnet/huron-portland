'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProposalForm } from '@/components/proposals/proposal-form';
import { useProposal } from '@/lib/hooks/use-proposals';

export default function EditProposalPage(): JSX.Element {
  const params = useParams();
  const id = params.id as string;

  const { data: proposal, isLoading, error } = useProposal(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive mb-4">
            Failed to load proposal. It may not exist or you may not have access.
          </p>
          <Button variant="outline" asChild>
            <Link href="/proposals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Proposals
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/proposals/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Proposal</h1>
          <p className="text-muted-foreground">
            Update proposal details
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <ProposalForm proposal={proposal} mode="edit" />
      </div>
    </div>
  );
}
