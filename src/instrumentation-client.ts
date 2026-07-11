/**
 * instrumentation-client.ts, Sentry cote navigateur.
 * Convention Next.js : ce fichier est charge automatiquement au
 * demarrage du client. Actif uniquement si le DSN est configure.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Volume raisonnable pour un projet perso : 10 % des transactions.
    tracesSampleRate: 0.1,
    // Pas de session replay : inutile ici et lourd pour la batterie.
    integrations: [],
  });
}

/* Instrumentation des navigations App Router (no-op sans DSN). */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
