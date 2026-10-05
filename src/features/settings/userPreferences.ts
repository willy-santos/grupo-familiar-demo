import { supabase } from "@/lib/supabase";

export type UserPreferences = {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  weekly_summary: boolean;
  theme: "system" | "light" | "dark";
  locale: string;
  timezone: string;
  updated_at?: string;
};

const DEFAULT_PREFERENCES: Omit<UserPreferences, "user_id"> = {
  email_notifications: true,
  push_notifications: true,
  weekly_summary: false,
  theme: "system",
  locale: "pt-BR",
  timezone: "America/Belem",
};

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data as UserPreferences;
  }

  const { data: created, error: insertError } = await supabase
    .from("user_preferences")
    .insert({
      user_id: userId,
      ...DEFAULT_PREFERENCES,
    })
    .select("*")
    .single();

  if (insertError) {
    throw insertError;
  }

  return created as UserPreferences;
}

export async function updateUserPreferences(
  userId: string,
  changes: Partial<Omit<UserPreferences, "user_id" | "updated_at">>,
) {
  const { data, error } = await supabase
    .from("user_preferences")
    .update(changes)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as UserPreferences;
}