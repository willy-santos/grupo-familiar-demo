import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, KeyRound, LogOut, Settings } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { supabase } from "@/lib/supabase";

import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";
import { useAuth } from "@/features/auth/AuthProvider";

export const Route = createFileRoute("/_auth/perfil")({
  component: PerfilPage,
});

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function PerfilPage() {
  const {
    user,
    profile,
    congregacao,
    grupoNome,
    loading,
  } = useAuth();

  const nome = profile?.full_name || "Usuário";
  const email = user?.email || "Não informado";
  const iniciais = getInitials(nome);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState<string | null>(null);

  const [passwordSuccess, setPasswordSuccess] =
    useState(false);

  /*
   * Carrega a foto atual do usuário.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadAvatar() {
      if (!user?.id || !profile?.avatar_url) {
        setAvatarUrl(null);
        return;
      }

      try {
        const { data, error } = await supabase.storage
          .from("photos")
          .createSignedUrl(profile.avatar_url, 60 * 60);

        if (error) {
          console.error(
            "[Perfil] Erro ao carregar avatar:",
            error,
          );

          return;
        }

        if (!cancelled) {
          setAvatarUrl(data.signedUrl);
        }
      } catch (error) {
        console.error(
          "[Perfil] Erro ao carregar avatar:",
          error,
        );
      }
    }

    loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.avatar_url]);

  /*
   * Abre o seletor de imagem.
   */
  function handleAvatarClick() {
    if (avatarLoading) return;

    fileInputRef.current?.click();
  }

  /*
   * Faz upload da nova foto.
   */
  async function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !user?.id) return;

    setAvatarError(null);

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setAvatarError(
        "Escolha uma imagem JPG, PNG ou WEBP.",
      );
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setAvatarError(
        "A imagem deve ter no máximo 5 MB.",
      );
      return;
    }

    setAvatarLoading(true);

    try {
      const extension =
        file.type === "image/jpeg"
          ? "jpg"
          : file.type === "image/png"
            ? "png"
            : "webp";

      const filePath =
        `${user.id}/avatar.${extension}`;

      /*
       * Remove extensões antigas para evitar
       * arquivos abandonados no Storage.
       */
      const oldFiles = [
        `${user.id}/avatar.jpg`,
        `${user.id}/avatar.jpeg`,
        `${user.id}/avatar.png`,
        `${user.id}/avatar.webp`,
      ].filter((path) => path !== filePath);

      if (oldFiles.length > 0) {
        const { error: removeError } =
          await supabase.storage
            .from("photos")
            .remove(oldFiles);

        if (removeError) {
          console.warn(
            "[Perfil] Não foi possível remover avatar antigo:",
            removeError,
          );
        }
      }

      /*
       * Upload da nova foto.
       */
      const { error: uploadError } =
        await supabase.storage
          .from("photos")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: true,
          });

      if (uploadError) {
        console.error(
          "[Perfil] Erro ao enviar avatar:",
          uploadError,
        );

        setAvatarError(
          "Não foi possível enviar a foto.",
        );

        return;
      }

      /*
       * Salva somente o caminho do arquivo no banco.
       */
      const { error: profileError } =
        await supabase
          .from("profiles")
          .update({
            avatar_url: filePath,
          })
          .eq("id", user.id);

      if (profileError) {
        console.error(
          "[Perfil] Erro ao salvar avatar no perfil:",
          profileError,
        );

        setAvatarError(
          "A foto foi enviada, mas não foi possível salvar o perfil.",
        );

        return;
      }

      /*
       * Gera uma URL temporária para exibir
       * imediatamente a nova imagem.
       */
      const { data: signedData, error: signedError } =
        await supabase.storage
          .from("photos")
          .createSignedUrl(
            filePath,
            60 * 60,
          );

      if (signedError) {
        console.error(
          "[Perfil] Erro ao gerar URL da foto:",
          signedError,
        );

        return;
      }

      setAvatarUrl(signedData.signedUrl);
    } catch (error) {
      console.error(
        "[Perfil] Erro inesperado ao alterar avatar:",
        error,
      );

      setAvatarError(
        "Não foi possível alterar a foto.",
      );
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError(
        "A senha deve ter pelo menos 6 caracteres.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "As senhas não coincidem.",
      );
      return;
    }

    setPasswordSaving(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (error) {
        console.error(
          "[Perfil] Erro ao alterar senha:",
          error,
        );

        setPasswordError(
          "Não foi possível alterar a senha.",
        );

        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setChangingPassword(false);
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleSignOut() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "[Perfil] Erro ao sair da conta:",
        error,
      );
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="Meu Perfil"
          back="/"
          actions={
            <Link
              to="/configuracoes"
              aria-label="Configurações"
              className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10"
            >
              <Settings className="h-5 w-5" />
            </Link>
          }
        />

        <PageContainer>
          <div className="rounded-2xl bg-card p-6 text-center shadow-card">
            <p className="text-sm text-muted-foreground">
              Carregando perfil...
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Meu Perfil"
        back="/"
        actions={
          <Link
            to="/configuracoes"
            aria-label="Configurações"
            className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10"
          >
            <Settings className="h-5 w-5" />
          </Link>
        }
      />

      <PageContainer>
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-card">
          <div className="relative">
            <div className="grid h-24 w-24 overflow-hidden place-items-center rounded-full bg-primary-soft text-2xl font-bold text-primary">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto de ${nome}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                iniciais
              )}
            </div>

            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={avatarLoading}
              className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated disabled:opacity-50"
              aria-label="Alterar foto"
            >
              <Camera className="h-4 w-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {avatarLoading && (
            <p className="text-xs text-muted-foreground">
              Enviando foto...
            </p>
          )}

          {avatarError && (
            <p className="text-center text-xs font-medium text-destructive">
              {avatarError}
            </p>
          )}

          <div className="text-center">
            <p className="text-lg font-bold">
              {nome}
            </p>

            <p className="text-sm text-muted-foreground">
              {email}
            </p>
          </div>
        </div>

        {/* Dados pessoais */}
        <section className="mt-4 rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">
              Dados pessoais
            </h2>
          </div>

          <div className="mt-4 divide-y divide-border/60">
            <ProfileRow
              label="Nome"
              value={nome}
            />

            <ProfileRow
              label="E-mail"
              value={email}
            />

            <ProfileRow
              label="Congregação"
              value={
                congregacao || "Não informado"
              }
            />

            <ProfileRow
              label="Grupo familiar"
              value={
                grupoNome || "Não informado"
              }
            />
          </div>
        </section>

        {/* Segurança */}
        <section className="mt-4 rounded-2xl bg-card p-5 shadow-card">
          <h2 className="text-base font-bold">
            Segurança
          </h2>

          {!changingPassword && (
            <button
              type="button"
              onClick={() => {
                setChangingPassword(true);
                setPasswordError(null);
                setPasswordSuccess(false);
              }}
              className="mt-3 flex w-full items-center gap-3 rounded-lg py-2 text-left text-sm font-semibold text-primary transition hover:bg-muted"
            >
              <KeyRound className="h-4 w-4" />
              Alterar senha
            </button>
          )}

          {changingPassword && (
  <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4">
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          Nova senha
        </span>

        <input
          type="password"
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setPasswordError(null);
            setPasswordSuccess(false);
          }}
          disabled={passwordSaving}
          autoComplete="new-password"
          placeholder="Digite a nova senha"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />

        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Mínimo de 6 caracteres.
        </p>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          Confirmar nova senha
        </span>

        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setPasswordError(null);
            setPasswordSuccess(false);
          }}
          disabled={passwordSaving}
          autoComplete="new-password"
          placeholder="Digite a senha novamente"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
      </label>
    </div>

    {passwordError && (
      <p className="mt-3 text-xs font-medium text-destructive">
        {passwordError}
      </p>
    )}

    <div className="mt-4 flex justify-end gap-2">
      <button
        type="button"
        onClick={() => {
          setChangingPassword(false);
          setNewPassword("");
          setConfirmPassword("");
          setPasswordError(null);
          setPasswordSuccess(false);
        }}
        disabled={passwordSaving}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
      >
        Cancelar
      </button>

      <button
        type="button"
        onClick={handleChangePassword}
        disabled={passwordSaving}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
      >
        {passwordSaving ? "Salvando..." : "Salvar senha"}
      </button>
    </div>
  </div>
)}

          {passwordSuccess && (
            <p className="mt-3 text-xs font-medium text-primary">
              Senha alterada com sucesso.
            </p>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-3 rounded-lg py-2 text-left text-sm font-semibold text-destructive transition hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        </section>
      </PageContainer>
    </>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>

      <span className="text-right text-sm font-semibold">
        {value}
      </span>
    </div>
  );
}