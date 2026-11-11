import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Optional: when Supabase is not configured, receipts are uploaded to ImgBB instead.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
