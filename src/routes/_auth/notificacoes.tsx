import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/_auth/notificacoes")({
  component: NotificacoesPage,
});

function NotificacoesPage() {
  return (
    <>
      <PageHeader title="Notificações" />
      <PageContainer>
        <EmptyState
          icon={Bell}
          title="Sem notificações"
          description="Você será avisado aqui quando houver novidades."
        />
      </PageContainer>
    </>
  );
}
