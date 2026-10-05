import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  back?: boolean | string;
  actions?: ReactNode;
}

export function PageHeader({ title, back = true, actions }: PageHeaderProps) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
        {back && (
          <button
            type="button"
            onClick={() =>
              typeof back === "string" ? router.navigate({ to: back }) : router.history.back()
            }
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg transition hover:bg-white/10"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold uppercase tracking-wide">
          {title}
        </h1>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
    </header>
  );
}

export function HeaderIconButton({
  children,
  onClick,
  as,
  to,
  label,
}: {
  children: ReactNode;
  onClick?: () => void;
  as?: "link";
  to?: string;
  label: string;
}) {
  const cls =
    "grid h-9 w-9 place-items-center rounded-lg transition hover:bg-white/10 text-primary-foreground";
  if (as === "link" && to) {
    return (
      <Link to={to} className={cls} aria-label={label}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label}>
      {children}
    </button>
  );
}
