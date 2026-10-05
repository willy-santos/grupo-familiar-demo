import { supabase } from "@/lib/supabase";

export type ChurchSettings = {
  name: string;
  
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement: string;
};

const DEFAULT_CHURCH_SETTINGS: ChurchSettings = {
  name: "Assembleia de Deus Nova Ananindeua",
  
  cnpj: "",
  phone: "",
  whatsapp: "",
  email: "",
  cep: "",
  state: "PA",
  city: "Ananindeua",
  neighborhood: "",
  street: "",
  number: "",
  complement: "",
};

export async function getChurchSettings(): Promise<ChurchSettings> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "church")
    .maybeSingle();

  if (error) {
    console.error(
      "[ChurchSettings] Erro ao carregar dados da igreja:",
      error,
    );

    return DEFAULT_CHURCH_SETTINGS;
  }

  if (!data?.value) {
    return DEFAULT_CHURCH_SETTINGS;
  }

  return {
    ...DEFAULT_CHURCH_SETTINGS,
    ...(data.value as Partial<ChurchSettings>),
  };
}

export async function updateChurchSettings(
  settings: ChurchSettings,
): Promise<ChurchSettings> {
  const { data, error } = await supabase
    .from("settings")
    .update({
      value: settings,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "church")
    .select("value")
    .single();

  if (error) {
    console.error(
      "[ChurchSettings] Erro ao salvar dados da igreja:",
      error,
    );

    throw error;
  }

  return {
    ...DEFAULT_CHURCH_SETTINGS,
    ...(data.value as Partial<ChurchSettings>),
  };
}