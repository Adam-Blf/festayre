"use client";

/**
 * page.tsx (accueil), la porte d'entree de Festayre.
 * Metier : choisir sa feria en 2 secondes. Les ferias en cours
 * remontent en tete, puis les prochaines par date, puis les passees.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { FERIAS, feriaStatus } from "@/features/ferias/data";
import FeriaCard from "@/features/ferias/FeriaCard";
import { APP_VERSION } from "@/lib/version";

export default function HomePage() {
  // Tri metier : live > a venir (chronologique) > passees.
  const rank = { live: 0, upcoming: 1, past: 2 } as const;
  const sorted = [...FERIAS].sort((a, b) => {
    const diff = rank[feriaStatus(a)] - rank[feriaStatus(b)];
    return diff !== 0 ? diff : a.start.localeCompare(b.start);
  });

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10">
      {/* Entete affiche de feria. */}
      <header className="pb-6 pt-10 text-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="display text-6xl font-extrabold text-festa-red"
        >
          Festayre
        </motion.h1>
        {/* Brand line officielle. */}
        <p className="display mt-1 text-lg font-bold">
          Les ferias, directement dans votre poche.
        </p>
        <p className="mt-2 text-sm font-medium text-muted">
          Toilettes les plus proches, alcool le moins cher, bus, bracelets,
          programme et meteo de toutes les ferias du Sud-Ouest.
        </p>
      </header>

      {/* Grille des ferias. */}
      <section aria-label="Choisir une feria" className="grid gap-3">
        {sorted.map((feria, i) => (
          <FeriaCard key={feria.id} feria={feria} index={i} />
        ))}
      </section>

      {/* Acces checklist + compte + carte QR Insta. */}
      <nav className="mt-8 grid grid-cols-2 gap-3">
        <Link
          href="/checklist"
          className="col-span-2 rounded-2xl border border-card-border bg-card p-4 text-center text-sm font-bold hover:border-festa-red/50"
        >
          Checklist de survie
          <span className="block text-xs font-normal text-muted">
            A cocher avant de partir en feria
          </span>
        </Link>
        <Link
          href="/compte"
          className="rounded-2xl border border-card-border bg-card p-4 text-center text-sm font-bold hover:border-festa-red/50"
        >
          Mon compte
          <span className="block text-xs font-normal text-muted">
            Festayre+ et favoris
          </span>
        </Link>
        <Link
          href="/carte"
          className="rounded-2xl border border-card-border bg-card p-4 text-center text-sm font-bold hover:border-festa-red/50"
        >
          Ma carte QR
          <span className="block text-xs font-normal text-muted">
            Instagram en un scan
          </span>
        </Link>
      </nav>

      <footer className="mt-10 text-center text-xs text-muted">
        Festayre v{APP_VERSION}. Donnees cartographiques OpenStreetMap,
        meteo Open-Meteo. Bois de l&apos;eau entre deux verres.
      </footer>
    </main>
  );
}
