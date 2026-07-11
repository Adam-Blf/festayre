/**
 * POST /api/checkout, creation d'une session de paiement Stripe pour
 * le pack "Festayre+" (paiement unique de soutien qui debloque la
 * synchronisation des favoris et le badge supporter).
 *
 * Securite :
 *  - la cle secrete Stripe ne quitte jamais le serveur,
 *  - le prix est defini par un Price ID cote env, le client ne peut
 *    PAS envoyer un montant (pas de "prix libre a 0,01 EUR"),
 *  - l'utilisateur doit etre connecte : l'identite vient de la session
 *    Supabase (cookie httpOnly), pas du corps de la requete,
 *  - si Stripe ou Supabase ne sont pas configures, on repond 503
 *    proprement au lieu de crasher.
 */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServer } from "@/features/account/supabase-server";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_FESTAYRE_PLUS;
  if (!secretKey || !priceId) {
    return NextResponse.json(
      { error: "Paiement non configure sur ce deploiement." },
      { status: 503 }
    );
  }

  // 1. Authentification : on refuse les anonymes.
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Comptes non configures." }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  // 2. Creation de la session Checkout hebergee par Stripe :
  //    aucune donnee carte ne transite par notre serveur (conformite PCI
  //    deleguee a Stripe).
  const stripe = new Stripe(secretKey);
  const origin = new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    // client_reference_id fait le lien paiement <-> compte dans le webhook.
    client_reference_id: user.id,
    customer_email: user.email ?? undefined,
    success_url: `${origin}/compte?paiement=ok`,
    cancel_url: `${origin}/compte?paiement=annule`,
  });

  return NextResponse.json({ url: session.url });
}
