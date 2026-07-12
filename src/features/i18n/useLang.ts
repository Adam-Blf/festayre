"use client";

/**
 * useLang.ts, langue de l'interface (persistee en localStorage).
 * Un event custom propage le changement a tous les composants montes,
 * sans provider React : suffisant pour trois langues et zero contexte.
 */
import { useCallback, useEffect, useState } from "react";
import type { Lang } from "./translations";
import { LANGS } from "./translations";

const KEY = "festayre.lang";
const EVENT = "festayre:lang";

function readLang(): Lang {
  if (typeof window === "undefined") return "fr";
  const stored = localStorage.getItem(KEY);
  return LANGS.includes(stored as Lang) ? (stored as Lang) : "fr";
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("fr");

  // Lecture apres montage (le serveur rend toujours en francais).
  useEffect(() => {
    setLangState(readLang());
    const onChange = () => setLangState(readLang());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(KEY, l);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [lang, setLang];
}
