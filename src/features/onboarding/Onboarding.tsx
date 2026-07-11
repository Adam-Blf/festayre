"use client";

/**
 * Onboarding.tsx, le parcours d'accueil premiere ouverture.
 *
 * Standard App Store : 3 ecrans max, un geste par ecran, la creation
 * de compte proposee (magic link, zero mot de passe) mais JAMAIS
 * imposee, "Continuer sans compte" est toujours visible. Le flag
 * localStorage evite de le remontrer.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/features/account/supabase";

export const ONBOARDING_KEY = "festayre.onboarded.v1";

/** Contenu des deux premiers ecrans (le 3e est le compte). */
const SLIDES = [
  {
    title: "Les férias, directement dans votre poche",
    text: "Bayonne, Dax, Mont-de-Marsan et toutes les férias du Sud-Ouest. Programme, météo, bracelets, navettes.",
  },
  {
    title: "Survivre à la nuit",
    text: "Toilettes les plus proches, alcool au prix supermarché, point de RDV du groupe, mode SAM avec alerte. Tout marche même sans réseau.",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const supabase = getSupabaseBrowser();
  const lastStep = 2;

  /** Fin du parcours : on marque le flag et on entre dans l'app. */
  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    router.replace("/");
  };

  /**
   * Creation de compte email + mot de passe depuis l'onboarding.
   * Confirmation auto activee cote Supabase : la session demarre
   * immediatement, on entre direct dans l'app.
   */
  const signUp = async () => {
    if (!supabase || !email.includes("@") || password.length < 8) return;
    setBusy(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (err) {
      setError("Inscription impossible (email déjà utilisé ?). Tu peux te connecter depuis Mon compte.");
    } else {
      finish();
    }
  };

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-8 pt-6">
      {/* Passer : toujours accessible, jamais de tunnel force. */}
      <div className="flex justify-end">
        <button onClick={finish} className="min-h-11 px-2 text-sm font-semibold text-muted">
          Passer
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-1 flex-col items-center justify-center text-center"
        >
          {step < lastStep ? (
            <>
              {/* Le lockup officiel porte l'ecran 1, le mark seul l'ecran 2. */}
              <Image
                src={step === 0 ? "/logo-lockup.png" : "/logo.png"}
                alt="Festayre"
                width={step === 0 ? 260 : 140}
                height={step === 0 ? 175 : 158}
                priority
              />
              <h1 className="display mt-8 max-w-xs text-3xl text-festa-navy">
                {SLIDES[step].title}
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                {SLIDES[step].text}
              </p>
            </>
          ) : (
            <>
              <Image src="/logo.png" alt="Festayre" width={120} height={135} priority />
              <h1 className="display mt-6 text-3xl text-festa-navy">Ton compte</h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                Email + mot de passe, 10 secondes. Il débloque la communauté
                (rencontres, messagerie, covoiturage) et Festayre+.
              </p>

              {isSupabaseConfigured() ? (
                <div className="mt-6 w-full max-w-sm space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.fr"
                    autoComplete="email"
                    className="min-h-12 w-full rounded-xl border border-card-border bg-card px-4 text-base"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && signUp()}
                    placeholder="Mot de passe (8 caractères min)"
                    autoComplete="new-password"
                    className="min-h-12 w-full rounded-xl border border-card-border bg-card px-4 text-base"
                  />
                  <button
                    onClick={signUp}
                    disabled={busy || !email.includes("@") || password.length < 8}
                    className="min-h-12 w-full rounded-xl bg-festa-red text-sm font-bold text-white disabled:opacity-50"
                  >
                    {busy ? "Création..." : "Créer mon compte"}
                  </button>
                  {error && <p className="text-xs text-festa-red">{error}</p>}
                </div>
              ) : (
                <p className="mt-6 text-sm text-muted">
                  Les comptes arrivent bientôt sur ce déploiement.
                </p>
              )}

              <button onClick={finish} className="mt-4 min-h-11 text-sm font-semibold text-muted underline">
                Continuer sans compte
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Points d'etape + action principale. */}
      <div className="space-y-5">
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-festa-red" : "w-2 bg-card-border"
              }`}
            />
          ))}
        </div>
        {step < lastStep && (
          <button
            onClick={() => setStep(step + 1)}
            className="min-h-12 w-full rounded-xl bg-festa-red text-sm font-bold text-white"
          >
            Continuer
          </button>
        )}

      </div>
    </div>
  );
}
