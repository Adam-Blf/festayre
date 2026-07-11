/**
 * /communaute, rencontres par feria, fil de bons plans, covoiturage.
 */
import Link from "next/link";
import type { Metadata } from "next";
import CommunityPanel from "@/features/community/CommunityPanel";

export const metadata: Metadata = {
  title: "Communauté | Festayre",
};

export default function CommunautePage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10">
      <header className="flex items-center gap-3 py-6">
        <Link href="/" aria-label="Retour" className="-ml-2 flex h-11 w-11 items-center justify-center text-2xl font-bold">
          {"<"}
        </Link>
        <div>
          <h1 className="display text-3xl text-festa-red">Communauté</h1>
          <p className="text-xs text-muted">
            Rencontres, bons plans et covoiturage, féria par féria.
          </p>
        </div>
      </header>
      <CommunityPanel />
    </main>
  );
}
