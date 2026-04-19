import type { ReactNode } from "react";

type CardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
};

export function Card({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: CardProps) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm ${className}`.trim()}
    >
      <div className="space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-300">
            {description}
          </p>
        </div>
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
