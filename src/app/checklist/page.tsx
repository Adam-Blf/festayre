/**
 * /checklist, la page checklist de survie feria.
 */
import Link from "next/link";
import type { Metadata } from "next";
import ChecklistPanel from "@/features/checklist/ChecklistPanel";

export const metadata: Metadata = {
  title: "Checklist feria | Festayre",
};

export default function ChecklistPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10">
      <header className="flex items-center gap-3 py-6">
        <Link href="/" aria-label="Retour" className="-ml-2 flex h-11 w-11 items-center justify-center text-2xl font-bold">
          {"<"}
        </Link>
        <div>
          <h1 className="display text-3xl font-extrabold text-festa-red">Checklist</h1>
          <p className="text-xs text-muted">Le kit de survie, à cocher avant de partir.</p>
        </div>
      </header>
      <ChecklistPanel />
    </main>
  );
}
