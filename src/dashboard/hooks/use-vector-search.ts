"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { SearchResult } from "@/lib/types";
import { buildIndex, vectorSearch, isIndexReady } from "@/lib/wasm/vector-index";
import { getMockProposals } from "@/lib/api/mock-data";

export function useVectorSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    buildIndex(getMockProposals())
      .then(() => setIndexLoaded(true))
      .catch((err) => setError(String(err)));
  }, []);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      if (!isIndexReady()) {
        setError("Vector index not ready");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const r = await vectorSearch(query, 10, 0.05);
        setResults(r);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { results, loading, indexLoaded, error, search };
}
