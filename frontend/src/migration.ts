// Importa para o Supabase os dados que versões antigas do app salvavam no localStorage.
import { supabase } from "./supabase.js";
import type { CollectionTable } from "./storage.js";

const LEGACY_LIST_KEYS: Record<CollectionTable, string> = {
  printers: "calc3d.printers",
  filaments: "calc3d.filaments",
  accessories: "calc3d.accessories",
  pieces: "calc3d.pieces",
};
const LEGACY_SETTINGS_KEY = "calc3d.settings";
const LEGACY_QUOTE_DRAFT_KEY = "calc3d.quoteDraft";

const ALL_KEYS = [...Object.values(LEGACY_LIST_KEYS), LEGACY_SETTINGS_KEY, LEGACY_QUOTE_DRAFT_KEY];

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readList(key: string): Array<{ id?: string } & Record<string, unknown>> {
  const value = readJson(key);
  return Array.isArray(value) ? value : [];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface LegacySummary {
  printers: number;
  filaments: number;
  accessories: number;
  pieces: number;
  hasSettings: boolean;
  hasQuoteDraft: boolean;
  total: number;
}

export function getLegacySummary(): LegacySummary {
  const counts = {
    printers: readList(LEGACY_LIST_KEYS.printers).length,
    filaments: readList(LEGACY_LIST_KEYS.filaments).length,
    accessories: readList(LEGACY_LIST_KEYS.accessories).length,
    pieces: readList(LEGACY_LIST_KEYS.pieces).length,
  };
  const hasSettings = readJson(LEGACY_SETTINGS_KEY) !== null;
  const hasQuoteDraft = readJson(LEGACY_QUOTE_DRAFT_KEY) !== null;
  const total =
    counts.printers + counts.filaments + counts.accessories + counts.pieces + (hasSettings ? 1 : 0) + (hasQuoteDraft ? 1 : 0);
  return { ...counts, hasSettings, hasQuoteDraft, total };
}

/**
 * Envia tudo do localStorage para o banco. Os IDs originais são mantidos, para que as
 * peças continuem apontando para as impressoras/filamentos/acessórios certos.
 * Rodar mais de uma vez é seguro: registros já importados são sobrescritos (upsert),
 * não duplicados. O localStorage não é apagado aqui.
 */
export async function importLegacyData(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Faça login antes de importar.");

  const baseTime = Date.now();
  for (const [table, key] of Object.entries(LEGACY_LIST_KEYS) as [CollectionTable, string][]) {
    const rows = readList(key).map((item, index) => {
      const { id, ...data } = item;
      return {
        id: id && UUID_RE.test(id) ? id : crypto.randomUUID(),
        user_id: userId,
        data,
        // Mantém a ordem original de cadastro.
        created_at: new Date(baseTime + index).toISOString(),
      };
    });
    if (rows.length === 0) continue;
    const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`Erro ao importar ${table}: ${error.message}`);
  }

  const settings = readJson(LEGACY_SETTINGS_KEY);
  const quoteDraft = readJson(LEGACY_QUOTE_DRAFT_KEY);
  if (settings !== null || quoteDraft !== null) {
    const values: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
    if (settings !== null) values.settings = settings;
    if (quoteDraft !== null) values.quote_draft = quoteDraft;
    const { error } = await supabase.from("user_data").upsert(values, { onConflict: "user_id" });
    if (error) throw new Error(`Erro ao importar configurações: ${error.message}`);
  }
}

export function clearLegacyData(): void {
  for (const key of ALL_KEYS) localStorage.removeItem(key);
}
