import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActionIconButton({
  icon: Icon,
  label,
  tone = "default",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tone?: "default" | "destructive";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground",
        tone === "destructive" && "hover:text-destructive",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
