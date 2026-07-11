/**
 * /sam, le mode designe sobre : groupe, partage de position, alerte.
 */
import Link from "next/link";
import type { Metadata } from "next";
import SamPanel from "@/features/sam/SamPanel";

export const metadata: Metadata = {
  title: "Mode SAM | Festayre",
};

export default function SamPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10">
      <header className="flex items-center gap-3 py-6">
        <Link href="/" aria-label="Retour" className="-ml-2 flex h-11 w-11 items-center justify-center text-2xl font-bold">
          {"<"}
        </Link>
        <div>
          <h1 className="display text-3xl text-festa-red">Mode SAM</h1>
          <p className="text-xs text-muted">
            Celui qui ramène tout le monde. Respect éternel.
          </p>
        </div>
      </header>
      <SamPanel />
    </main>
  );
}
