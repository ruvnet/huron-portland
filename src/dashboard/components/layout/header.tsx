"use client";

import { Button } from "@heroui/react";
import { useThemeToggle } from "@/hooks/use-theme";

export function Header() {
  const { isDark, toggleTheme, mounted } = useThemeToggle();

  return (
    <header className="fixed top-0 right-0 z-30 h-[var(--header-height)] border-b border-default-200 bg-background/80 backdrop-blur-md"
      style={{ left: "var(--sidebar-width)" }}
    >
      <div className="flex h-full items-center justify-between px-6">
        <div />
        <div className="flex items-center gap-3">
          <span className="text-xs text-default-400 font-mono">
            MOCK MODE
          </span>
          {mounted && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
