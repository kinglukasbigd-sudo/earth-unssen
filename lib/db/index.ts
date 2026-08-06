import { isSupabaseMode } from "@/lib/env";
import { localDb } from "@/lib/db/local";
import { supabaseDb } from "@/lib/db/supabase";

export const db = isSupabaseMode() ? supabaseDb : localDb;
