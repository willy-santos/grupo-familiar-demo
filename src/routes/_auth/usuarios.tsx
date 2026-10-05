import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, UserCog, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";

import {
  getLeaderRequests,
  approveLeaderRequest,
  updateLeaderRequestStatus,
  type LeaderRequest,
} from "@/features/auth/leaderRequestsService";
import {
  useUsers,
  setUserRole,
  createUser,
  setUserBlocked,
  type AppUser,
} from "@/lib/usersData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/features/auth/currentUser";
import { AccessDenied } from "@/components/common/AccessDenied";
import {
  useGroups,
  setGroupLeader,
  getGroupForLeaderEmail,
} from "@/lib/groupsData";


export const Route = createFileRoute("/_auth/usuarios")({
  component: UsuariosRoute,
});

function UsuariosRoute() {
  const currentUser = useCurrentUser();
  if (currentUser.role !== "admin") {
    return (
      <>
        <PageHeader title="Usuários" />
        <AccessDenied message="O módulo Usuários é exclusivo do Administrador." />
      </>
    );
  }
  return <UsuariosPage />;
}

type Role = AppUser["role"];
type Usuario = AppUser;

function initials(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function UsuariosPage() {
  const grupos = useGroups();
  const gruposAtivos = grupos.filter((g) => g.status === "Ativo");

  // Fonte única de usuários (inclui o usuário autenticado e todos os
  // líderes cadastrados em groupsData). Reconciliada automaticamente
  // com o vínculo Líder↔Grupo.
  const users = useUsers();
 const [leaderRequests, setLeaderRequests] = useState<LeaderRequest[]>([]);
useEffect(() => {
  async function loadRequests() {
  try {
    const data = await getLeaderRequests();

    console.log("Solicitações de liderança:", data);

    setLeaderRequests(data);
  } catch (error) {
    console.error("Erro ao carregar solicitações:", error);
    toast.error("Erro ao carregar solicitações de liderança.");
  }
}

  loadRequests();
}, []);







  const [editing, setEditing] = useState<Usuario | null>(null);
  const [pendingRole, setPendingRole] = useState<Role>("Membro");
  const [pendingGrupo, setPendingGrupo] = useState<string | undefined>(undefined);
  const [confirmarSubstituicao, setConfirmarSubstituicao] = useState(false);

  // ----- Criação de novo usuário -----
  const [creating, setCreating] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaRole, setNovaRole] = useState<Role>("Membro");
  const [novoGrupo, setNovoGrupo] = useState<string | undefined>(undefined);
  const [confirmarSubstituicaoNovo, setConfirmarSubstituicaoNovo] =
    useState(false);

  function openCreate() {
    setNovoNome("");
    setNovoEmail("");
    setNovaRole("Membro");
    setNovoGrupo(undefined);
    setConfirmarSubstituicaoNovo(false);
    setCreating(true);
  }

  useEffect(() => {
    if (novaRole === "Membro") {
      setNovoGrupo(undefined);
      setConfirmarSubstituicaoNovo(false);
    }
  }, [novaRole]);

  useEffect(() => {
    setConfirmarSubstituicaoNovo(false);
  }, [novoGrupo]);

  const novoGrupoAlvo = novoGrupo
    ? grupos.find((g) => g.nome === novoGrupo)
    : undefined;
  const novoLiderAtual =
    novaRole === "Líder" && novoGrupoAlvo?.liderEmail
      ? {
          nome: novoGrupoAlvo.liderNome ?? "Líder atual",
          email: novoGrupoAlvo.liderEmail,
        }
      : undefined;
  const novoGrupoOcupado = !!novoLiderAtual;
  const novoMissingGroup = novaRole === "Líder" && !novoGrupo;
  const novoBloqueado =
    novoMissingGroup || (novoGrupoOcupado && !confirmarSubstituicaoNovo);

  async function handleCreate() {
    if (novoBloqueado) return;
    let created: AppUser;
    try {
      created = createUser({
        nome: novoNome,
        email: novoEmail,
        role: novaRole,
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Não foi possível criar o usuário.";
      toast.error(msg);
      return;
    }

    

    toast.success("Usuário criado com sucesso!", {
      description: `${created.nome} (${created.email}) foi adicionado.`,
    });
    setCreating(false);
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setPendingRole(u.role);
    setPendingGrupo(u.grupo);
    setConfirmarSubstituicao(false);
  }

  // When switching to Membro, clear grupo selection.
  useEffect(() => {
    if (pendingRole === "Membro") {
      setPendingGrupo(undefined);
      setConfirmarSubstituicao(false);
    }
  }, [pendingRole]);

  // Reset substitution confirmation whenever the selected group changes.
  useEffect(() => {
    setConfirmarSubstituicao(false);
  }, [pendingGrupo]);

  const missingGroup = pendingRole === "Líder" && !pendingGrupo;

  // Grupo já ocupado? Consulta a fonte oficial (groupsData). Se o líder
  // atual do grupo for o próprio usuário sendo editado, não há conflito.
  const grupoAlvo = pendingGrupo
    ? grupos.find((g) => g.nome === pendingGrupo)
    : undefined;
  const liderAtualDoGrupo =
    pendingRole === "Líder" &&
    grupoAlvo?.liderEmail &&
    grupoAlvo.liderEmail.toLowerCase() !== (editing?.email ?? "").toLowerCase()
      ? {
          nome: grupoAlvo.liderNome ?? "Líder atual",
          email: grupoAlvo.liderEmail,
          id: users.find(
            (u) =>
              u.email.toLowerCase() === grupoAlvo.liderEmail!.toLowerCase(),
          )?.id,
        }
      : undefined;

  const grupoOcupado = !!liderAtualDoGrupo;
  const bloqueadoPorConflito = grupoOcupado && !confirmarSubstituicao;

async function save() {
  if (!editing || missingGroup || bloqueadoPorConflito) return;

  try {
    /*
     * Membro/Admin:
     * remove qualquer grupo que esse usuário esteja liderando.
     */
    if (pendingRole !== "Líder") {
      const meuGrupo = getGroupForLeaderEmail(editing.email);

      if (meuGrupo) {
        await setGroupLeader(meuGrupo.id, null);
      }
    }

    /*
     * Líder:
     * vincula o usuário ao grupo escolhido.
     */
    if (pendingRole === "Líder" && pendingGrupo && grupoAlvo) {
      await setGroupLeader(grupoAlvo.id, {
        id: editing.id,
        nome: editing.nome,
        email: editing.email,
      });
    }

    /*
     * Atualiza o cargo oficial.
     */
    const sucesso = await setUserRole(
      editing.id,
      pendingRole,
    );

    if (!sucesso) {
      toast.error(
        "Não foi possível atualizar o cargo no banco de dados.",
      );
      return;
    }

    toast.success("Cargo atualizado com sucesso.");

    setEditing(null);
  } catch (error) {
    console.error("[usuarios] erro ao salvar alteração:", error);

    toast.error(
      "Não foi possível atualizar o Grupo Familiar.",
    );
  }
}

async function handleToggleBlock(user: Usuario) {
  const bloquear = !user.isBlocked;

  try {
    await setUserBlocked(user.id, bloquear);

    toast.success(
      bloquear
        ? "Usuário bloqueado."
        : "Usuário desbloqueado."
    );
  } catch (error) {
    console.error("[USUARIOS] erro ao alterar bloqueio:", error);

    toast.error(
      bloquear
        ? "Não foi possível bloquear o usuário."
        : "Não foi possível desbloquear o usuário."
    );
  }
}
 async function handleRequestStatus(
  request: LeaderRequest,
  status: "aprovado" | "recusado"
) {
  try {
    if (status === "aprovado") {
  await approveLeaderRequest(request);
} else {
  await updateLeaderRequestStatus(request.id, "recusado");
}

    setLeaderRequests((prev) =>
      prev.filter((r) => r.id !== request.id)
    );

    toast.success(
      status === "aprovado"
        ? "Solicitação aprovada. Usuário promovido a líder."
        : "Solicitação recusada."
    );

  } catch {
    toast.error("Não foi possível atualizar a solicitação.");
  }
}
  return (
    <>
      <PageHeader
        title={`Usuários (${users.length})`}
        actions={
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Novo usuário
          </Button>
        }
      />
      <PageContainer>
        {leaderRequests.length > 0 && (
  <div className="mb-6 space-y-3">
    <h2 className="text-lg font-bold">
      Solicitações de Liderança
    </h2>

    {leaderRequests.map((request) => (
      <div
        key={request.id}
        className="rounded-2xl border border-border/60 bg-card p-4 shadow-card"
      >
        <p className="font-bold">
          {request.nome}
        </p>

        <p className="text-sm text-muted-foreground">
          {request.email}
        </p>

        <p className="mt-2 text-sm">
          Grupo: <b>{request.grupo_nome}</b>
        </p>

        <p className="text-sm">
          Área: <b>{request.area}</b>
        </p>

        <p className="text-sm">
          Congregação: <b>{request.congregacao}</b>
        </p>

        <div className="mt-4 flex gap-2">
          <Button
  onClick={() => handleRequestStatus(request, "aprovado")}
>
  Aprovar
</Button>

<Button
  variant="destructive"
  onClick={() => handleRequestStatus(request, "recusado")}
>
  Recusar
</Button>
        </div>
      </div>
    ))}
  </div>
)}
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {initials(u.nome)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
  <p className="truncate text-base font-bold">
    {u.nome}
  </p>

  {u.isBlocked && (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
      BLOQUEADO
    </span>
  )}
</div>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {u.email}
                </p>
                <p className="mt-1 text-xs">
                  <span className="text-muted-foreground">Função atual: </span>
                  <span className="font-bold uppercase tracking-wide text-primary">
                    {u.role}
                  </span>
                </p>
                {u.role === "Líder" && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Grupo responsável: </span>
                    <span className="truncate font-semibold uppercase tracking-wide">
                      {u.grupo ?? "—"}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
  <Button
    size="sm"
    variant="outline"
    onClick={() => openEdit(u)}
    className="gap-1.5"
  >
    <UserCog className="h-4 w-4" />
    Alterar função
  </Button>

  <Button
    size="sm"
    variant={u.isBlocked ? "default" : "destructive"}
    onClick={() => handleToggleBlock(u)}
  >
    {u.isBlocked ? "Desbloquear" : "Bloquear"}
  </Button>
</div>
            </div>
          ))}
        </div>
      </PageContainer>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar função</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Usuário: </span>
                  <span className="font-semibold">{editing.nome}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Função atual: </span>
                  <span className="font-semibold">{editing.role}</span>
                </p>
                {editing.role === "Líder" && editing.grupo && (
                  <p>
                    <span className="text-muted-foreground">Grupo atual: </span>
                    <span className="font-semibold">{editing.grupo}</span>
                  </p>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Nova função:</p>
                <RadioGroup
  value={pendingRole}
  onValueChange={(v) => setPendingRole(v as Role)}
>
  <div className="flex items-center gap-2">
    <RadioGroupItem id="role-membro" value="Membro" />
    <Label htmlFor="role-membro">Membro</Label>
  </div>

  <div className="flex items-center gap-2">
    <RadioGroupItem id="role-lider" value="Líder" />
    <Label htmlFor="role-lider">Líder</Label>
  </div>

  <div className="flex items-center gap-2">
    <RadioGroupItem id="role-admin" value="Admin" />
    <Label htmlFor="role-admin">Administrador</Label>
  </div>
</RadioGroup>
              </div>

              {pendingRole === "Líder" && (
                <div className="space-y-2">
                  <Label htmlFor="grupo-select" className="text-sm font-semibold">
                    Grupo Familiar responsável
                  </Label>
                  <Select
                    value={pendingGrupo}
                    onValueChange={(v) => setPendingGrupo(v)}
                  >
                    <SelectTrigger id="grupo-select">
                      <SelectValue placeholder="Selecionar Grupo Familiar" />
                    </SelectTrigger>
                    <SelectContent>
                      {gruposAtivos.map((g) => (
                        <SelectItem key={g.id} value={g.nome}>
                          {g.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {missingGroup && (
                    <p className="text-xs text-destructive">
                      Selecione um Grupo Familiar responsável para o líder.
                    </p>
                  )}
                  {grupoOcupado && liderAtualDoGrupo && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs">
                      <p className="font-semibold text-destructive">
                        Este grupo já possui um líder responsável.
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Líder atual:{" "}
                        <span className="font-semibold text-foreground">
                          {liderAtualDoGrupo.nome}
                        </span>
                      </p>
                      <label className="mt-2 flex items-start gap-2 text-foreground">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={confirmarSubstituicao}
                          onChange={(e) =>
                            setConfirmarSubstituicao(e.target.checked)
                          }
                        />
                        <span>
                          Substituir {liderAtualDoGrupo.nome} por{" "}
                          {editing?.nome}. {liderAtualDoGrupo.nome} passará a
                          ser Membro (sem grupo responsável).
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={save}
              disabled={missingGroup || bloqueadoPorConflito}
            >
              Salvar
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novo-nome" className="text-sm font-semibold">
                Nome
              </Label>
              <Input
                id="novo-nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Nome completo"
                maxLength={120}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novo-email" className="text-sm font-semibold">
                E-mail
              </Label>
              <Input
                id="novo-email"
                type="email"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                placeholder="usuario@email.com"
                maxLength={200}
                autoComplete="off"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Função</p>
              <RadioGroup
                value={novaRole}
                onValueChange={(v) => setNovaRole(v as Role)}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="novo-role-membro" value="Membro" />
                  <Label htmlFor="novo-role-membro">Membro</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="novo-role-lider" value="Líder" />
                  <Label htmlFor="novo-role-lider">Líder</Label>
                </div>
              </RadioGroup>
            </div>

            {novaRole === "Líder" && (
              <div className="space-y-2">
                <Label
                  htmlFor="novo-grupo-select"
                  className="text-sm font-semibold"
                >
                  Grupo Familiar responsável
                </Label>
                <Select
                  value={novoGrupo}
                  onValueChange={(v) => setNovoGrupo(v)}
                >
                  <SelectTrigger id="novo-grupo-select">
                    <SelectValue placeholder="Selecionar Grupo Familiar" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposAtivos.map((g) => (
                      <SelectItem key={g.id} value={g.nome}>
                        {g.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {novoMissingGroup && (
                  <p className="text-xs text-destructive">
                    Selecione um Grupo Familiar responsável para o líder.
                  </p>
                )}
                {novoGrupoOcupado && novoLiderAtual && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs">
                    <p className="font-semibold text-destructive">
                      Este grupo já possui um líder responsável.
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Líder atual:{" "}
                      <span className="font-semibold text-foreground">
                        {novoLiderAtual.nome}
                      </span>
                    </p>
                    <label className="mt-2 flex items-start gap-2 text-foreground">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={confirmarSubstituicaoNovo}
                        onChange={(e) =>
                          setConfirmarSubstituicaoNovo(e.target.checked)
                        }
                      />
                      <span>
                        Substituir {novoLiderAtual.nome} pelo novo usuário.{" "}
                        {novoLiderAtual.nome} passará a ser Membro (sem grupo
                        responsável).
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={novoBloqueado}>
              Criar usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
