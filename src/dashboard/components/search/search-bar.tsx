"use client";

import { Input, Button, Spinner } from "@heroui/react";
import { useState, type FormEvent } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  indexLoaded: boolean;
}

export function SearchBar({ onSearch, loading, indexLoaded }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <Input
        label="Semantic Search"
        placeholder="e.g., machine learning healthcare privacy"
        value={query}
        onValueChange={setQuery}
        description={
          indexLoaded
            ? "rvlite WASM index loaded - vector search ready"
            : "Loading vector index..."
        }
        className="flex-1"
        size="lg"
        startContent={
          !indexLoaded ? (
            <Spinner size="sm" />
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-default-400"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )
        }
      />
      <Button
        type="submit"
        color="primary"
        size="lg"
        isLoading={loading}
        isDisabled={!indexLoaded || !query.trim()}
      >
        Search
      </Button>
    </form>
  );
}
