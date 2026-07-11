/**
 * supabase.ts, clients Supabase (auth + base de donnees).
 *
 * Securite / degradation gracieuse :
 *  - les cles vivent UNIQUEMENT dans les variables d'environnement,
 *  - si elles sont absentes (par ex. clone du repo sans .env), l'app
 *    tourne en "mode invite" : carte, toilettes et programme marchent,
 *    seuls le compte et Festayre+ sont desactives,
 *  - la cle service_role n'apparait JAMAIS ici (cote client) : elle
 *    n'est utilisee que dans le webhook Stripe, cote serveur.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** true si le projet Supabase est configure (mode compte actif). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let browserClient: SupabaseClient | null = null;

/**
 * Client Supabase navigateur (singleton).
 * La cle "anon" est publique par design : la securite des donnees
 * repose sur les policies RLS (voir supabase/migrations), pas sur
 * le secret de cette cle.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
