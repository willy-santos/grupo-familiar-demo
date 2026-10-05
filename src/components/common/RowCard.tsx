import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function RowCard({
  children,
  className,
  as: Comp = "div",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  as?: React.ElementType;
  onClick?: () => void;
}) {
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-card transition",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-elevated",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function IconTile({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" }) {
  return (
    <div
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
        tone === "primary" && "bg-primary-soft text-primary",
      )}
    >
      {children}
    </div>
  );
}
