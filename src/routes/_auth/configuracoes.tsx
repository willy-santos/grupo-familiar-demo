import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  Globe,
  Pencil,
  Save,
  Shield,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  getChurchSettings,
  updateChurchSettings,
  type ChurchSettings,
} from "@/features/settings/churchSettings";

import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/AppShell";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/AuthProvider";

import {
  getUserPreferences,
  updateUserPreferences,
  type UserPreferences,
} from "@/features/settings/userPreferences";

export const Route = createFileRoute("/_auth/configuracoes")({
  component: ConfigPage,
});

const items = [
  {
    icon: Building2,
    label: "Dados da Igreja",
    desc: "Informações institucionais",
    section: "organization",
  },
  {
    icon: Bell,
    label: "Notificações",
    desc: "Alertas e resumos",
    section: "notifications",
  },
  {
    icon: Shield,
    label: "Segurança",
    desc: "Senha e sessões",
    section: "security",
  },
  {
    icon: Globe,
    label: "Idioma e região",
    desc: "Português (Brasil)",
    section: "locale",
  },
] as const;

function ConfigPage() {
  const { user, role } = useAuth();

  const [openSection, setOpenSection] =
    useState<string | null>(null);

  const [preferences, setPreferences] =
    useState<UserPreferences | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [church, setChurch] =
    useState<ChurchSettings | null>(null);

  const [churchLoading, setChurchLoading] =
    useState(true);

  const [churchSaving, setChurchSaving] =
    useState(false);

  const [churchEditing, setChurchEditing] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadChurch() {
      try {
        const data = await getChurchSettings();

        if (!cancelled) {
          setChurch(data);
        }
      } catch (error) {
        console.error(
          "[Configurações] Erro ao carregar dados da igreja:",
          error,
        );
      } finally {
        if (!cancelled) {
          setChurchLoading(false);
        }
      }
    }

    loadChurch();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
  const userId = user?.id;

  if (typeof userId !== "string" || userId.length === 0) {
    setLoading(false);
    return;
  }

  let cancelled = false;

  async function loadPreferences(id: string) {
    try {
      const data = await getUserPreferences(id);

      if (!cancelled) {
        setPreferences(data);
      }
    } catch (error) {
      console.error(
        "[Configurações] Erro ao carregar preferências:",
        error,
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadPreferences(userId);

  return () => {
    cancelled = true;
  };
}, [user?.id]);

  async function updatePreference(
    changes: Partial<
      Omit<UserPreferences, "user_id" | "updated_at">
    >,
  ) {
    if (!user?.id || !preferences) return;

    const previous = preferences;

    setPreferences({
      ...preferences,
      ...changes,
    });

    setSaving(true);

    try {
      const updated = await updateUserPreferences(
        user.id,
        changes,
      );

      setPreferences(updated);
    } catch (error) {
      console.error(
        "[Configurações] Erro ao salvar preferência:",
        error,
      );

      setPreferences(previous);
    } finally {
      setSaving(false);
    }
  }

  async function saveChurchSettings(
    changes: ChurchSettings,
  ) {
    setChurchSaving(true);

    try {
      const updated =
        await updateChurchSettings(changes);

      setChurch(updated);
      setChurchEditing(false);
    } catch (error) {
      console.error(
        "[Configurações] Erro ao salvar dados da igreja:",
        error,
      );
    } finally {
      setChurchSaving(false);
    }
  }

  function toggleSection(section: string) {
    setOpenSection((current) =>
      current === section ? null : section,
    );
  }

  return (
    <>
      <PageHeader title="Configurações" />

      <PageContainer>
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
          {items.map((item) => {
            const Icon = item.icon;
            const isOpen =
              openSection === item.section;

            return (
              <div
                key={item.section}
                className="border-b border-border/60 last:border-b-0"
              >
                {/* Cabeçalho */}
                <button
                  type="button"
                  onClick={() =>
                    toggleSection(item.section)
                  }
                  className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-muted"
                  aria-expanded={isOpen}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {item.label}
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>

                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {/* Conteúdo */}
                {isOpen && (
                  <div className="border-t border-border/60 bg-muted/20 px-4 pb-5 pt-4">
                    {item.section ===
                      "organization" && (
                      <OrganizationSection
                        church={church}
                        loading={churchLoading}
                        editing={churchEditing}
                        saving={churchSaving}
                        canEdit={role === "admin"}
                        onEdit={() =>
                          setChurchEditing(true)
                        }
                        onCancel={() =>
                          setChurchEditing(false)
                        }
                        onSave={saveChurchSettings}
                      />
                    )}

                    {item.section ===
                      "notifications" && (
                      <NotificationsSection
                        preferences={preferences}
                        loading={loading}
                        saving={saving}
                        updatePreference={
                          updatePreference
                        }
                      />
                    )}

                    {item.section === "security" && (
                      <SecuritySection />
                    )}

                    {item.section === "locale" && (
                      <LocaleSection />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PageContainer>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Dados da Igreja                                                            */
/* -------------------------------------------------------------------------- */

function OrganizationSection({
  church,
  loading,
  editing,
  saving,
  canEdit,
  onEdit,
  onCancel,
  onSave,
}: {
  church: ChurchSettings | null;
  loading: boolean;
  editing: boolean;
  saving: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (settings: ChurchSettings) => Promise<void>;
}) {
  const [form, setForm] =
    useState<ChurchSettings | null>(church);

  useEffect(() => {
    if (!editing) {
      setForm(church);
    }
  }, [church, editing]);

  function updateField(
    field: keyof ChurchSettings,
    value: string,
  ) {
    if (!form) return;

    setForm({
      ...form,
      [field]: value,
    });
  }

  if (loading || !church) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Carregando dados da igreja...
        </p>
      </div>
    );
  }

  if (editing && form) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              Editar dados institucionais
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Altere as informações da igreja.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingInput
            label="Nome da igreja"
            value={form.name}
            onChange={(value) =>
              updateField("name", value)
            }
            className="sm:col-span-2"
          />

          

          <SettingInput
            label="CNPJ"
            value={form.cnpj}
            onChange={(value) =>
              updateField("cnpj", value)
            }
          />

          <SettingInput
            label="Telefone"
            value={form.phone}
            onChange={(value) =>
              updateField("phone", value)
            }
          />

          <SettingInput
            label="WhatsApp"
            value={form.whatsapp}
            onChange={(value) =>
              updateField("whatsapp", value)
            }
          />

          <SettingInput
            label="E-mail"
            value={form.email}
            onChange={(value) =>
              updateField("email", value)
            }
          />

          <SettingInput
            label="CEP"
            value={form.cep}
            onChange={(value) =>
              updateField("cep", value)
            }
          />

          <SettingInput
            label="Estado"
            value={form.state}
            onChange={(value) =>
              updateField("state", value)
            }
          />

          <SettingInput
            label="Cidade"
            value={form.city}
            onChange={(value) =>
              updateField("city", value)
            }
          />

          <SettingInput
            label="Bairro"
            value={form.neighborhood}
            onChange={(value) =>
              updateField("neighborhood", value)
            }
          />

          <SettingInput
            label="Rua"
            value={form.street}
            onChange={(value) =>
              updateField("street", value)
            }
          />

          <SettingInput
            label="Número"
            value={form.number}
            onChange={(value) =>
              updateField("number", value)
            }
          />

          <SettingInput
            label="Complemento"
            value={form.complement}
            onChange={(value) =>
              updateField("complement", value)
            }
            className="sm:col-span-2"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">
            Dados institucionais
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Informações oficiais da igreja.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
        )}
      </div>

      <div className="divide-y divide-border/60">
        <ChurchInfoRow
          label="Nome da igreja"
          value={church.name}
        />

        

        <ChurchInfoRow
          label="CNPJ"
          value={church.cnpj}
        />

        <ChurchInfoRow
          label="Telefone"
          value={church.phone}
        />

        <ChurchInfoRow
          label="WhatsApp"
          value={church.whatsapp}
        />

        <ChurchInfoRow
          label="E-mail"
          value={church.email}
        />

        <ChurchInfoRow
          label="CEP"
          value={church.cep}
        />

        <ChurchInfoRow
          label="Estado"
          value={church.state}
        />

        <ChurchInfoRow
          label="Cidade"
          value={church.city}
        />

        <ChurchInfoRow
          label="Bairro"
          value={church.neighborhood}
        />

        <ChurchInfoRow
          label="Rua"
          value={church.street}
        />

        <ChurchInfoRow
          label="Número"
          value={church.number}
        />

        <ChurchInfoRow
          label="Complemento"
          value={church.complement}
        />
      </div>
    </div>
  );
}

function ChurchInfoRow({
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

      <span className="text-right text-sm font-medium">
        {value || "Não informado"}
      </span>
    </div>
  );
}

function SettingInput({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Notificações                                                               */
/* -------------------------------------------------------------------------- */

function NotificationsSection({
  preferences,
  loading,
  saving,
  updatePreference,
}: {
  preferences: UserPreferences | null;
  loading: boolean;
  saving: boolean;
  updatePreference: (
    changes: Partial<
      Omit<UserPreferences, "user_id" | "updated_at">
    >,
  ) => Promise<void>;
}) {
  return (
    <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card px-4">
      <PreferenceSwitch
        label="Notificações por e-mail"
        checked={
          preferences?.email_notifications ?? true
        }
        disabled={loading || saving}
        onChange={(checked) =>
          updatePreference({
            email_notifications: checked,
          })
        }
      />

      <PreferenceSwitch
        label="Notificações push"
        checked={
          preferences?.push_notifications ?? true
        }
        disabled={loading || saving}
        onChange={(checked) =>
          updatePreference({
            push_notifications: checked,
          })
        }
      />

      <PreferenceSwitch
        label="Resumo semanal"
        checked={
          preferences?.weekly_summary ?? false
        }
        disabled={loading || saving}
        onChange={(checked) =>
          updatePreference({
            weekly_summary: checked,
          })
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Segurança                                                                  */
/* -------------------------------------------------------------------------- */

function SecuritySection() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold">
        Segurança da conta
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        O gerenciamento de senha e sessão será integrado
        ao Supabase Auth.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Idioma e região                                                            */
/* -------------------------------------------------------------------------- */

function LocaleSection() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold">
        Português (Brasil)
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        Região: Brasil
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        Fuso horário: America/Belem
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Switch                                                                     */
/* -------------------------------------------------------------------------- */

function PreferenceSwitch({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm">{label}</span>

      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}