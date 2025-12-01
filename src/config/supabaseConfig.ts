import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let supabaseAdminInstance: SupabaseClient | null = null;
let supabaseClientInstance: SupabaseClient | null = null;

/**
 * Get or create Supabase admin client
 * Throws error if environment variables are not set
 */
function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is required in environment variables");
  }

  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required in environment variables");
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminInstance;
}

/**
 * Get or create Supabase client
 * Throws error if environment variables are not set
 */
function getSupabaseClient(): SupabaseClient {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is required in environment variables");
  }

  if (!supabaseAnonKey) {
    throw new Error("SUPABASE_ANON_KEY is required in environment variables");
  }

  supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClientInstance;
}

/**
 * Supabase client with service role key
 * Use this for admin operations that bypass RLS (Row Level Security)
 * WARNING: Never expose this key to the client
 * 
 * This lazily initializes the client when first accessed
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
}) as SupabaseClient;

/**
 * Supabase client with anon key
 * Use this for client-side operations that respect RLS
 * 
 * This lazily initializes the client when first accessed
 */
export const supabaseClient: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
}) as SupabaseClient;

export default {
  get supabaseUrl() {
    return process.env.SUPABASE_URL;
  },
  get supabaseServiceKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
  get supabaseAnonKey() {
    return process.env.SUPABASE_ANON_KEY;
  },
  get supabaseAdmin() {
    return getSupabaseAdmin();
  },
  get supabaseClient() {
    return getSupabaseClient();
  },
};

