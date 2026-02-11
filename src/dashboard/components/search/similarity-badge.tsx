"use client";

import { Chip } from "@heroui/react";

export function SimilarityBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "success" : pct >= 50 ? "primary" : pct >= 30 ? "warning" : "default";

  return (
    <Chip size="sm" variant="flat" color={color} className="font-mono">
      {pct}% match
    </Chip>
  );
}
