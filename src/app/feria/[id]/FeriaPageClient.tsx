"use client";

/**
 * FeriaPageClient.tsx, l'ecran principal d'une feria.
 *
 * Orchestration metier :
 *  1. geolocalise le festayre (ou retombe sur le centre de la feria),
 *  2. charge les POI OpenStreetMap une fois (toilettes, alcool, eau,
 *     pharmacies) et les trie par distance en continu,
 *  3. deux vues : Carte (Leaflet) et Liste (tri distance), plus les
 *     onglets Programme et la meteo en bandeau.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { Feria } from "@/features/ferias/data";
import { feriaStatus, formatDates } from "@/features/ferias/data";
import { fetchPois, type Poi, type PoiCategory } from "@/features/pois/overpass";
import PoiList, { CATEGORY_TABS } from "@/features/pois/PoiList";
import ProgramList from "@/features/program/ProgramList";
import WeatherCard from "@/features/weather/WeatherCard";
import { useGeolocation } from "@/features/map/useGeolocation";
import { useMeetPoint } from "@/features/meetpoint/useMeetPoint";
import { t } from "@/features/i18n/translations";
import { useLang } from "@/features/i18n/useLang";
import LangSwitcher from "@/features/i18n/LangSwitcher";
import { sortByDistance } from "@/lib/geo";

/* Leaflet touche window : chargement navigateur uniquement. */
const FeriaMap = dynamic(() => import("@/features/map/FeriaMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      Chargement de la carte...
    </div>
  ),
});

type View = "map" | "list" | "program" | "infos";

export default function FeriaPageClient({ feria }: { feria: Feria }) {
  const { position, error: geoError } = useGeolocation();
  const [lang] = useLang();
  const [pois, setPois] = useState<Poi[] | null>(null);
  const [poisError, setPoisError] = useState(false);
  const [view, setView] = useState<View>("map");
  const [category, setCategory] = useState<PoiCategory>("toilets");
  // Point de RDV du groupe (persiste par feria) + retour utilisateur.
  const { point: meetPoint, setMeetPoint, clearMeetPoint, shareMeetPoint } = useMeetPoint(feria.id);
  const [meetMsg, setMeetMsg] = useState<string | null>(null);

  // Chargement des POI une seule fois par feria (donnee stable).
  useEffect(() => {
    let cancelled = false;
    fetchPois(feria.center)
      .then((data) => !cancelled && setPois(data))
      .catch(() => !cancelled && setPoisError(true));
    return () => {
      cancelled = true;
    };
  }, [feria]);

  // Reference distance : l'utilisateur, sinon le coeur de la feria.
  const origin = position ?? feria.center;
  const sortedPois = useMemo(
    () => (pois ? sortByDistance(pois, origin) : []),
    [pois, origin]
  );

  const status = feriaStatus(feria);

  return (
    <div className="flex h-dvh flex-col">
      {/* En-tete compact : retour + identite de la feria. */}
      <header className="border-b border-card-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Retour à l'accueil" className="-ml-2 flex h-11 w-11 items-center justify-center text-2xl font-bold">
            {"<"}
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="display truncate text-xl font-extrabold">
              {feria.name}
              {status === "live" && (
                <span className="live-pulse ml-2 inline-block rounded-full bg-festa-red px-2 py-0.5 align-middle text-[10px] font-bold uppercase text-white">
                  Live
                </span>
              )}
            </h1>
            <p className="text-xs text-muted">
              {feria.city}, {formatDates(feria)}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <WeatherCard center={feria.center} />
          </div>
          <LangSwitcher />
        </div>
        {/* Erreur geoloc affichee sans bloquer : mode "centre feria". */}
        {geoError && <p className="mt-1 text-[11px] text-muted">{geoError}</p>}
      </header>

      {/* Selecteur de vue principal. */}
      <nav className="flex border-b border-card-border bg-card text-sm font-bold">
        {(
          [
            ["map", t("tab.map", lang)],
            ["list", t("tab.list", lang)],
            ["program", t("tab.program", lang)],
            ["infos", t("tab.infos", lang)],
          ] as [View, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`min-h-11 flex-1 py-2.5 ${
              view === id
                ? "border-b-2 border-festa-red text-festa-red"
                : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Filtres categorie, seulement pour carte et liste. */}
      {(view === "map" || view === "list") && (
        <div className="flex gap-2 overflow-x-auto bg-background px-3 py-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategory(tab.id)}
              className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
                category === tab.id
                  ? "bg-festa-red text-white"
                  : "border border-card-border bg-card text-muted"
              }`}
            >
              {t(tab.labelKey, lang)}
            </button>
          ))}
        </div>
      )}

      {/* Zone de contenu. */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view + (view === "map" || view === "list" ? category : "")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full overflow-y-auto"
          >
            {view === "map" && (
              <div className="relative h-full">
                {poisError && (
                  <p className="p-4 text-center text-sm text-muted">
                    Serveurs de données saturés (classique un soir de
                    féria). Réessaie dans une minute.
                  </p>
                )}
                <FeriaMap
                  center={feria.center}
                  userPosition={position}
                  pois={sortedPois.filter((p) => p.category === category)}
                  meetPoint={meetPoint}
                />
                {/* Barre RDV du groupe, posee sur la carte. */}
                <div className="absolute inset-x-3 bottom-3 z-10 flex items-center gap-2">
                  <button
                    onClick={() => {
                      // RDV = position actuelle, sinon coeur de la feria.
                      setMeetPoint(position ?? feria.center);
                      setMeetMsg("RDV épinglé sur la carte.");
                    }}
                    className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-festa-navy px-4 text-xs font-bold text-white shadow-lg"
                  >
                    {meetPoint ? t("meet.move", lang) : t("meet.set", lang)}
                  </button>
                  {meetPoint && (
                    <>
                      <button
                        onClick={async () => setMeetMsg(await shareMeetPoint())}
                        className="flex min-h-11 items-center rounded-full bg-festa-red px-4 text-xs font-bold text-white shadow-lg"
                      >
                        {t("action.share", lang)}
                      </button>
                      <button
                        onClick={() => {
                          clearMeetPoint();
                          setMeetMsg("RDV supprimé.");
                        }}
                        aria-label="Supprimer le point de RDV"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-sm font-bold shadow-lg"
                      >
                        X
                      </button>
                    </>
                  )}
                </div>
                {meetMsg && (
                  <p
                    role="status"
                    className="absolute inset-x-3 bottom-16 z-10 rounded-lg bg-card/95 p-2 text-center text-xs shadow"
                  >
                    {meetMsg}
                  </p>
                )}
              </div>
            )}
            {view === "list" &&
              (pois === null && !poisError ? (
                <p className="p-6 text-center text-sm text-muted">
                  Recherche des spots autour de toi...
                </p>
              ) : (
                <PoiList pois={sortedPois} category={category} />
              ))}
            {view === "program" && <ProgramList feria={feria} />}
            {view === "infos" && (
              /* Onglet Infos : bracelets d'entree, navettes, urgences.
                 Les numeros d'urgence sont en clair, pas d'app qui
                 fait la maligne quand quelqu'un va mal. */
              <div className="space-y-4 p-4 text-sm">
                <section className="rounded-xl border border-card-border bg-card p-3">
                  <h3 className="display text-base font-extrabold text-festa-red">
                    {t("infos.bracelets", lang)}
                  </h3>
                  <p className="mt-1 leading-snug">
                    {feria.bracelets ??
                      "Entrée libre a priori. Vérifie les éventuels concerts ou arènes payants sur le site officiel."}
                  </p>
                </section>
                <section className="rounded-xl border border-card-border bg-card p-3">
                  <h3 className="display text-base font-extrabold text-festa-red">
                    {t("infos.shuttles", lang)}
                  </h3>
                  <p className="mt-1 leading-snug">
                    {feria.shuttles ??
                      "Consulte l'onglet Carte, catégorie Bus / navettes, pour les arrêts autour de toi."}
                  </p>
                </section>
                <section className="rounded-xl border border-festa-red/40 bg-festa-red/5 p-3">
                  <h3 className="display text-base font-extrabold text-festa-red">
                    {t("infos.emergency", lang)}
                  </h3>
                  <ul className="mt-1 space-y-1 font-semibold">
                    <li><a href="tel:112">112, urgences européennes</a></li>
                    <li><a href="tel:15">15, SAMU</a></li>
                    <li><a href="tel:17">17, Police</a></li>
                    <li><a href="tel:18">18, Pompiers</a></li>
                    <li><a href="tel:3114">3114, souffrance psychique</a></li>
                  </ul>
                  <p className="mt-2 text-xs text-muted">
                    {t("emergency.notalone", lang)}
                  </p>
                </section>
                <a
                  href={feria.official}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-festa-red p-3 text-center font-bold text-white"
                >
                  {t("infos.official", lang)}
                </a>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
