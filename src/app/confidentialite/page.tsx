/**
 * /confidentialite, politique de confidentialite.
 * Honnete et lisible : on liste EXACTEMENT ce qu'on collecte, ou ca
 * vit, et comment tout supprimer. Pas de juridique decoratif.
 */
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confidentialité | Festayre",
};

export default function ConfidentialitePage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-12">
      <header className="flex items-center gap-3 py-6">
        <Link href="/reglages" aria-label="Retour" className="-ml-2 flex h-11 w-11 items-center justify-center text-2xl font-bold">
          {"<"}
        </Link>
        <h1 className="display text-3xl text-festa-red">Confidentialité</h1>
      </header>

      <div className="space-y-5 text-sm leading-relaxed">
        <section>
          <h2 className="display text-lg text-festa-navy">Sur ton téléphone uniquement</h2>
          <p className="mt-1 text-muted">
            Position GPS (jamais envoyée à nos serveurs, elle sert aux
            calculs de distance en local), checklist, point de RDV,
            contacts du mode SAM, tampons du passeport, préférences.
            Effaçables dans <Link href="/reglages" className="underline">Réglages</Link>.
          </p>
        </section>

        <section>
          <h2 className="display text-lg text-festa-navy">Avec un compte</h2>
          <p className="mt-1 text-muted">
            Email et mot de passe (hachés par Supabase, hébergement Union
            européenne, région Paris). Si tu crées un profil communauté :
            prénom, nom, ville, date de naissance (contrôle majorité),
            genre et recherche (optionnels), bio, pseudo Instagram, photo
            de profil. Le pseudo Instagram n&apos;est visible qu&apos;en cas de
            match mutuel. Les messages internes ne sont lisibles que par
            les deux personnes du match.
          </p>
        </section>

        <section>
          <h2 className="display text-lg text-festa-navy">Paiement</h2>
          <p className="mt-1 text-muted">
            Le paiement Festayre+ est traité par Stripe. Aucune donnée de
            carte ne transite par nos serveurs. Nous conservons uniquement
            la trace de l&apos;achat (identifiant de session, montant).
          </p>
        </section>

        <section>
          <h2 className="display text-lg text-festa-navy">Mesure d&apos;audience</h2>
          <p className="mt-1 text-muted">
            Statistiques d&apos;usage anonymes via PostHog (hébergement UE) :
            pages vues, features utilisées. Jamais ta position, jamais tes
            messages. Suivi des erreurs via Sentry.
          </p>
        </section>

        <section>
          <h2 className="display text-lg text-festa-navy">Tes droits (RGPD)</h2>
          <p className="mt-1 text-muted">
            Suppression du profil communauté et de toutes ses données en un
            bouton (onglet Rencontres). Suppression du compte et export de
            données sur demande : adam@beloucif.com. Aucune revente de
            données, à personne, jamais.
          </p>
        </section>
      </div>
    </main>
  );
}
