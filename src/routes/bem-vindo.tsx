import {
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  User,
  Users,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
console.log("ARQUIVO BEM-VINDO IMPORTADO");
export const Route = createFileRoute("/bem-vindo")({
  beforeLoad: async () => {
    console.log("[BEM-VINDO] verificando acesso...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Sem usuário logado
    if (!user) {
      throw redirect({
        to: "/login",
      });
    }

    // Verifica o perfil diretamente no Supabase
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(
        "[BEM-VINDO] Erro ao verificar perfil:",
        error,
      );

      // Em caso de erro, não libera a tela
      throw redirect({
        to: "/",
      });
    }

    console.log("[BEM-VINDO] onboarding:", {
      userId: user.id,
      completed: profile.onboarding_completed,
    });

    // Usuário que JÁ concluiu o onboarding
    // não pode acessar /bem-vindo
    if (profile.onboarding_completed === true) {
      console.log(
        "[BEM-VINDO] acesso negado: onboarding já concluído",
      );

      throw redirect({
        to: "/",
      });
    }

    // Somente usuário novo continua
    console.log(
      "[BEM-VINDO] acesso permitido: usuário novo",
    );
  },

  component: BemVindoPage,
});
function BemVindoPage() {
  console.log("BEM VINDO COMPONENTE CARREGOU");

  const navigate = useNavigate();

  const [tipo, setTipo] = useState<"inicio" | "lider">("inicio");

  const [nome, setNome] = useState("");
  const [grupo, setGrupo] = useState("");

  const [area, setArea] = useState("");
  const [congregacao, setCongregacao] = useState("");

const [areaId, setAreaId] = useState("");
const [congregacaoId, setCongregacaoId] = useState("");

const [areas, setAreas] = useState<
  { id: string; name: string }[]
>([]);

const [congregacoes, setCongregacoes] = useState<
  { id: string; name: string }[]
>([]);


  
 

useEffect(() => {
  async function carregarAreas() {
    const { data, error } = await supabase
      .from("areas")
      .select("id, name")
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setAreas(data ?? []);
  }

  carregarAreas();
}, []);

useEffect(() => {
  async function carregarCongregacoes() {
    if (!areaId) {
      setCongregacoes([]);
      return;
    }

    const { data, error } = await supabase
      .from("congregations")
      .select("id, name")
      .eq("area_id", areaId)
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setCongregacoes(data ?? []);
  }

  carregarCongregacoes();

}, [areaId]);


  async function continuarComoMembro() {
    const { data } = await supabase.auth.getUser();

    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
      })
      .eq("id", data.user?.id);

    navigate({
      to: "/",
    });
  }

 async function solicitarLideranca() {
  if (!nome || !grupo || !area || !congregacao) {
    toast.error(
      "Preencha todos os campos antes de enviar a solicitação."
    );
    return;
  }

  const { data: userData } = await supabase.auth.getUser();

  const user = userData.user;

  if (!user) {
    toast.error("Usuário não encontrado.");
    return;
  }

const { error } = await supabase
  .from("leader_requests")
  .insert({
    user_id: user.id,
    nome: nome.trim(),
    email: user.email,
    grupo_nome: grupo.trim(),

    campo: "ADNA Nova Ananindeua",

    area,
    congregacao,

    area_id: areaId,
    congregacao_id: congregacaoId,

    status: "pendente",
  });

  if (error) {
    toast.error("Erro ao enviar solicitação.");
    console.error(error);
    return;
  }

await supabase
  .from("profiles")
  .update({
    onboarding_completed: true,
  })
  .eq("id", user.id);

  const mensagem = `
Olá, gostaria de solicitar autorização para liderar um Grupo Familiar.

Nome: ${nome.trim()}
Grupo: ${grupo.trim()}
Área: ${area.trim()}
Congregação: ${congregacao.trim()}
`;

 const url = `https://wa.me/5591981402934?text=${encodeURIComponent(mensagem)}`;

window.open(url, "_blank");

toast.success("Solicitação enviada com sucesso!");

navigate({
  to: "/",
});
}
 if (tipo === "lider") {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-2xl font-bold">
            Solicitar liderança
          </h1>
<p className="text-sm text-muted-foreground">
  Preencha os dados abaixo. Após enviar a mensagem pelo WhatsApp,
  o administrador analisará sua solicitação.
</p>
          <Input
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <Input
            placeholder="Nome do Grupo Familiar"
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
          />

          <select
  className="w-full rounded-md border bg-background p-2"
  value={areaId}
  onChange={(e) => {
    const id = e.target.value;

    setAreaId(id);
    setCongregacaoId("");

    const selecionada = areas.find(
      (a) => a.id === id
    );

    setArea(selecionada?.name ?? "");
    setCongregacao("");
  }}
>
  <option value="">
    Selecione a Área
  </option>

  {areas.map((a) => (
    <option key={a.id} value={a.id}>
      {a.name}
    </option>
  ))}
</select>


<select
  className="w-full rounded-md border bg-background p-2"
  value={congregacaoId}
  disabled={!areaId}
  onChange={(e) => {
    const id = e.target.value;

    setCongregacaoId(id);

    const selecionada = congregacoes.find(
      (c) => c.id === id
    );

    setCongregacao(selecionada?.name ?? "");
  }}
>
  <option value="">
    Selecione a Congregação
  </option>

  {congregacoes.map((c) => (
    <option key={c.id} value={c.id}>
      {c.name}
    </option>
  ))}
</select>
<div className="pt-2" />
          <Button
            className="w-full"
            onClick={solicitarLideranca}
          >
           <MessageCircle className="mr-2 h-4 w-4" />
Enviar pelo WhatsApp
          </Button>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => setTipo("inicio")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

 return (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Card className="w-full max-w-md">
      <CardContent className="space-y-6 p-8 text-center">
        <h1 className="text-3xl font-bold">
  Bem-vindo ao ADNA
</h1>

<p className="text-muted-foreground leading-relaxed">
  Escolha como deseja utilizar o sistema.
  Você poderá solicitar acesso como líder a qualquer momento.
</p>

       <Button className="w-full" onClick={continuarComoMembro}>
  <User className="mr-2 h-4 w-4" />
  Continuar como Membro
</Button>

       <Button
  className="w-full"
  variant="outline"
  onClick={() => setTipo("lider")}
>
  <Users className="mr-2 h-4 w-4" />
  Solicitar liderança
</Button>
      </CardContent>
    </Card>
  </div>
);
}