/**
 * layout.tsx, coquille racine de l'application.
 * Charge les polices, les metadonnees PWA et enregistre le service
 * worker. Tout le contenu metier vit dans les pages.
 */
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/SwRegister";
import AnalyticsProvider from "@/components/AnalyticsProvider";

/* Display : Bricolage Grotesque, du caractere sans tomber dans le
 * gout "IA generique". Body : Inter pour la lisibilite terrain. */
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});
const body = Inter({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Festayre, les ferias directement dans votre poche",
  description:
    "Toilettes les plus proches, alcool le moins cher, bus, bracelets, programme et meteo de toutes les ferias du Sud-Ouest. Bayonne, Dax, Mont-de-Marsan et plus.",
  applicationName: "Festayre",
  appleWebApp: {
    capable: true,
    title: "Festayre",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#c8102e",
  width: "device-width",
  initialScale: 1,
  // On bloque le zoom pincer uniquement sur la coquille, la carte
  // Leaflet gere son propre zoom.
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Enregistrement du service worker (PWA installable + offline). */}
        <SwRegister />
        {/* Analytics produit PostHog (inactif sans cle env). */}
        <AnalyticsProvider />
      </body>
    </html>
  );
}
