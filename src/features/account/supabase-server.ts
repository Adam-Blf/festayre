/**
 * supabase-server.ts, client Supabase cote serveur (routes API).
 *
 * Lit la session utilisateur depuis les cookies de la requete :
 * c'est ce qui permet aux routes API (ex : creation d'une session de
 * paiement Stripe) de verifier QUI demande, sans jamais faire
 * confiance a un identifiant envoye par le client.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Client lie a la session du visiteur (droits limites par RLS). */
export async function getSupabaseServer(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // Les routes API ne rafraichissent pas les cookies de session,
      // on fournit un setAll inoffensif pour satisfaire l'interface.
      setAll: () => {},
    },
  });
}
