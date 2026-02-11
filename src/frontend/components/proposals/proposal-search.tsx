'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2, Wifi, WifiOff, RefreshCw, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProposalCard } from './proposal-card';
import { useVectorSearch, useVectorSync } from '@/lib/hooks/use-vector-search';
import { scanInput, sanitizeInput } from '@/lib/security/aidefence-client';
import type { VectorSearchResult } from '@/lib/types';

interface ProposalSearchProps {
  onResultSelect?: (result: VectorSearchResult) => void;
}

export function ProposalSearch({
  onResultSelect,
}: ProposalSearchProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VectorSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  const { search, isInitialized, isOnline, stats } = useVectorSearch();
  const { syncVectors, isSyncing, lastSync } = useVectorSync();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setSecurityWarning(null);

    // Security scan with aidefence
    const securityScan = scanInput(query, {
      context: 'ai_query',
      checkPromptInjection: true,
      checkSqlInjection: true,
      checkXss: true,
      checkPii: true,
    });

    if (!securityScan.isSafe) {
      const threatTypes = Array.from(new Set(securityScan.threats.map(t => t.type))).join(', ');
      setSecurityWarning(`Security threat detected: ${threatTypes}. Query sanitized.`);
      // Continue with sanitized query instead of blocking
    }

    // Use sanitized query if threats detected
    const safeQuery = securityScan.isSafe ? query : sanitizeInput(query);

    try {
      const searchResults = await search(safeQuery, undefined, {
        limit: 10,
        threshold: 0.5,
      });

      // Transform results to VectorSearchResult format if needed
      const formattedResults = searchResults.map((result) => {
        if ('proposal' in result) {
          return result as VectorSearchResult;
        }
        // Offline search returns SearchResult, we need to map it
        const metadata = result.metadata as Record<string, unknown>;
        return {
          id: result.id,
          score: result.score,
          proposal: {
            id: result.id,
            title: (metadata.title as string) ?? '',
            description: (metadata.description as string) ?? '',
            customer_name: (metadata.customer_name as string) ?? '',
            customer_email: (metadata.customer_email as string) ?? '',
            amount: (metadata.amount as number) ?? 0,
            status: (metadata.status as VectorSearchResult['proposal']['status']) ?? 'draft',
            created_at: (metadata.created_at as string) ?? new Date().toISOString(),
            updated_at: (metadata.updated_at as string) ?? new Date().toISOString(),
          },
        };
      });

      setResults(formattedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, search]);

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      void handleSearch();
    }
  };

  const handleSync = async (): Promise<void> => {
    try {
      await syncVectors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Status Bar */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="warning" className="flex items-center gap-1" data-testid="offline-indicator">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </Badge>
                )}
                {isInitialized && (
                  <span className="text-muted-foreground">
                    {stats.count} vectors cached
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {lastSync && (
                  <span className="text-muted-foreground">
                    Last sync: {new Date(lastSync.timestamp).toLocaleString()}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing || !isOnline}
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Sync</span>
                </Button>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search proposals by content, customer, or description..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                  data-testid="vector-search"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Search</span>
              </Button>
            </div>

            {/* Search Mode Info */}
            <p className="text-sm text-muted-foreground">
              {isOnline
                ? 'Using semantic vector search powered by embeddings'
                : 'Using offline cached vectors for local search'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Warning */}
      {securityWarning && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <ShieldAlert className="h-5 w-5" />
              <p>{securityWarning}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4" data-testid="search-results">
          <h2 className="text-lg font-semibold">
            Search Results ({results.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="relative cursor-pointer"
                onClick={() => onResultSelect?.(result)}
              >
                <ProposalCard proposal={result.proposal} />
                <Badge
                  variant="secondary"
                  className="absolute right-2 top-2"
                >
                  {(result.score * 100).toFixed(1)}% match
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isSearching && query && results.length === 0 && !error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No proposals found matching your search.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
