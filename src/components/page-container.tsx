import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "content" | "wide";
};

export function PageContainer({
  children,
  className = "",
  size = "wide",
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-7 lg:px-10",
        size === "content" ? "max-w-6xl" : "max-w-[88rem]",
        className,
      )}
    >
      {children}
    </div>
  );
}
