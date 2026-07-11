/**
 * weather.ts, meteo temps reel via Open-Meteo (gratuit, sans cle API).
 *
 * Point de vue metier : la seule meteo qui interesse un festayre,
 * c'est "il fait combien" et "est-ce qu'il va pleuvoir sur le feu
 * d'artifice ce soir". On ne charge donc que le strict necessaire.
 */
import type { LatLng } from "@/lib/geo";

/** Instantane meteo simplifie pour l'affichage. */
export type WeatherNow = {
  /** Temperature ressentie arrondie, en degres Celsius. */
  tempC: number;
  /** Code meteo WMO (0 = grand soleil, 95+ = orage). */
  code: number;
  /** Probabilite de pluie max sur les 6 prochaines heures (%). */
  rainProb: number;
};

/**
 * Traduction des codes WMO en langage festayre.
 * Table volontairement grossiere : pas besoin de distinguer
 * "bruine legere" de "bruine dense" pour decider de sortir.
 */
export function weatherLabel(code: number): string {
  if (code === 0) return "Grand soleil";
  if (code <= 2) return "Plutot degage";
  if (code === 3) return "Couvert";
  if (code <= 48) return "Brouillard";
  if (code <= 57) return "Bruine";
  if (code <= 67) return "Pluie";
  if (code <= 77) return "Neige (?!)";
  if (code <= 82) return "Averses";
  return "Orage, abrite-toi";
}

/**
 * Recupere la meteo actuelle + le risque de pluie des 6 prochaines
 * heures pour le centre d'une feria. Echec silencieux cote appelant :
 * la meteo est un bonus, jamais bloquant.
 */
export async function fetchWeather(center: LatLng): Promise<WeatherNow> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${center.lat}&longitude=${center.lng}` +
    `&current=temperature_2m,weather_code` +
    `&hourly=precipitation_probability&forecast_hours=6&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const data = await res.json();

  const probs: number[] = data.hourly?.precipitation_probability ?? [];
  return {
    tempC: Math.round(data.current?.temperature_2m ?? 0),
    code: data.current?.weather_code ?? 0,
    rainProb: probs.length ? Math.max(...probs) : 0,
  };
}
