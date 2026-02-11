'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProposalForm } from '@/components/proposals/proposal-form';

export default function NewProposalPage(): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/proposals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Proposal</h1>
          <p className="text-muted-foreground">
            Create a new proposal for your customer
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <ProposalForm mode="create" />
      </div>
    </div>
  );
}
