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
  const [password, setPassword] = useState("");
  const [signupMode, setSignupMode] = useState(false);
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

  /**
   * Connexion / inscription par email + mot de passe.
   * L'inscription connecte directement (confirmation auto activee) :
   * pas d'aller-retour email en pleine feria.
   */
  const submitAuth = useCallback(async () => {
    if (!supabase || !email || password.length < 8) return;
    setBusy(true);
    const { error } = signupMode
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage(
        signupMode
          ? "Inscription impossible (email déjà utilisé ou mot de passe trop court)."
          : "Identifiants incorrects."
      );
    }
  }, [supabase, email, password, signupMode]);

  /** Mot de passe oublié : lien de réinitialisation par email. */
  const resetPassword = useCallback(async () => {
    if (!supabase || !email.includes("@")) {
      setMessage("Renseigne ton email d'abord.");
      return;
    }
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/compte",
    });
    setMessage("Email de réinitialisation envoyé.");
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

  // Etat 2 : connexion ou inscription par email + mot de passe.
  if (!user) {
    return (
      <div className="rounded-xl border border-card-border bg-card p-4">
        {/* Bascule connexion / inscription. */}
        <div className="flex rounded-lg border border-card-border text-sm font-bold">
          <button
            onClick={() => setSignupMode(false)}
            className={`min-h-11 flex-1 rounded-lg ${!signupMode ? "bg-festa-red text-white" : "text-muted"}`}
          >
            Connexion
          </button>
          <button
            onClick={() => setSignupMode(true)}
            className={`min-h-11 flex-1 rounded-lg ${signupMode ? "bg-festa-red text-white" : "text-muted"}`}
          >
            Inscription
          </button>
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.fr"
          autoComplete="email"
          className="mt-3 w-full rounded-lg border border-card-border bg-background px-3 py-3 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitAuth()}
          placeholder="Mot de passe (8 caractères min)"
          autoComplete={signupMode ? "new-password" : "current-password"}
          className="mt-2 w-full rounded-lg border border-card-border bg-background px-3 py-3 text-sm"
        />
        <button
          onClick={submitAuth}
          disabled={busy || !email.includes("@") || password.length < 8}
          className="mt-2 w-full rounded-lg bg-festa-red py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "..." : signupMode ? "Créer mon compte" : "Me connecter"}
        </button>
        {!signupMode && (
          <button onClick={resetPassword} className="mt-2 w-full text-xs text-muted underline">
            Mot de passe oublié
          </button>
        )}
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
