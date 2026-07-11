"use client";

/**
 * AnalyticsProvider.tsx, analytics produit via PostHog.
 *
 * Regles :
 *  - actif UNIQUEMENT si NEXT_PUBLIC_POSTHOG_KEY est definie,
 *  - host europeen par defaut (donnees en UE, RGPD friendly),
 *  - on ne trace JAMAIS la position GPS de l'utilisateur : on capture
 *    des evenements produit (feria consultee, categorie cliquee),
 *    pas des coordonnees.
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export default function AnalyticsProvider() {
  const pathname = usePathname();

  // Initialisation unique au montage.
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // App Router = navigation SPA : on capture les pageviews nous-memes.
      capture_pageview: false,
      persistence: "localStorage",
    });
  }, []);

  // Pageview a chaque changement de route.
  useEffect(() => {
    if (!POSTHOG_KEY || !pathname) return;
    posthog.capture("$pageview", { path: pathname });
  }, [pathname]);

  return null;
}
