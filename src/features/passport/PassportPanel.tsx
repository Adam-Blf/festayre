"use client";

/**
 * PassportPanel.tsx, le passeport du festayre.
 *
 * Gamification honnete :
 *  - un TAMPON par feria, obtenu par check-in geolocalise : il faut
 *    etre a moins de 3 km du coeur de la feria PENDANT ses dates
 *    (pas de tampon depuis le canape),
 *  - des BADGES par paliers de ferias tamponnees,
 *  - des DEFIS photos a cocher, pour animer le groupe.
 *
 * Tout vit en localStorage. La sync multi-appareils est une evolution
 * naturelle Festayre+ (table Supabase deja possible via favorites).
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FERIAS, feriaStatus } from "@/features/ferias/data";
import { haversineMeters } from "@/lib/geo";

const STAMPS_KEY = "festayre.passport.stamps.v1";
const CHALLENGES_KEY = "festayre.passport.challenges.v1";

/** Rayon de validite du check-in : le perimetre festif, large. */
const CHECKIN_RADIUS_M = 3000;

/** Paliers de badges, du bizuth au veteran. */
const BADGES = [
  { count: 1, label: "Bizuth", desc: "Première féria tamponnée" },
  { count: 3, label: "Festayre", desc: "3 férias au compteur" },
  { count: 5, label: "Vétéran", desc: "5 férias, le foulard est tatoué" },
];

/** Defis photos du groupe, volontairement faisables et bon enfant. */
const CHALLENGES = [
  "Photo du groupe en blanc et rouge au complet",
  "Selfie avec une banda en fond",
  "La plus belle table de bodega",
  "Photo du feu d'artifice ratée (bougé obligatoire)",
  "Le lever de soleil du retour",
];

export default function PassportPanel() {
  const [stamps, setStamps] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      setStamps(JSON.parse(localStorage.getItem(STAMPS_KEY) ?? "{}"));
      setChecked(JSON.parse(localStorage.getItem(CHALLENGES_KEY) ?? "{}"));
    } catch {
      // Stockage corrompu : passeport vierge.
    }
  }, []);

  /** Check-in : verifie dates + distance avant de tamponner. */
  const checkIn = (feriaId: string) => {
    const feria = FERIAS.find((f) => f.id === feriaId);
    if (!feria) return;

    if (feriaStatus(feria) !== "live") {
      setStatus("Cette féria n'est pas en cours, pas de tampon d'avance.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = haversineMeters(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          feria.center
        );
        if (d > CHECKIN_RADIUS_M) {
          setStatus(`Trop loin du coeur de la fête (${Math.round(d / 100) / 10} km). Le tampon se mérite.`);
          return;
        }
        const next = { ...stamps, [feriaId]: new Date().toISOString().slice(0, 10) };
        setStamps(next);
        localStorage.setItem(STAMPS_KEY, JSON.stringify(next));
        setStatus(`Tampon ${feria.name} validé. Bonne fête.`);
      },
      () => setStatus("GPS requis pour tamponner (préviens pas le canapé).")
    );
  };

  const toggleChallenge = (label: string) => {
    const next = { ...checked, [label]: !checked[label] };
    setChecked(next);
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(next));
  };

  const stampCount = Object.keys(stamps).length;

  return (
    <div className="space-y-5">
      {status && (
        <p role="status" className="rounded-lg bg-festa-navy/5 p-3 text-center text-xs">
          {status}
        </p>
      )}

      {/* Badges. */}
      <section className="flex gap-2">
        {BADGES.map((b) => {
          const earned = stampCount >= b.count;
          return (
            <div
              key={b.label}
              className={`flex-1 rounded-xl border p-3 text-center ${
                earned
                  ? "border-festa-red bg-festa-red/5"
                  : "border-card-border bg-card opacity-60"
              }`}
            >
              <p className={`display text-base ${earned ? "text-festa-red" : "text-muted"}`}>
                {b.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-muted">{b.desc}</p>
            </div>
          );
        })}
      </section>

      {/* Tampons par feria. */}
      <section className="rounded-xl border border-card-border bg-card p-4">
        <h2 className="display text-lg text-festa-red">
          Tampons, {stampCount}/{FERIAS.length}
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {FERIAS.map((feria) => {
            const date = stamps[feria.id];
            const live = feriaStatus(feria) === "live";
            return (
              <li key={feria.id}>
                {date ? (
                  <motion.div
                    initial={{ scale: 1.3, rotate: -10, opacity: 0 }}
                    animate={{ scale: 1, rotate: -4, opacity: 1 }}
                    className="stamp w-full text-festa-red"
                  >
                    {feria.city} {date.slice(5).split("-").reverse().join("/")}
                  </motion.div>
                ) : (
                  <button
                    onClick={() => checkIn(feria.id)}
                    disabled={!live}
                    className={`w-full rounded-lg border border-dashed border-card-border py-2 text-xs font-semibold ${
                      live ? "text-festa-navy" : "text-muted opacity-50"
                    }`}
                  >
                    {live ? `Tamponner ${feria.city}` : feria.city}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11px] text-muted">
          Tampon possible uniquement sur place, pendant la féria (GPS).
        </p>
      </section>

      {/* Defis photos. */}
      <section className="rounded-xl border border-card-border bg-card p-4">
        <h2 className="display text-lg text-festa-red">Défis photos</h2>
        <ul className="mt-2 space-y-2">
          {CHALLENGES.map((label) => (
            <li key={label}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(checked[label])}
                  onChange={() => toggleChallenge(label)}
                  className="h-5 w-5 accent-[#b80c1d]"
                />
                <span className={checked[label] ? "line-through opacity-60" : ""}>
                  {label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
