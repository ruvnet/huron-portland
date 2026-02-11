"use client";

import { Card, CardBody, CardHeader, Code } from "@heroui/react";
import { useVectorSearch } from "@/hooks/use-vector-search";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResults } from "@/components/search/search-results";

export default function SearchPage() {
  const { results, loading, indexLoaded, error, search } = useVectorSearch();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vector Search</h1>
        <p className="text-default-500">
          Semantic search powered by rvlite WASM + cosine similarity
        </p>
      </div>

      <Card>
        <CardBody>
          <SearchBar
            onSearch={search}
            loading={loading}
            indexLoaded={indexLoaded}
          />
        </CardBody>
      </Card>

      {error && (
        <Card className="border-danger">
          <CardBody>
            <p className="text-danger text-sm">{error}</p>
          </CardBody>
        </Card>
      )}

      <SearchResults results={results} />

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-default-500">
            How it works
          </h2>
        </CardHeader>
        <CardBody className="space-y-2 text-sm text-default-600">
          <p>
            1. Your query is embedded into a 384-dimensional vector using a
            deterministic hash function (demo mode).
          </p>
          <p>
            2. The rvlite WASM index performs cosine similarity search across
            all indexed proposals.
          </p>
          <p>
            3. Results are ranked by similarity score and filtered by a
            minimum threshold.
          </p>
          <p className="text-default-400">
            In production, embeddings use{" "}
            <Code size="sm">@ruvector/rvlite</Code> WASM module with
            384-dim sentence transformers.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
