import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus } from "lucide-react";
import { PageHeader, HeaderIconButton } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";
import { FilterChips } from "@/components/common/FilterChips";

export const Route = createFileRoute("/_auth/fotos")({
  component: FotosPage,
});

const fotos = [
  "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=400&q=80",
  "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&q=80",
  "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80",
  "https://images.unsplash.com/photo-1444492156450-1e0e01316ed2?w=400&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80",
  "https://images.unsplash.com/photo-1441829266145-6d4bfb7a3a22?w=400&q=80",
  "https://images.unsplash.com/photo-1503248739131-b84fe45c85c1?w=400&q=80",
  "https://images.unsplash.com/photo-1439405326854-014607f694d7?w=400&q=80",
];

function FotosPage() {
  return (
    <>
      <PageHeader
        title="Fotos"
        actions={
          <>
            <HeaderIconButton label="Buscar">
              <Search className="h-5 w-5" />
            </HeaderIconButton>
            <HeaderIconButton label="Nova foto">
              <Plus className="h-5 w-5" />
            </HeaderIconButton>
          </>
        }
      />
      <PageContainer>
        <FilterChips options={["Todos", "Batismos", "Cultos", "EBD", "Eventos", "Grupos"]} />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {fotos.map((src, i) => (
            <div
              key={i}
              className="aspect-square overflow-hidden rounded-xl border border-border/40 bg-muted shadow-card"
            >
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
