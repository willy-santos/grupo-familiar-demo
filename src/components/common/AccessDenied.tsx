import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessDeniedProps {
  message?: string;
}

export function AccessDenied({ message }: AccessDeniedProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">Acesso negado</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {message ??
            "Este módulo é exclusivo do Administrador. Se você acredita que isto é um erro, procure a liderança."}
        </p>
      </div>
      <Button asChild>
        <Link to="/">Voltar para o início</Link>
      </Button>
    </div>
  );
}
