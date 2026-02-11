"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className="pt-[var(--header-height)]"
        style={{ marginLeft: "var(--sidebar-width)" }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
