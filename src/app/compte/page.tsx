/**
 * /compte, page compte et Festayre+.
 * Coquille serveur minimale, toute la logique vit dans AccountPanel.
 */
import Link from "next/link";
import type { Metadata } from "next";
import AccountPanel from "@/features/account/AccountPanel";

export const metadata: Metadata = {
  title: "Mon compte | Festayre",
};

export default function ComptePage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10">
      <header className="flex items-center gap-3 py-6">
        <Link href="/" aria-label="Retour" className="-ml-2 flex h-11 w-11 items-center justify-center text-2xl font-bold">
          {"<"}
        </Link>
        <h1 className="display text-3xl font-extrabold text-festa-red">Mon compte</h1>
      </header>
      <AccountPanel />
    </main>
  );
}
