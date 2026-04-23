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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={`Close ${title} detail view`}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/88 backdrop-blur-md"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative z-10 flex max-h-[92vh] w-full max-w-[88rem] flex-col overflow-hidden rounded-[2rem] border border-border-strong/85 bg-[linear-gradient(180deg,rgba(11,17,25,0.98),rgba(7,13,20,0.98))] shadow-[0_32px_100px_rgba(0,0,0,0.55)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(226,184,107,0.6),transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
        />

        <div className="relative z-10 flex items-start justify-between gap-4 border-b border-border/80 bg-[linear-gradient(180deg,rgba(20,31,45,0.54),rgba(10,17,26,0.18))] px-6 py-5 sm:px-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-strong/85">
              Expanded chart
            </p>
            <h2
              id={titleId}
              className="text-2xl font-semibold tracking-[-0.03em] text-foreground"
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
            className="rounded-full border border-border/80 bg-background-muted/80 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/25 hover:bg-accent/10 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          >
            Close
          </button>
        </div>

        <div className="relative z-10 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
