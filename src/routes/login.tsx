import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/features/auth/service";
import { useAuth } from "@/features/auth/AuthContext";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const {
  session,
  loading: authLoading,
  blocked,
} = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleLogin(e: React.FormEvent) {
  e.preventDefault();

  setLoading(true);
  setError("");
try {
  await signIn(email, password);
} catch (err) {
    console.error("[LOGIN] Erro:", err);
    setError("E-mail ou senha inválidos");
  } finally {
    setLoading(false);
  }
}
useEffect(() => {
  if (!authLoading && session && !blocked) {
    navigate({
      to: "/",
      replace: true,
    });
  }
}, [authLoading, session, blocked, navigate]);
if (authLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">
        Carregando...
      </p>
    </div>
  );
}
if (blocked) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-primary to-primary-hover px-4 py-10">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-elevated">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-full items-center justify-center">
            <img
              src="/pwa-512x512.png"
              alt="AD Nova Ananindeua"
              className="h-28 w-auto object-contain"
            />
          </div>

          <h1 className="mt-4 text-xl font-bold">
            Conta bloqueada!
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Seu acesso ao Grupo Familiar foi bloqueado.
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Entre em contato com a administração para obter mais informações.
          </p>

          <Button
            className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary-hover"
            size="lg"
            onClick={() => {
              window.location.reload();
            }}
          >
            Voltar
          </Button>
        </div>

<p className="mt-8 translate-y-6 text-center text-xs text-muted-foreground">
            Feito por{" "}
          <span className="font-semibold text-primary">
            Willy Santos
          </span>
        </p>
      </div>
    </div>
  );
}
if (session) {
  return null;
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
    alt="AD Nova Ananindeua"
    className="h-28 w-auto object-contain"
  />
</div>
         <h1 className="mt-2 text-xl font-bold">
  Bem-vindo(a) ao Grupo Familiar!
</h1>

<p className="text-sm text-muted-foreground">
  Acesse sua conta para continuar
</p>
        </div>

        <form 
  className="mt-6 space-y-4" 
  onSubmit={handleLogin}
>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              E-mail
            </span>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              
              <Input
  type="email"
  placeholder="voce@igreja.com"
  className="pl-9"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>
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
  placeholder="••••••••"
  className="pl-9 pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  autoComplete="current-password"
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
  className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
  size="lg"
  disabled={loading}
>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Entrando...
    </>
  ) : (
    "Entrar"
  )}
</Button>
        </form>

       <div className="mt-5 flex items-center justify-between text-xs">
  <Link
    to="/forgot-password"
    className="font-semibold text-primary hover:underline"
  >
    Esqueci a senha
  </Link>

  <Link
    to="/signup"
    className="font-semibold text-primary hover:underline"
  >
    Criar conta
  </Link>
</div>

<p className="mt-8 translate-y-6 text-center text-xs text-muted-foreground">
  Feito por{" "}
  <span className="font-semibold text-primary">
    Willy Santos
  </span>
</p>
        
      </div>
    </div>
  );
}
