import { supabase } from "@/lib/supabase";

export interface LeaderRequest {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  grupo_nome: string;
  campo: string;
  area: string;
  congregacao: string;
  area_id: string;
  congregacao_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}


export async function getLeaderRequests() {
  const { data, error } = await supabase
    .from("leader_requests")
    .select("*")
    .eq("status", "pendente");

  if (error) {
    throw error;
  }

  return data as LeaderRequest[];
}


export async function updateLeaderRequestStatus(
  id: string,
  status: "aprovado" | "recusado"
) {
  const { error } = await supabase
    .from("leader_requests")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function approveLeaderRequest(request: LeaderRequest) {
  const { error } = await supabase.rpc(
    "approve_leader_request",
    {
      request_id: request.id,
    }
  );

  if (error) {
  console.error("ERRO RPC APPROVE:", JSON.stringify(error, null, 2));
  throw error;
  }
}

export async function rejectLeaderRequest(id: string) {
  await updateLeaderRequestStatus(id, "recusado");
}