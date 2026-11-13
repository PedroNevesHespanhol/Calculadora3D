import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Chave "publishable" (sb_publishable_...), que substitui a antiga chave "anon".
// É pública por natureza: a proteção dos dados vem do login + RLS no banco.
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && publishableKey);

// Com valores vazios o createClient lança erro; usamos um placeholder e o App mostra
// uma mensagem pedindo para configurar o .env.
export const supabase = createClient(url || "http://localhost", publishableKey || "missing-key");
