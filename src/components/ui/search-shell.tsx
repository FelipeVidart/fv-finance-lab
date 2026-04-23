"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { searchNavigationEntries } from "@/lib/search-index";
import { cn } from "@/lib/utils";

export function SearchShell() {
  const router = useRouter();
  const pathname = usePathname();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => searchNavigationEntries(query), [query]);
  const showPanel = isOpen && (query.trim().length > 0 || results.length > 0);

  useEffect(() => {
    setQuery("");
    setIsOpen(false);
    setActiveIndex(0);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function handleNavigate(index: number) {
    const target = results[index];

    if (!target) {
      return;
    }

    router.push(target.href);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (!results.length) {
        return;
      }

      event.preventDefault();

      if (!showPanel) {
        setIsOpen(true);
        return;
      }

      setActiveIndex((current) => Math.min(current + 1, results.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      if (!results.length) {
        return;
      }

      event.preventDefault();

      if (!showPanel) {
        setIsOpen(true);
        return;
      }

      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      if (!results.length) {
        return;
      }

      event.preventDefault();
      handleNavigate(results.length === 1 ? 0 : activeIndex);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(0);
      inputRef.current?.blur();
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative hidden min-w-[19rem] xl:block"
    >
      <div className="flex items-center gap-3 rounded-[1.45rem] border border-border/75 bg-[linear-gradient(180deg,rgba(19,30,43,0.88),rgba(11,19,29,0.78))] px-3.5 py-2.5 text-sm text-foreground-soft shadow-[var(--shadow-soft)]">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4 shrink-0 text-foreground-subtle"
        >
          <path
            d="M13.75 13.75L17 17M15.5 9.25A6.25 6.25 0 1 1 3 9.25a6.25 6.25 0 0 1 12.5 0Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search pages or modules"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showPanel && results[activeIndex]
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
        />

        <span className="rounded-full border border-white/[0.08] bg-background-muted/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          Enter
        </span>
      </div>

      {showPanel ? (
        <div
          className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-full overflow-hidden rounded-[1.55rem] border border-border/80 bg-[radial-gradient(circle_at_top_right,rgba(226,184,107,0.08),transparent_24%),linear-gradient(180deg,rgba(17,27,40,0.98),rgba(8,14,22,0.96))] shadow-[0_24px_64px_rgba(0,0,0,0.36)] backdrop-blur-2xl"
        >
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-strong/85">
              Global navigation search
            </p>
          </div>

          {results.length > 0 ? (
            <div id={listboxId} role="listbox" className="p-2">
              {results.map((result, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={`${result.href}-${result.label}`}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleNavigate(index);
                    }}
                    className={cn(
                      "flex w-full items-start justify-between gap-4 rounded-[1.2rem] border px-3.5 py-3 text-left transition",
                      isActive
                        ? "border-accent/25 bg-accent/10"
                        : "border-transparent hover:border-border/70 hover:bg-white/[0.03]",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {result.label}
                        </p>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                            isActive
                              ? "border-accent/20 bg-accent/10 text-accent-foreground"
                              : "border-white/[0.08] bg-background-muted/80 text-foreground-subtle",
                          )}
                        >
                          {result.group}
                        </span>
                      </div>
                      {result.description ? (
                        <p className="mt-1 truncate text-xs leading-6 text-foreground-soft">
                          {result.description}
                        </p>
                      ) : null}
                    </div>

                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                      Go
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-4">
              <p className="text-sm font-semibold text-foreground">
                No matches found
              </p>
              <p className="mt-1 text-xs leading-6 text-foreground-soft">
                Try searching for a page, module, or workflow like Options,
                Risk, Bonds, Projects, or Market Monitor.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
