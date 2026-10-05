import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp } from "@/features/auth/service";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
const [showPassword, setShowPassword] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!nome.trim()) throw new Error("Informe seu nome.");
      if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
      await signUp(nome.trim(), email.trim(), password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-primary to-primary-hover px-4 py-10">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
<div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-elevated">
        <div className="flex flex-col items-center gap-2 text-center">
         <div className="flex h-20 w-full items-center justify-center">
  <img
    src="/pwa-512x512.png"
    alt="Grupo Familiar"
    className="h-28 w-auto object-contain"
  />
</div>
          <h1 className="mt-2 text-xl font-bold">
Crie sua conta no Grupo Familiar
</h1>

<p className="text-sm text-muted-foreground">
  Preencha seus dados para começar
</p>
        </div>

        {done ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm">
              Enviamos um e-mail de confirmação para <strong>{email}</strong>. Confirme para poder entrar.
            </p>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nome</span>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">E-mail</span>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@igreja.com" />
              </div>
            </label>
            <label className="block">
  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    Senha
  </span>

  <div className="relative mt-1">
    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

    <Input
      type={showPassword ? "text" : "password"}
      className="pl-9 pr-10"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="••••••••"
      autoComplete="new-password"
      required
    />

    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  </div>
</label>
            {error && (
  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
    {error}
  </p>
)}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
              size="lg"
              disabled={loading}
            >{loading ? (
  <>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    Criando...
  </>
) : (
  "Criar conta"
)}
              
            </Button>
          </form>
        )}

        <div className="mt-5 text-center text-xs">
  <Link
    to="/login"
    className="font-semibold text-primary hover:underline"
  >
    Já tenho uma conta
  </Link>
</div>

<p className="mt-4 translate-y-6 text-center text-xs text-muted-foreground">
  Feito por{" "}
  <span className="font-semibold text-primary">
    Willy Santos
  </span>
</p>
      </div>
    </div>
  );
}