import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/features/auth/service";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o e-mail.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary to-primary-hover px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-elevated">
        <div className="text-center">
          <h1 className="text-xl font-bold">Recuperar senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enviaremos um link para redefinir sua senha.
          </p>
        </div>
        {sent ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm">Se existir uma conta para <strong>{email}</strong>, o link foi enviado.</p>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">E-mail</span>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@igreja.com" />
              </div>
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary-hover" size="lg" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link"}
            </Button>
            <div className="text-center text-xs">
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Voltar ao login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}