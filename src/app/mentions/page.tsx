/**
 * /mentions, mentions legales minimales d'un service edite par un
 * particulier.
 */
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales | Festayre",
};

export default function MentionsPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-12">
      <header className="flex items-center gap-3 py-6">
        <Link href="/reglages" aria-label="Retour" className="-ml-2 flex h-11 w-11 items-center justify-center text-2xl font-bold">
          {"<"}
        </Link>
        <h1 className="display text-3xl text-festa-red">Mentions légales</h1>
      </header>

      <div className="space-y-5 text-sm leading-relaxed text-muted">
        <p>
          <strong className="text-foreground">Éditeur :</strong> Adam Beloucif,
          contact : adam@beloucif.com.
        </p>
        <p>
          <strong className="text-foreground">Hébergement :</strong> Vercel Inc.
          (application), Supabase (données, région UE Paris), Stripe
          (paiements).
        </p>
        <p>
          <strong className="text-foreground">Données cartographiques :</strong>{" "}
          contributeurs OpenStreetMap (licence ODbL). Météo : Open-Meteo.
        </p>
        <p>
          <strong className="text-foreground">Responsabilité :</strong> les
          programmes des férias sont indicatifs, seuls les sites officiels
          font foi. Festayre encourage une consommation responsable :
          l&apos;abus d&apos;alcool est dangereux pour la santé. La communauté est
          réservée aux majeurs.
        </p>
        <p>
          <strong className="text-foreground">Code source :</strong> licence
          MIT, github.com/Adam-Blf/festayre.
        </p>
      </div>
    </main>
  );
}
