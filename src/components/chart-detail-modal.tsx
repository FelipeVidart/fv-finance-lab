"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ChartDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
};

export function ChartDetailModal({
  isOpen,
  onClose,
  title,
  description,
  children,
}: ChartDetailModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <button
        type="button"
        aria-label={`Close ${title} detail view`}
        onClick={onClose}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(18,29,43,0.24),rgba(3,7,11,0.92))] backdrop-blur-xl"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[90rem] items-center"
      >
        <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[2.1rem] border border-border-strong/85 bg-[radial-gradient(circle_at_top_right,rgba(226,184,107,0.08),transparent_20%),linear-gradient(180deg,rgba(11,17,25,0.98),rgba(6,11,17,0.98))] shadow-[0_32px_100px_rgba(0,0,0,0.55)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(226,184,107,0.6),transparent)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-accent/10 blur-3xl"
          />

          <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/[0.08] bg-[linear-gradient(180deg,rgba(20,31,45,0.48),rgba(10,17,26,0.14))] px-6 py-5 sm:px-8">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-strong/85">
                Expanded detail
              </p>
              <h2
                id={titleId}
                className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[2rem]"
              >
                {title}
              </h2>
              {description ? (
                <p
                  id={descriptionId}
                  className="max-w-3xl text-sm leading-7 text-foreground-soft"
                >
                  {description}
                </p>
              ) : null}
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/80 bg-background-muted/80 text-lg text-foreground transition hover:border-accent/25 hover:bg-accent/10 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="relative z-10 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="rounded-[1.7rem] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(9,15,23,0.52),rgba(9,15,23,0.22))] p-4 sm:p-5 lg:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
