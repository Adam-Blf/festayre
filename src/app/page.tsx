"use client";

/**
 * page.tsx (accueil), la porte d'entree de Festayre.
 *
 * Metier : choisir sa feria en 2 secondes. Les ferias en cours
 * remontent en tete, puis les prochaines par date, puis les passees.
 * Design : un haut de page facon affiche de feria (typo Anton
 * empilee navy/rouge, logo pin au foulard), puis la liste des
 * billets d'entree.
 */
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ONBOARDING_KEY } from "@/features/onboarding/Onboarding";
import { motion } from "framer-motion";
import { FERIAS, feriaStatus } from "@/features/ferias/data";
import FeriaCard from "@/features/ferias/FeriaCard";
import { APP_VERSION } from "@/lib/version";

export default function HomePage() {
  const router = useRouter();

  // Premiere ouverture : on passe par l'onboarding (standard app
  // mobile). Le flag localStorage evite la boucle.
  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) router.replace("/bienvenue");
  }, [router]);

  // Tri metier : live > a venir (chronologique) > passees.
  const rank = { live: 0, upcoming: 1, past: 2 } as const;
  const sorted = [...FERIAS].sort((a, b) => {
    const diff = rank[feriaStatus(a)] - rank[feriaStatus(b)];
    return diff !== 0 ? diff : a.start.localeCompare(b.start);
  });

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10">
      {/* Affiche : logo + titre empile comme un poster de feria. */}
      <header className="pb-7 pt-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-end justify-between gap-4"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
              Sud-Ouest, été 2026
            </p>
            <h1 className="display mt-2 text-5xl leading-[0.92]">
              <span className="block text-festa-navy">Les férias,</span>
              <span className="block text-festa-red">directement</span>
              <span className="block text-festa-navy">dans votre poche.</span>
            </h1>
          </div>
          <Image
            src="/logo.png"
            alt="Logo Festayre, pin de localisation au foulard rouge"
            width={88}
            height={99}
            priority
            className="mb-1 shrink-0"
          />
        </motion.div>
        <p className="mt-3 text-sm text-muted">
          Toilettes les plus proches, alcool le moins cher, bus, bracelets,
          programme et météo. Choisis ta féria.
        </p>
      </header>

      {/* Les billets. */}
      <section aria-label="Choisir une féria" className="grid gap-3">
        {sorted.map((feria, i) => (
          <FeriaCard key={feria.id} feria={feria} index={i} />
        ))}
      </section>

      {/* Acces aux outils du festayre. */}
      <nav className="mt-8 grid grid-cols-2 gap-3">
        <Link
          href="/sam"
          className="rounded-xl border border-card-border bg-card p-4 text-center text-sm font-bold hover:border-festa-red/50"
        >
          Mode SAM
          <span className="block text-xs font-normal text-muted">
            Groupe, position, alerte
          </span>
        </Link>
        <Link
          href="/passeport"
          className="rounded-xl border border-card-border bg-card p-4 text-center text-sm font-bold hover:border-festa-red/50"
        >
          Passeport
          <span className="block text-xs font-normal text-muted">
            Tampons, badges, défis
          </span>
        </Link>
        <Link
          href="/communaute"
          className="rounded-xl border border-card-border bg-card p-4 text-center text-sm font-bold hover:border-festa-red/50"
        >
          Communauté
          <span className="block text-xs font-normal text-muted">
            Rencontres, fil, covoit
          </span>
        </Link>
        <Link
          href="/checklist"
          className="rounded-xl border border-card-border bg-card p-4 text-center text-sm font-bold hover:border-festa-red/50"
        >
          Checklist
          <span className="block text-xs font-normal text-muted">
            À cocher avant de partir
          </span>
        </Link>
        <Link
          href="/compte"
          className="rounded-xl border border-card-border bg-card p-4 text-center text-sm font-bold hover:border-festa-red/50"
        >
          Mon compte
          <span className="block text-xs font-normal text-muted">
            Festayre+ et favoris
          </span>
        </Link>
        <Link
          href="/carte"
          className="rounded-xl border border-card-border bg-card p-4 text-center text-sm font-bold hover:border-festa-red/50"
        >
          Ma carte QR
          <span className="block text-xs font-normal text-muted">
            Instagram en un scan
          </span>
        </Link>
      </nav>

      <footer className="mt-10 text-center text-xs text-muted">
        Festayre v{APP_VERSION}. Données OpenStreetMap, météo Open-Meteo.
        Bois de l&apos;eau entre deux verres.
      </footer>
    </main>
  );
}
