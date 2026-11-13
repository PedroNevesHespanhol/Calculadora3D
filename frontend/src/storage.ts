import { suggestResellerMarkup } from "./calc.js";
import { supabase } from "./supabase.js";
import type { Accessory, Filament, Piece, Printer, QuoteDraft, Settings } from "./types.js";

export type CollectionTable = "printers" | "filaments" | "accessories" | "pieces";

const DEFAULT_CONSUMER_MARKUP = 3;

export const DEFAULT_SETTINGS: Settings = {
  energyPriceKwh: 0.95,
  defaultFailureRatePct: 5,
  defaultConsumerMarkup: DEFAULT_CONSUMER_MARKUP,
  defaultResellerMarkup: suggestResellerMarkup(DEFAULT_CONSUMER_MARKUP),
  marketplaceFeePct: 0,
  cardFeePct: 0,
};

export const DEFAULT_QUOTE_DRAFT: QuoteDraft = {
  clientName: "",
  notes: "",
  items: [],
};

interface Row<T> {
  id: string;
  data: Omit<T, "id">;
}

function fail(action: string, error: { message: string }): never {
  throw new Error(`Erro ao ${action}: ${error.message}`);
}

function createCrud<T extends { id: string }>(table: CollectionTable) {
  return {
    async list(): Promise<T[]> {
      const { data, error } = await supabase
        .from(table)
        .select("id, data")
        .order("created_at", { ascending: true });
      if (error) fail("carregar dados", error);
      return (data as Row<T>[]).map((row) => ({ ...row.data, id: row.id }) as T);
    },
    async add(item: Omit<T, "id">): Promise<T> {
      const id = crypto.randomUUID();
      const { error } = await supabase.from(table).insert({ id, data: item });
      if (error) fail("salvar", error);
      return { ...item, id } as T;
    },
    async update(id: string, item: Omit<T, "id">): Promise<T> {
      const { error } = await supabase.from(table).update({ data: item }).eq("id", id);
      if (error) fail("atualizar", error);
      return { ...item, id } as T;
    },
    async remove(id: string): Promise<void> {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) fail("remover", error);
    },
  };
}

export const printersStore = createCrud<Printer>("printers");
export const filamentsStore = createCrud<Filament>("filaments");
export const accessoriesStore = createCrud<Accessory>("accessories");
export const piecesStore = createCrud<Piece>("pieces");

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("Sessão expirada. Faça login novamente.");
  return id;
}

async function readUserData(column: "settings" | "quote_draft") {
  const { data, error } = await supabase.from("user_data").select(column).maybeSingle();
  if (error) fail("carregar dados", error);
  return (data as Record<string, unknown> | null)?.[column] ?? null;
}

async function writeUserData(values: { settings?: Settings; quote_draft?: QuoteDraft | null }) {
  const user_id = await getUserId();
  const { error } = await supabase
    .from("user_data")
    .upsert({ user_id, ...values, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) fail("salvar", error);
}

export const settingsStore = {
  async get(): Promise<Settings> {
    const saved = (await readUserData("settings")) as Partial<Settings> | null;
    return { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
  },
  async save(settings: Settings): Promise<void> {
    await writeUserData({ settings });
  },
};

export const quoteDraftStore = {
  async get(): Promise<QuoteDraft> {
    const saved = (await readUserData("quote_draft")) as Partial<QuoteDraft> | null;
    return { ...DEFAULT_QUOTE_DRAFT, ...(saved ?? {}) };
  },
  async save(draft: QuoteDraft): Promise<void> {
    await writeUserData({ quote_draft: draft });
  },
  async clear(): Promise<void> {
    await writeUserData({ quote_draft: null });
  },
};
