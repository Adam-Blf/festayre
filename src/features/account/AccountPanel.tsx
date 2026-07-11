"use client";

/**
 * AccountPanel.tsx, gestion du compte et de Festayre+.
 *
 * Trois etats possibles :
 *  1. Supabase non configure : message clair, l'app reste utilisable,
 *  2. Visiteur non connecte : connexion par lien magique email
 *     (pas de mot de passe = rien a retenir, rien a fuiter),
 *  3. Connecte : statut Festayre+ (lu dans purchases via RLS) et
 *     bouton d'achat via Stripe Checkout.
 */
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser, isSupabaseConfigured } from "./supabase";
import type { User } from "@supabase/supabase-js";

export default function AccountPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [isPlus, setIsPlus] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const supabase = getSupabaseBrowser();

  // Suivi de session : Supabase gere le retour du lien magique tout seul.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Statut Festayre+ : la RLS garantit qu'on ne lit que SES achats.
  useEffect(() => {
    if (!supabase || !user) {
      setIsPlus(false);
      return;
    }
    supabase
      .from("purchases")
      .select("id")
      .eq("product", "festayre_plus")
      .limit(1)
      .then(({ data }) => setIsPlus(Boolean(data?.length)));
  }, [supabase, user]);

  /** Envoi du lien magique de connexion. */
  const signIn = useCallback(async () => {
    if (!supabase || !email) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/compte" },
    });
    setBusy(false);
    setMessage(
      error
        ? "Envoi impossible, vérifie l'adresse email."
        : "Lien de connexion envoyé, vérifie ta boîte mail."
    );
  }, [supabase, email]);

  /** Lancement du paiement Stripe Checkout. */
  const buyPlus = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Page de paiement hebergee Stripe.
      } else {
        setMessage(data.error ?? "Paiement indisponible pour le moment.");
      }
    } catch {
      setMessage("Paiement indisponible pour le moment.");
    } finally {
      setBusy(false);
    }
  }, []);

  // Etat 1 : deploiement sans Supabase, on l'explique honnetement.
  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-xl border border-card-border bg-card p-4 text-sm text-muted">
        Les comptes ne sont pas activés sur ce déploiement. Toutes les
        fonctions de survie en féria restent 100 % utilisables sans compte.
      </p>
    );
  }

  // Etat 2 : connexion par lien magique.
  if (!user) {
    return (
      <div className="rounded-xl border border-card-border bg-card p-4">
        <h2 className="display text-lg font-extrabold">Connexion</h2>
        <p className="mt-1 text-sm text-muted">
          Un email, un lien, zéro mot de passe.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.fr"
          autoComplete="email"
          className="mt-3 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={signIn}
          disabled={busy || !email.includes("@")}
          className="mt-2 w-full rounded-lg bg-festa-red py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Envoi..." : "Recevoir mon lien de connexion"}
        </button>
        {message && <p className="mt-2 text-xs text-muted">{message}</p>}
      </div>
    );
  }

  // Etat 3 : connecte.
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-card-border bg-card p-4">
        <p className="text-sm">
          Connecté en tant que <strong>{user.email}</strong>
        </p>
        <button
          onClick={() => supabase?.auth.signOut()}
          className="mt-2 text-xs font-semibold text-muted underline"
        >
          Se déconnecter
        </button>
      </div>

      <div
        className={`rounded-xl border p-4 ${
          isPlus ? "border-festa-green bg-festa-green/5" : "border-card-border bg-card"
        }`}
      >
        <h2 className="display text-lg font-extrabold">
          Festayre+ {isPlus && <span className="text-festa-green">actif</span>}
        </h2>
        {isPlus ? (
          <p className="mt-1 text-sm">
            Merci pour le soutien. Favoris synchronisés et badge supporter
            activés.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">
              Paiement unique de soutien : favoris synchronisés entre
              appareils, badge supporter, et tu finances les serveurs.
            </p>
            <button
              onClick={buyPlus}
              disabled={busy}
              className="mt-3 w-full rounded-lg bg-festa-red py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "Redirection..." : "Passer Festayre+"}
            </button>
          </>
        )}
        {message && <p className="mt-2 text-xs text-muted">{message}</p>}
      </div>
    </div>
  );
}
