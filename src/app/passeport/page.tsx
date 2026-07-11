/**
 * /passeport, tampons de ferias, badges et defis photos.
 */
import Link from "next/link";
import type { Metadata } from "next";
import PassportPanel from "@/features/passport/PassportPanel";

export const metadata: Metadata = {
  title: "Passeport férias | Festayre",
};

export default function PasseportPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10">
      <header className="flex items-center gap-3 py-6">
        <Link href="/" aria-label="Retour" className="-ml-2 flex h-11 w-11 items-center justify-center text-2xl font-bold">
          {"<"}
        </Link>
        <div>
          <h1 className="display text-3xl text-festa-red">Passeport</h1>
          <p className="text-xs text-muted">Un tampon par féria, gagné sur place.</p>
        </div>
      </header>
      <PassportPanel />
    </main>
  );
}
