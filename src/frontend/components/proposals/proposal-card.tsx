'use client';

import Link from 'next/link';
import { FileText, Calendar, DollarSign, User } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, truncate } from '@/lib/utils';
import type { Proposal, ProposalStatus } from '@/lib/types';

interface ProposalCardProps {
  proposal: Proposal;
}

const statusVariants: Record<ProposalStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  draft: 'secondary',
  submitted: 'default',
  approved: 'success',
  rejected: 'destructive',
  archived: 'outline' as 'secondary',
};

export function ProposalCard({ proposal }: ProposalCardProps): JSX.Element {
  return (
    <Card className="hover:shadow-md transition-shadow" data-testid="proposal-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg" data-testid="proposal-title">
              <Link
                href={`/proposals/${proposal.id}`}
                className="hover:underline"
              >
                {truncate(proposal.title, 50)}
              </Link>
            </CardTitle>
            <CardDescription>
              {truncate(proposal.description, 100)}
            </CardDescription>
          </div>
          <Badge variant={statusVariants[proposal.status]} data-testid="proposal-status">
            {proposal.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>{proposal.customer_name}</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4" />
            <span>{formatCurrency(proposal.amount)}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{formatDate(proposal.created_at)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/proposals/${proposal.id}`}>
            <FileText className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
