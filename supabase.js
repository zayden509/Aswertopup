import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./data.js";

// null lè baz done a poko konfigire: sit la mache an mòd WhatsApp sèlman
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Mesaj erè Supabase yo an kreyòl. Erè fonksyon sèvè yo (supabase/schema.sql)
// deja an kreyòl, kidonk yo pase jan yo ye a.
export function errorText(error) {
  const msg = error?.message || String(error || "");
  if (/Invalid login credentials/i.test(msg)) return "Imèl oswa modpas la pa bon.";
  if (/already (been )?registered/i.test(msg)) return "Gen yon kont ak imèl sa a deja. Konekte pito.";
  if (/Password should be at least/i.test(msg)) return "Modpas la dwe gen omwen 6 karaktè.";
  if (/Email not confirmed/i.test(msg)) return "Konfime imèl ou anvan: gade nan bwat imèl ou.";
  if (/valid email|invalid format/i.test(msg)) return "Imèl sa a pa bon.";
  if (/rate limit|too many/i.test(msg)) return "Ou eseye twòp fwa. Tann kèk minit epi eseye ankò.";
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return "Pa gen koneksyon entènèt. Eseye ankò.";
  return msg || "Yon bagay pa mache. Eseye ankò.";
}
