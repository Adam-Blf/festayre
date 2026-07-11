"use client";

/**
 * WeatherCard.tsx, bandeau meteo compact de la feria.
 * Echec silencieux : si Open-Meteo ne repond pas, on n'affiche rien,
 * la meteo est un bonus qui ne doit jamais bloquer l'ecran carte.
 */
import { useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo";
import { fetchWeather, weatherLabel, type WeatherNow } from "./weather";

export default function WeatherCard({ center }: { center: LatLng }) {
  const [weather, setWeather] = useState<WeatherNow | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWeather(center)
      .then((w) => !cancelled && setWeather(w))
      .catch(() => {
        // Pas de meteo, pas de drame.
      });
    return () => {
      cancelled = true;
    };
  }, [center]);

  if (!weather) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-card-border bg-card px-3 py-2 text-sm">
      <span className="font-semibold">
        {weather.tempC}°C, {weatherLabel(weather.code)}
      </span>
      {/* Le risque de pluie n'est affiche que s'il est significatif. */}
      {weather.rainProb >= 30 && (
        <span className="text-xs font-bold text-festa-red">
          {weather.rainProb}% de pluie dans les 6h
        </span>
      )}
    </div>
  );
}
