"use client";

/**
 * FeriaCard.tsx, carte de selection d'une feria sur l'accueil.
 * Affiche le statut temporel (en cours / a venir / terminee),
 * les dates et l'ambiance. Animation d'apparition framer-motion.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { type Feria, feriaStatus, daysUntil, formatDates } from "./data";

type Props = {
  feria: Feria;
  /** Index dans la grille, sert a decaler l'animation d'entree. */
  index: number;
};

export default function FeriaCard({ feria, index }: Props) {
  const status = feriaStatus(feria);
  const days = daysUntil(feria);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      whileTap={{ scale: 0.97 }}
    >
      <Link
        href={`/feria/${feria.id}`}
        className={`block rounded-2xl border bg-card p-4 transition-colors ${
          status === "live"
            ? "border-festa-red shadow-lg shadow-festa-red/10"
            : "border-card-border hover:border-festa-red/50"
        } ${status === "past" ? "opacity-55" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="display text-xl font-extrabold">{feria.name}</h3>
          {/* Badge de statut : le "EN CE MOMENT" pulse en rouge. */}
          {status === "live" && (
            <span className="live-pulse shrink-0 rounded-full bg-festa-red px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              En ce moment
            </span>
          )}
          {status === "upcoming" && (
            <span className="shrink-0 rounded-full bg-festa-green/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-festa-green">
              J-{days}
            </span>
          )}
          {status === "past" && (
            <span className="shrink-0 rounded-full bg-muted/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-muted">
              Terminee
            </span>
          )}
        </div>

        <p className="mt-1 text-sm font-semibold text-festa-red">
          {feria.city} <span className="text-muted font-normal">({feria.area})</span>
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {formatDates(feria)}
          {/* Honnetete metier : on signale les dates non officialisees. */}
          {!feria.datesConfirmed && " (a confirmer)"}
        </p>
        <p className="mt-2 text-sm leading-snug">{feria.vibe}</p>
      </Link>
    </motion.div>
  );
}
