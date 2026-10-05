import { supabase } from "@/lib/supabase";
import { addRealtimeListener } from "@/lib/realtime";
import { useSyncExternalStore } from "react";

export interface Offering {
  id: string;

  reportId?: string;

  groupId: string;
  leaderId: string;

  groupName?: string;
  leaderName?: string;
  area?: string;
  congregacao?: string;

  amount: number;

  offeringDate: string;
  referenceMonth?: string;

  notes?: string;

  status: "draft" | "confirmed" | "rejected";

  confirmedBy?: string;
  confirmedAt?: string;

  createdAt: string;
  updatedAt?: string;
}

export interface OfferingRow {
  id: string;

  report_id: string | null;

  group_id: string;
  leader_id: string;

  amount: number;

  offering_date: string;
  reference_month: string | null;

  notes: string | null;

  status: "draft" | "confirmed" | "rejected";

  confirmed_by: string | null;
  confirmed_at: string | null;

  created_at: string;
  updated_at: string | null;
}

export interface OfferingRowWithGroup extends OfferingRow {
  grupos?: {
    nome: string;
    lider_nome: string;
    area: string;
    congregacao: string;
  } | null;
}


export function rowToOffering(row: OfferingRow): Offering {
  return {
    id: row.id,

    reportId: row.report_id ?? undefined,

    groupId: row.group_id,
    leaderId: row.leader_id,

    amount: row.amount,

    offeringDate: row.offering_date,
    referenceMonth: row.reference_month ?? undefined,

    notes: row.notes ?? undefined,

    status: row.status,

    confirmedBy: row.confirmed_by ?? undefined,
    confirmedAt: row.confirmed_at ?? undefined,

    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function offeringToInsertRow(
  offering: Offering,
): Record<string, unknown> {
  return {
    report_id: offering.reportId ?? null,

    group_id: offering.groupId,
    leader_id: offering.leaderId,

    amount: offering.amount,

    offering_date: offering.offeringDate,
    reference_month: offering.referenceMonth ?? null,

    notes: offering.notes ?? null,

    status: offering.status,

    confirmed_by: offering.confirmedBy ?? null,
    confirmed_at: offering.confirmedAt ?? null,
  };
}
type OfferingStore = {
  state: Offering[];
  version: number;
  hydrated: boolean;
  hydrating: Promise<void> | null;
  listeners: Set<() => void>;
};

const __g = globalThis as unknown as {
  __adnaOfferingStore?: OfferingStore;
};

const store: OfferingStore =
  __g.__adnaOfferingStore ??
  (__g.__adnaOfferingStore = {
    state: [],
    version: 0,
    hydrated: false,
    hydrating: null,
    listeners: new Set<() => void>(),
  });


function emit() {
  store.version += 1;
  store.listeners.forEach((l) => l());
}


function subscribe(cb: () => void) {
  store.listeners.add(cb);
  void ensureHydrated();

  return () => {
    store.listeners.delete(cb);
  };
}


function getSnapshot() {
  return store.version;
}

async function hydrate(): Promise<void> {
 const { data, error } = await supabase
  .from("offerings")
  .select(`
    *,
    grupos (
      nome,
      lider_nome,
      area,
      congregacao
    )
  `)
  .order("created_at", { ascending: false });
  if (error) {
    console.error(
      "[offeringsData] falha ao carregar ofertas:",
      error,
    );

    store.hydrated = true;
    emit();
    return;
  }

  store.state = ((data ?? []) as OfferingRowWithGroup[]).map(
  (row) => ({
    ...rowToOffering(row),
    groupName: row.grupos?.nome,
    leaderName: row.grupos?.lider_nome,
    area: row.grupos?.area,
    congregacao: row.grupos?.congregacao,
  })
);

  store.hydrated = true;
  emit();
}

function ensureHydrated(): Promise<void> {
  if (store.hydrated) {
    return Promise.resolve();
  }

  if (!store.hydrating) {
    store.hydrating = hydrate().finally(() => {
      store.hydrating = null;
    });
  }

  return store.hydrating;
}
if (typeof window !== "undefined") {
  void ensureHydrated();
}
async function reloadOfferings() {
  console.log("[offeringsData] recarregando ofertas");

  store.hydrated = false;

  await ensureHydrated();
}
const globalStore = globalThis as {
  __adnaOfferingsRealtime?: boolean;
};

if (
  typeof window !== "undefined" &&
  !globalStore.__adnaOfferingsRealtime
) {
  globalStore.__adnaOfferingsRealtime = true;

  addRealtimeListener(
    "offerings",
    reloadOfferings,
  );
}
export function useOfferings(): Offering[] {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return store.state;
}

export function getOfferings(): Offering[] {
  return store.state;
}
export type NewOfferingInput = Omit<
  Offering,
  "id" | "status" | "createdAt" | "updatedAt"
> & {
  status?: Offering["status"];
};
export async function submitOffering(
  input: NewOfferingInput,
): Promise<Offering> {


  console.log("[submitOffering] input:", input);

  const novo: Offering = {
    ...input,
    id: crypto.randomUUID(),
    status: input.status ?? "draft",
    createdAt: new Date().toISOString(),
  };
  console.log("[submitOffering] novo:", novo);
  store.state = [novo, ...store.state];
  emit();

  const payload = offeringToInsertRow(novo);

console.log("[INSERT PAYLOAD]", payload);

const {
  data: { user },
} = await supabase.auth.getUser();

console.log("[CURRENT USER]", user?.id);

const { data, error } = await supabase
  .from("offerings")
  .insert(payload)
  .select()
  .single();

console.log("[INSERT DATA]", data);
console.log("[INSERT ERROR]", error);

if (error) {
  console.error(
    "[offeringsData] falha ao inserir oferta:",
    error,
  );

  store.hydrated = false;
  void ensureHydrated();
  return novo;
}

if (data) {
  store.state = store.state.map((o) =>
    o.id === novo.id
      ? {
          ...o,
          id: data.id,
        }
      : o,
  );

  emit();
}
    

  return novo;
}

