/**
 * ProgramList.tsx, affichage du programme d'une feria.
 * Composant serveur (aucune interactivite), simple et rapide.
 * Rappel metier : programme INDICATIF, la verite est sur le site
 * officiel, toujours linke en bas.
 */
import type { Feria } from "@/features/ferias/data";

export default function ProgramList({ feria }: { feria: Feria }) {
  return (
    <div className="space-y-5 p-4">
      {feria.program.map((day) => (
        <section key={day.label}>
          <h3 className="display mb-2 text-lg font-extrabold text-festa-red">
            {day.label}
          </h3>
          <ul className="space-y-2">
            {day.items.map((item) => (
              <li key={`${day.label}-${item.time}-${item.title}`} className="flex gap-3">
                <span className="w-14 shrink-0 text-sm font-bold tabular-nums">
                  {item.time}
                </span>
                <div>
                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                  {item.place && <p className="text-xs text-muted">{item.place}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="rounded-xl bg-festa-red/5 p-3 text-xs text-muted">
        Programme indicatif basé sur les éditions précédentes. Le seul
        programme officiel est sur{" "}
        <a
          href={feria.official}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-festa-red underline"
        >
          {feria.official.replace("https://", "")}
        </a>
        .
      </p>
    </div>
  );
}
