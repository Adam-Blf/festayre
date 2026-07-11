/**
 * POST /api/stripe/webhook, reception des evenements Stripe.
 *
 * C'est ICI (et seulement ici) qu'un compte devient "Festayre+" :
 * jamais sur la simple redirection success_url, qu'un utilisateur
 * pourrait ouvrir a la main sans avoir paye.
 *
 * Securite :
 *  - signature Stripe verifiee (constructEvent) : une requete forgee
 *    sans le secret webhook est rejetee en 400,
 *  - ecriture en base via la cle service_role, qui ne vit que dans
 *    l'environnement serveur (jamais exposee au navigateur),
 *  - route idempotente : upsert, un evenement rejoue ne cree pas de
 *    doublon.
 */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Webhook non configure." }, { status: 503 });
  }

  // 1. Verification de la signature sur le corps BRUT de la requete.
  const stripe = new Stripe(secretKey);
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", webhookSecret);
  } catch {
    // Signature invalide = tentative de fraude ou mauvaise config.
    // On ne log pas le detail cote client (pas de fuite d'info).
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  // 2. Seul l'evenement "paiement finalise" nous interesse.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;

    if (userId && session.payment_status === "paid") {
      // Client "admin" service_role : bypasse la RLS, reserve au serveur.
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });

      const { error } = await admin.from("purchases").upsert(
        {
          user_id: userId,
          product: "festayre_plus",
          stripe_session_id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
        },
        { onConflict: "stripe_session_id" }
      );
      if (error) {
        // 500 pour que Stripe retente automatiquement plus tard.
        return NextResponse.json({ error: "Ecriture en base echouee." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
