import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useState } from "react";

export const Route = createFileRoute("/_auth/oferta")({
  component: OfertaPage,
});

function OfertaPage() {
  const [copiado, setCopiado] = useState(false);

  function copiarPix() {
    navigator.clipboard.writeText("91981438267");
    setCopiado(true);

    setTimeout(() => {
      setCopiado(false);
    }, 2000);
  }

  return (
    <>
      <PageHeader title="Contribuições" />

      <PageContainer>
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              Contribua via PIX
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Escaneie o QR Code ou copie a chave PIX para realizar
              sua contribuição.
            </p>

            <div className="mt-6 flex justify-center">
              <img
                src="/Qr-code.jpg"
                alt="QR Code para contribuição via PIX"
                className="h-64 w-64 rounded-xl object-contain"
              />
            </div>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                Chave PIX
              </p>

              <p className="mt-1 text-lg font-semibold">
                91981438267
              </p>

              <button
                type="button"
                className="mt-3 rounded-xl border px-4 py-2"
                onClick={copiarPix}
              >
                {copiado ? "Chave copiada!" : "Copiar chave PIX"}
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}