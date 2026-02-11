'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  User,
  Mail,
  DollarSign,
  Calendar,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProposal, useDeleteProposal, useUpdateProposal } from '@/lib/hooks/use-proposals';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ProposalStatus } from '@/lib/types';

const statusVariants: Record<ProposalStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  draft: 'secondary',
  submitted: 'default',
  approved: 'success',
  rejected: 'destructive',
  archived: 'secondary',
};

const statusActions: { from: ProposalStatus; to: ProposalStatus; label: string }[] = [
  { from: 'draft', to: 'submitted', label: 'Submit for Review' },
  { from: 'submitted', to: 'approved', label: 'Approve' },
  { from: 'submitted', to: 'rejected', label: 'Reject' },
  { from: 'approved', to: 'archived', label: 'Archive' },
  { from: 'rejected', to: 'draft', label: 'Return to Draft' },
];

export default function ProposalDetailPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: proposal, isLoading, error } = useProposal(id);
  const deleteMutation = useDeleteProposal();
  const updateMutation = useUpdateProposal();

  const handleDelete = async (): Promise<void> => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      router.push('/proposals');
    } catch (err) {
      console.error('Failed to delete proposal:', err);
    }
  };

  const handleStatusChange = async (newStatus: ProposalStatus): Promise<void> => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { status: newStatus },
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const availableActions = statusActions.filter(
    (action) => action.from === proposal?.status
  );

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
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/proposals">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {proposal.title}
            </h1>
            <Badge variant={statusVariants[proposal.status]}>
              {proposal.status}
            </Badge>
          </div>
          <p className="text-muted-foreground pl-10">
            Created on {formatDate(proposal.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/proposals/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{proposal.description}</p>
            </CardContent>
          </Card>

          {/* Status Actions */}
          {availableActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Update the status of this proposal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {availableActions.map((action) => (
                    <Button
                      key={action.to}
                      variant={
                        action.to === 'approved'
                          ? 'default'
                          : action.to === 'rejected'
                            ? 'destructive'
                            : 'outline'
                      }
                      onClick={() => handleStatusChange(action.to)}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm text-muted-foreground">
                    {proposal.customer_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {proposal.customer_email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(proposal.amount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(proposal.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(proposal.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {proposal.metadata && Object.keys(proposal.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(proposal.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
