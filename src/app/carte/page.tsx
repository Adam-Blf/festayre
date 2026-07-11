"use client";

/**
 * /carte, la carte de visite festayre d'Adam.
 * Un QR code plein ecran vers Instagram : en feria on ne tape pas un
 * pseudo sur un ecran mouille, on scanne.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

const INSTAGRAM_URL = "https://instagram.com/_adam_blf";

export default function CartePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-10">
      <header className="flex items-center gap-3 py-6">
        <Link href="/" aria-label="Retour" className="text-2xl font-bold">
          {"<"}
        </Link>
        <h1 className="display text-3xl font-extrabold text-festa-red">Ma carte</h1>
      </header>

      {/* La carte facon pass de feria : rouge et blanc, plein cadre. */}
      <motion.div
        initial={{ opacity: 0, rotate: -2, y: 20 }}
        animate={{ opacity: 1, rotate: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="mx-auto w-full max-w-sm rounded-3xl bg-festa-red p-6 text-white shadow-2xl"
      >
        <p className="display text-2xl font-extrabold">Adam</p>
        <p className="text-sm text-white/80">@_adam_blf</p>

        <div className="mt-4 rounded-2xl bg-white p-4">
          {/* QR genere en SVG local : fonctionne meme hors ligne. */}
          <QRCodeSVG
            value={INSTAGRAM_URL}
            className="h-auto w-full"
            size={256}
            fgColor="#c8102e"
            bgColor="#ffffff"
            level="M"
          />
        </div>

        <p className="mt-4 text-center text-sm font-bold uppercase tracking-wide">
          Scanne-moi, on se retrouve aux bodegas
        </p>
      </motion.div>
    </main>
  );
}
