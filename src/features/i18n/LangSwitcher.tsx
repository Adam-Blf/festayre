"use client";

/**
 * LangSwitcher.tsx, selecteur FR / ES / EN compact.
 * Libelles en code langue, comprehensibles quelle que soit la langue
 * courante (regle d'or des selecteurs de langue).
 */
import { LANGS } from "./translations";
import { useLang } from "./useLang";

export default function LangSwitcher() {
  const [lang, setLang] = useLang();
  return (
    <div className="flex gap-1" role="group" aria-label="Langue">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`flex h-9 w-11 items-center justify-center rounded-lg text-xs font-bold uppercase ${
            lang === l
              ? "bg-festa-navy text-white"
              : "border border-card-border bg-card text-muted"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
