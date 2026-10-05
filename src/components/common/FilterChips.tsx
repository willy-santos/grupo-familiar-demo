import { useState } from "react";
import { cn } from "@/lib/utils";

export function FilterChips({
  options,
  defaultValue,
  onChange,
}: {
  options: string[];
  defaultValue?: string;
  onChange?: (v: string) => void;
}) {
  const [active, setActive] = useState(defaultValue ?? options[0]);
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 pb-1">
        {options.map((opt) => {
          const isActive = opt === active;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setActive(opt);
                onChange?.(opt);
              }}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
