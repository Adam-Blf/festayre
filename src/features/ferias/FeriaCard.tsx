"use client";

/**
 * FeriaCard.tsx, une feria = un billet d'entree.
 *
 * Anatomie du billet : a gauche la souche (jours + mois, gros chiffres
 * tabulaires), une perforation en pointilles, puis le corps (nom,
 * ville, ambiance) et le tampon de statut pose de travers comme un
 * coup d'encre : EN CE MOMENT / J-x / TERMINEE.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { type Feria, feriaStatus, daysUntil, formatDates } from "./data";

/** Mois court en capitales pour la souche du billet ("JUIL"). */
const MONTHS = ["JANV", "FEVR", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOUT", "SEPT", "OCT", "NOV", "DEC"];

type Props = {
  feria: Feria;
  /** Index dans la liste, sert a decaler l'animation d'entree. */
  index: number;
};

export default function FeriaCard({ feria, index }: Props) {
  const status = feriaStatus(feria);
  const days = daysUntil(feria);

  // Souche : "15-19" + "JUIL" (jours de debut et fin, mois de debut).
  const start = new Date(`${feria.start}T12:00:00`);
  const end = new Date(`${feria.end}T12:00:00`);
  const stubDays = `${start.getDate()}-${end.getDate()}`;
  const stubMonth = MONTHS[start.getMonth()];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={`/feria/${feria.id}`}
        className={`relative flex overflow-hidden rounded-xl border bg-card transition-colors ${
          status === "live"
            ? "border-festa-red shadow-lg shadow-festa-red/15"
            : "border-card-border hover:border-festa-red/50"
        } ${status === "past" ? "opacity-55" : ""}`}
      >
        {/* Souche du billet : les dates en gros. */}
        <div
          className={`flex w-20 shrink-0 flex-col items-center justify-center py-4 ${
            status === "live" ? "bg-festa-red text-white" : "bg-festa-navy/5 text-festa-navy"
          }`}
        >
          <span className="display text-2xl tabular-nums">{stubDays}</span>
          <span className="text-[11px] font-bold tracking-widest">{stubMonth}</span>
        </div>

        {/* Corps du billet. */}
        <div className="ticket-perf min-w-0 flex-1 px-4 py-3">
          <h3 className="display pr-20 text-xl">{feria.name}</h3>
          <p className="mt-0.5 text-sm font-semibold text-festa-red">
            {feria.city} <span className="font-normal text-muted">({feria.area})</span>
          </p>
          <p className="mt-1 text-sm leading-snug text-muted">{feria.vibe}</p>
          <p className="mt-1 text-xs text-muted">
            {formatDates(feria)}
            {/* Honnetete metier : dates non officialisees signalees. */}
            {!feria.datesConfirmed && " (à confirmer)"}
          </p>
        </div>

        {/* Tampon de statut, pose de travers. */}
        <div className="pointer-events-none absolute right-3 top-3">
          {status === "live" && (
            <span className="stamp live-pulse bg-festa-red/5 text-festa-red">
              En ce moment
            </span>
          )}
          {status === "upcoming" && (
            <span className="stamp text-festa-green">J-{days}</span>
          )}
          {status === "past" && <span className="stamp text-muted">Terminée</span>}
        </div>
      </Link>
    </motion.div>
  );
}
