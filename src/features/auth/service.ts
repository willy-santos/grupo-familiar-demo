import { supabase } from "@/lib/supabase";

export async function signIn(
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}


export async function signOut() {
  const { error } = await supabase.auth.signOut({
    scope: "local",
  });

  if (error) {
    throw error;
  }
}


export async function getSession() {
  const { data } = await supabase.auth.getSession();

  return data.session;
}

export async function signUp(nome: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: nome, full_name: nome },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });

  console.log("SIGNUP DATA:", data);
  console.log("SIGNUP ERROR:", error);

  if (error) throw error;

  return data;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}