/**
 * /reglages, l'ecran reglages et a-propos.
 * Coquille serveur, actions locales dans le composant client.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { APP_VERSION } from "@/lib/version";
import SettingsPanel from "@/features/settings/SettingsPanel";

export const metadata: Metadata = {
  title: "Réglages | Festayre",
};

export default function ReglagesPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10">
      <header className="flex items-center gap-3 py-6">
        <Link href="/" aria-label="Retour" className="-ml-2 flex h-11 w-11 items-center justify-center text-2xl font-bold">
          {"<"}
        </Link>
        <h1 className="display text-3xl text-festa-red">Réglages</h1>
      </header>

      <SettingsPanel />

      {/* A propos + liens legaux : obligatoires avec comptes + paiement. */}
      <section className="mt-4 rounded-xl border border-card-border bg-card p-4 text-sm">
        <h2 className="display text-lg text-festa-red">À propos</h2>
        <p className="mt-1 text-muted">
          Festayre v{APP_VERSION}. Les férias, directement dans votre poche.
        </p>
        <ul className="mt-3 space-y-2 font-semibold">
          <li>
            <Link href="/confidentialite" className="flex min-h-11 items-center underline">
              Politique de confidentialité
            </Link>
          </li>
          <li>
            <Link href="/mentions" className="flex min-h-11 items-center underline">
              Mentions légales
            </Link>
          </li>
          <li>
            <a
              href="https://github.com/Adam-Blf/festayre"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center underline"
            >
              Code source (MIT)
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
