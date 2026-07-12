/**
 * /groupe, position live du groupe (creer / rejoindre par code).
 */
import Link from "next/link";
import type { Metadata } from "next";
import GroupPanel from "@/features/group/GroupPanel";

export const metadata: Metadata = {
  title: "Mon groupe | Festayre",
};

export default function GroupePage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10">
      <header className="flex items-center gap-3 py-6">
        <Link href="/" aria-label="Retour" className="-ml-2 flex h-11 w-11 items-center justify-center text-2xl font-bold">
          {"<"}
        </Link>
        <div>
          <h1 className="display text-3xl text-festa-red">Mon groupe</h1>
          <p className="text-xs text-muted">
            Un code, et plus personne ne se perd dans la foule.
          </p>
        </div>
      </header>
      <GroupPanel />
    </main>
  );
}
