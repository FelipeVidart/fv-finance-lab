export function SearchShell() {
  return (
    <div
      aria-hidden="true"
      className="hidden min-w-[16rem] items-center gap-3 rounded-[1.45rem] border border-border/75 bg-[linear-gradient(180deg,rgba(19,30,43,0.88),rgba(11,19,29,0.78))] px-3.5 py-2.5 text-sm text-foreground-soft shadow-[var(--shadow-soft)] xl:flex"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-4 w-4 text-foreground-subtle"
      >
        <path
          d="M13.75 13.75L17 17M15.5 9.25A6.25 6.25 0 1 1 3 9.25a6.25 6.25 0 0 1 12.5 0Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="flex-1 truncate text-foreground-muted">
        Search tools or modules
      </span>
    </div>
  );
}
