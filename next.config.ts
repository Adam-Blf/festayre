import type { NextConfig } from "next";

/**
 * Configuration Next.js, volet securite.
 * Headers appliques a toutes les routes :
 *  - CSP en liste blanche stricte des hotes autorises,
 *  - HSTS deux ans,
 *  - anti-clickjacking, anti MIME-sniffing, referrer minimal,
 *  - acces capteurs limite a la geolocalisation (le coeur de l'app),
 *    camera et micro explicitement refuses (la photo de profil passe
 *    par le selecteur de fichiers, pas par la camera).
 */
const csp = [
  "default-src 'self'",
  // 'unsafe-inline' requis par les scripts d'hydratation inline de
  // Next sans infrastructure de nonce.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://*.supabase.co",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://overpass-api.de https://overpass.kumi.systems https://api.open-meteo.com https://eu.i.posthog.com https://*.sentry.io https://api.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
