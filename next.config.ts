import type { NextConfig } from "next";

/**
 * Configuration Next.js, volet securite.
 * Headers appliques a toutes les routes :
 *  - anti-clickjacking (X-Frame-Options),
 *  - anti MIME-sniffing,
 *  - referrer minimal vers les sites externes,
 *  - acces capteurs limite a la geolocalisation (le coeur de l'app),
 *    camera et micro explicitement refuses.
 */
const securityHeaders = [
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
