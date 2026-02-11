import { NextRequest, NextResponse } from 'next/server';

// Types for vector operations
interface VectorEntry {
  id: string;
  vector: number[];
  metadata: {
    title: string;
    description: string;
    customer_name: string;
    amount: number;
    status: string;
    created_at: string;
  };
}

interface SearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
}

interface SyncResponse {
  synced: number;
  timestamp: string;
  vectors: VectorEntry[];
}

// In-memory cache for demonstration (in production, use a proper vector DB)
const vectorCache: Map<string, VectorEntry> = new Map();

/**
 * POST /api/vectors - Search vectors
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as SearchRequest;
    const { query, limit = 10, threshold: _threshold = 0.5 } = body;
    // Note: threshold will be used when real vector search is implemented
    void _threshold;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would:
    // 1. Generate embedding for the query using the embeddings service
    // 2. Perform vector similarity search against the database
    // 3. Return results with scores

    // For now, return mock results based on simple text matching
    const results = Array.from(vectorCache.values())
      .filter((entry) => {
        const searchText = `${entry.metadata.title} ${entry.metadata.description} ${entry.metadata.customer_name}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
      .slice(0, limit)
      .map((entry) => ({
        id: entry.id,
        score: 0.85 + Math.random() * 0.15, // Mock score
        proposal: {
          id: entry.id,
          ...entry.metadata,
          customer_email: 'customer@example.com', // Mock email
          updated_at: entry.metadata.created_at,
        },
      }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Vector search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform vector search' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vectors - Get vector stats
 */
export async function GET(): Promise<NextResponse> {
  try {
    const stats = {
      count: vectorCache.size,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Vector stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get vector stats' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vectors - Sync vectors from backend
 */
export async function PUT(_request: NextRequest): Promise<NextResponse> {
  // Note: request will be used when sync options are implemented
  void _request;
  try {
    // In a real implementation, this would fetch vectors from the backend API
    // and sync them to the client-side IndexedDB via the response

    const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

    // Try to fetch proposals from the backend
    let vectors: VectorEntry[] = [];

    try {
      const response = await fetch(`${backendUrl}/proposals?pageSize=1000`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const proposals = data.data ?? [];

        // Transform proposals to vector entries
        // In production, embeddings would be pre-computed
        vectors = proposals.map((proposal: Record<string, unknown>) => ({
          id: proposal.id as string,
          vector: generateMockEmbedding(
            `${proposal.title} ${proposal.description}`
          ),
          metadata: {
            title: proposal.title as string,
            description: proposal.description as string,
            customer_name: proposal.customer_name as string,
            amount: proposal.amount as number,
            status: proposal.status as string,
            created_at: proposal.created_at as string,
          },
        }));

        // Update cache
        vectorCache.clear();
        for (const entry of vectors) {
          vectorCache.set(entry.id, entry);
        }
      }
    } catch (fetchError) {
      console.warn('Failed to fetch from backend, using cached data:', fetchError);
    }

    const syncResponse: SyncResponse = {
      synced: vectors.length,
      timestamp: new Date().toISOString(),
      vectors,
    };

    return NextResponse.json(syncResponse);
  } catch (error) {
    console.error('Vector sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync vectors' },
      { status: 500 }
    );
  }
}

/**
 * Generate a mock embedding for demonstration
 * In production, use a proper embedding model
 */
function generateMockEmbedding(text: string): number[] {
  const dimension = 384; // Common dimension for small models
  const embedding: number[] = [];

  // Simple hash-based embedding for demonstration
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Generate pseudo-random numbers based on hash
  const seed = Math.abs(hash);
  for (let i = 0; i < dimension; i++) {
    const x = Math.sin(seed * (i + 1)) * 10000;
    embedding.push(x - Math.floor(x));
  }

  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map((val) => val / norm);
}
