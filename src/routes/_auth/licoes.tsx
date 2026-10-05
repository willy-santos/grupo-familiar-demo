import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  getLessons,
  getLessonPdfUrl,
  createLesson,
  type Lesson,
} from "@/lib/lessonsData";
import { generateReportsForWeek } from "@/lib/reportsData";
import {
  FileText,
  Calendar,
  Eye,
  Download,
  Plus,
} from "lucide-react";

import {
  PageHeader,
  HeaderIconButton,
} from "@/components/layout/PageHeader";

import { PageContainer } from "@/components/layout/AppShell";

import { useAuth } from "@/features/auth/AuthProvider";

import { supabase } from "@/lib/supabase";
import { addRealtimeListener } from "@/lib/realtime";
export const Route = createFileRoute("/_auth/licoes")({
  component: LicoesPage,
});

function LicoesPage() {
  const { user } = useAuth();

  const [licoes, setLicoes] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [semana, setSemana] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  // --------------------------------
  // CARREGAR LIÇÕES
  // --------------------------------
useEffect(() => {
  console.log(
    "[LicoesPage] estado licoes mudou:",
    licoes.length,
    licoes.map((l) => l.title),
  );
}, [licoes]);
  async function carregarLicoes() {
    try {
      setLoading(true);

      const data = await getLessons();

      setLicoes(data);
    } catch (error) {
      console.error(
        "[LicoesPage] erro ao carregar lições:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

 useEffect(() => {
  void carregarLicoes();

  const unsubscribe = addRealtimeListener(
    "lessons",
    () => {
      console.log(
        "[LicoesPage] Realtime: atualizando lições",
      );

      void carregarLicoes();
    },
  );

  return unsubscribe;
}, []);

  // --------------------------------
  // VERIFICAR ADMIN
  // --------------------------------

  useEffect(() => {
    async function verificarAdmin() {
      if (!user?.id) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", user.id)
        .eq(
          "role_id",
          "001c769c-9dd7-463e-ae54-48c529280daa",
        )
        .maybeSingle();

      if (error) {
        console.error(
          "[LicoesPage] erro ao verificar admin:",
          error,
        );

        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }

      setCheckingAdmin(false);
    }

    verificarAdmin();
  }, [user]);

  // --------------------------------
  // VISUALIZAR PDF
  // --------------------------------

  async function visualizarPdf(filePath: string) {
    try {
      const url = await getLessonPdfUrl(filePath);

      if (!url) {
        console.error(
          "[LicoesPage] PDF não encontrado:",
          filePath,
        );
        return;
      }

      window.open(
        url,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      console.error(
        "[LicoesPage] erro ao visualizar PDF:",
        error,
      );
    }
  }

  // --------------------------------
  // BAIXAR PDF
  // --------------------------------

  async function baixarPdf(filePath: string) {
    try {
      const url = await getLessonPdfUrl(filePath);

      if (!url) {
        console.error(
          "[LicoesPage] PDF não encontrado:",
          filePath,
        );
        return;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Falha ao baixar PDF: ${response.status}`,
        );
      }

      const blob = await response.blob();

      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download =
        filePath.split("/").pop() ?? "licao.pdf";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(
        "[LicoesPage] erro ao baixar PDF:",
        error,
      );
    }
  }

  // --------------------------------
  // PUBLICAR LIÇÃO
  // --------------------------------

  async function publicarLicao() {
  if (!user?.id) {
    return;
  }

  if (!titulo.trim()) {
    alert("Informe o título da lição.");
    return;
  }

  if (!semana) {
    alert("Informe a semana da lição.");
    return;
  }

  if (!arquivo) {
    alert("Selecione o arquivo PDF.");
    return;
  }

  if (
    arquivo.type !== "application/pdf" &&
    !arquivo.name.toLowerCase().endsWith(".pdf")
  ) {
    alert("Selecione um arquivo PDF.");
    return;
  }

  try {
  setPublishing(true);

 const novaLicao = await createLesson({
  title: titulo.trim(),
  description: descricao.trim(),
  weekReference: semana,
  file: arquivo,
  uploadedBy: user.id,
});

console.log("[LicoesPage] LIÇÃO CRIADA:", novaLicao);

// A geração dos relatórios é independente da publicação da lição.
// Se falhar, não devemos considerar a publicação da lição como falha.
try {
  await generateReportsForWeek(semana);

  console.log(
    "[LicoesPage] relatórios da semana gerados com sucesso:",
    semana,
  );
} catch (error) {
  console.error(
    "[LicoesPage] lição criada, mas houve erro ao gerar relatórios:",
    error,
  );
}

  const listaAtualizada = await getLessons();

  console.log(
  "[LicoesPage] LISTA APÓS CRIAR:",
  listaAtualizada.map((l) => ({
    id: l.id,
    title: l.title,
    createdAt: l.createdAt,
  })),
);

console.log(
  "[LicoesPage] LIÇÃO CRIADA:",
  {
    id: novaLicao.id,
    title: novaLicao.title,
  },
);

  setLicoes(listaAtualizada);
console.log(
  "[LicoesPage] setLicoes recebeu:",
  listaAtualizada.length,
);
  setTitulo("");
  setDescricao("");
  setSemana("");
  setArquivo(null);

  setOpenForm(false);
} catch (error) {
  console.error(
    "[LicoesPage] erro ao publicar lição:",
    error,
  );

  alert(
    "Não foi possível publicar a lição. Verifique o console.",
  );
} finally {
  setPublishing(false);
}
}

  return (
    <>
      <PageHeader
        title="Lições"
        actions={
          !checkingAdmin && isAdmin ? (
            <HeaderIconButton
              label="Nova lição"
              onClick={() => setOpenForm(true)}
            >
              <Plus className="h-4 w-4" />
            </HeaderIconButton>
          ) : null
        }
      />

      <PageContainer>
        {/* -------------------------------- */}
        {/* FORMULÁRIO */}
        {/* -------------------------------- */}

        {openForm && (
          <div className="mb-6 rounded-2xl border bg-card p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Nova lição
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Publique a lição semanal em PDF.
              </p>
            </div>

            <div className="space-y-4">
              {/* TÍTULO */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Título
                </label>

                <input
                  type="text"
                  value={titulo}
                  onChange={(e) =>
                    setTitulo(e.target.value)
                  }
                  placeholder="Ex.: A fé que agrada a Deus"
                  className="w-full rounded-xl border bg-background p-3 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* DESCRIÇÃO */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Tema / descrição
                </label>

                <textarea
                  value={descricao}
                  onChange={(e) =>
                    setDescricao(e.target.value)
                  }
                  placeholder="Descreva brevemente o tema da lição."
                  rows={3}
                  className="w-full resize-none rounded-xl border bg-background p-3 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* SEMANA */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Semana
                </label>

                <input
                  type="date"
                  value={semana}
                  onChange={(e) =>
                    setSemana(e.target.value)
                  }
                  className="w-full rounded-xl border bg-background p-3 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* PDF */}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Arquivo PDF
                </label>

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) =>
                    setArquivo(
                      e.target.files?.[0] ?? null,
                    )
                  }
                  className="w-full rounded-xl border bg-background p-3 text-sm"
                />

                {arquivo && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {arquivo.name}
                  </p>
                )}
              </div>

              {/* BOTÕES */}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => {
                    setOpenForm(false);
                    setTitulo("");
                    setDescricao("");
                    setSemana("");
                    setArquivo(null);
                  }}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={publishing}
                  onClick={publicarLicao}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publishing
                    ? "Publicando..."
                    : "Publicar lição"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------- */}
        {/* LISTA */}
        {/* -------------------------------- */}

        {loading ? (
          <div className="rounded-xl border p-6 text-center text-muted-foreground">
            Carregando lições...
          </div>
        ) : licoes.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-muted-foreground">
            Nenhuma lição publicada.
          </div>
        ) : (
         <div className="grid gap-4">
  
            {licoes.map((l) => (
              <article
                key={l.id}
                className="rounded-2xl border bg-card p-5"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Lição semanal
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    {l.title}
                  </h2>

                  {l.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {l.description}
                    </p>
                  )}

                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />

                      {l.weekReference
                        ? new Date(
                            l.weekReference,
                          ).toLocaleDateString(
                            "pt-BR",
                          )
                        : "Semana não informada"}
                    </p>

                    <p className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />

                      {l.filePath}
                    </p>

                    <p className="text-xs">
                      Publicado em{" "}
                      {new Date(
                        l.createdAt,
                      ).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        visualizarPdf(
                          l.filePath,
                        )
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                    >
                      <Eye className="h-4 w-4" />
                      Visualizar PDF
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        baixarPdf(l.filePath)
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                    >
                      <Download className="h-4 w-4" />
                      Baixar PDF
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
