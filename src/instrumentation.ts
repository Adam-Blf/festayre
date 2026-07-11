/**
 * instrumentation.ts, Sentry cote serveur (routes API : checkout,
 * webhook Stripe). Convention Next.js "register".
 * Actif uniquement si le DSN est configure.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }
}

/* Remonte les erreurs des routes serveur a Sentry (no-op sans DSN). */
export const onRequestError = Sentry.captureRequestError;
