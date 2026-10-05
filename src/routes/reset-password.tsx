import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePassword } from "@/features/auth/service";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
      await updatePassword(password);
      await supabase.auth.signOut({ scope: "local" });
      navigate({ to: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary to-primary-hover px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-elevated">
        <div className="text-center">
          <h1 className="text-xl font-bold">Definir nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">Escolha uma senha para sua conta.</p>
        </div>
        {!ready ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Abra o link enviado por e-mail para redefinir sua senha.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nova senha</span>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary-hover" size="lg" disabled={loading}>
              {loading ? "Salvando..." : "Salvar senha"}
            </Button>
          </form>
        )}
        <div className="mt-4 text-center text-xs">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}