import {
  createClient
} from "@supabase/supabase-js";

export const supabaseUrl =
  "https://wotovotafnfxgljbigju.supabase.co";

export const supabaseAnonKey =
  "sb_publishable__S0fvT24O7SwwW6d62txlg_-r7EdF3J";

export const supabase =
  createClient(
    supabaseUrl,
    supabaseAnonKey
  );
