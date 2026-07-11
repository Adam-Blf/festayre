/**
 * layout.tsx, coquille racine de l'application.
 * Charge les polices, les metadonnees PWA et enregistre le service
 * worker. Tout le contenu metier vit dans les pages.
 */
import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/SwRegister";
import AnalyticsProvider from "@/components/AnalyticsProvider";

/* Typo affiche de feria : Anton, la condensee des posters taurins,
 * reservee aux titres. Archivo en body, lisible en plein soleil. */
const display = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});
const body = Archivo({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Festayre, les férias directement dans votre poche",
  description:
    "Toilettes les plus proches, alcool le moins cher, bus, bracelets, programme et météo de toutes les férias du Sud-Ouest. Bayonne, Dax, Mont-de-Marsan et plus.",
  applicationName: "Festayre",
  appleWebApp: {
    capable: true,
    title: "Festayre",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#15274b",
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
