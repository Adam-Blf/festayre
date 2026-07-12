"use client";

/**
 * GroupPanel.tsx, l'ecran du groupe live.
 *
 * Deux etats : sans groupe (creer / rejoindre par code) et en groupe
 * (code a partager, membres avec distance et fraicheur de position,
 * quitter). Le pointage de position tourne tant que la page est
 * ouverte (30 s), jamais en arriere-plan.
 */
import { useEffect, useState } from "react";
import { useGeolocation } from "@/features/map/useGeolocation";
import { formatDistance, haversineMeters } from "@/lib/geo";
import { useGroup } from "./useGroup";

/** Fraicheur d'une position ("il y a 40 s", "il y a 5 min"). */
function freshness(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `il y a ${secs} s`;
  return `il y a ${Math.floor(secs / 60)} min`;
}

export default function GroupPanel() {
  const { group, members, error, createGroup, joinGroup, leaveGroup, refreshMembers, pushPosition } = useGroup();
  const { position } = useGeolocation();
  const [name, setName] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Polling membres + pointage de MA position tant que l'ecran vit.
  useEffect(() => {
    if (!group) return;
    refreshMembers();
    const poll = setInterval(refreshMembers, 10_000);
    return () => clearInterval(poll);
  }, [group, refreshMembers]);

  useEffect(() => {
    if (!group || !position) return;
    pushPosition(position);
    const push = setInterval(() => pushPosition(position), 30_000);
    return () => clearInterval(push);
  }, [group, position, pushPosition]);

  if (!group) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-festa-navy/5 p-3 text-xs text-muted">
          Ta position n&apos;est partagée QU&apos;avec les membres de ton groupe,
          uniquement quand l&apos;app est ouverte, et supprimée quand tu quittes
          le groupe. Compte requis.
        </p>

        <input
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          maxLength={40}
          placeholder="Ton prénom (visible par le groupe)"
          className="min-h-12 w-full rounded-xl border border-card-border bg-card px-4 text-sm"
        />

        <section className="rounded-xl border border-card-border bg-card p-4">
          <h2 className="display text-lg text-festa-red">Créer un groupe</h2>
          <div className="mt-2 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Nom (Les copains de Dax...)"
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-card-border bg-background px-3 text-sm"
            />
            <button
              onClick={() => createGroup(name, pseudo)}
              disabled={!name.trim() || !pseudo.trim()}
              className="min-h-11 rounded-lg bg-festa-red px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              Créer
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-card-border bg-card p-4">
          <h2 className="display text-lg text-festa-red">Rejoindre</h2>
          <div className="mt-2 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="CODE"
              className="min-h-11 w-32 rounded-lg border border-card-border bg-background px-3 text-center font-mono text-lg tracking-widest"
            />
            <button
              onClick={() => joinGroup(code, pseudo)}
              disabled={code.length < 6 || !pseudo.trim()}
              className="min-h-11 flex-1 rounded-lg bg-festa-navy text-sm font-bold text-white disabled:opacity-50"
            >
              Rejoindre le groupe
            </button>
          </div>
        </section>

        {error && <p className="text-center text-xs text-festa-red">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Code d'invitation, l'element central a partager. */}
      <section className="rounded-xl border border-festa-red bg-festa-red/5 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{group.name}</p>
        <p className="display mt-1 text-4xl tracking-[0.3em] text-festa-red">{group.code}</p>
        <button
          onClick={async () => {
            try {
              if (navigator.share) {
                await navigator.share({ text: `Rejoins mon groupe Festayre avec le code ${group.code} sur https://festayre.vercel.app/groupe` });
              } else {
                await navigator.clipboard.writeText(group.code);
                setCopied(true);
              }
            } catch {
              // partage annule
            }
          }}
          className="mt-2 min-h-11 rounded-full bg-festa-red px-6 text-sm font-bold text-white"
        >
          {copied ? "Code copié" : "Partager le code"}
        </button>
      </section>

      {/* Membres, tries du plus proche au plus lointain. */}
      <ul className="space-y-2">
        {members
          .map((m) => ({
            ...m,
            distanceM:
              position && m.position ? haversineMeters(position, m.position) : null,
          }))
          .sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity))
          .map((m) => (
            <li
              key={m.user_id}
              className="flex items-center gap-3 rounded-xl border border-card-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{m.display_name}</p>
                <p className="text-xs text-muted">
                  {m.position ? freshness(m.position.updatedAt) : "jamais pointé"}
                </p>
              </div>
              {m.distanceM !== null && (
                <span className="shrink-0 text-sm font-bold tabular-nums text-festa-red">
                  {formatDistance(m.distanceM)}
                </span>
              )}
            </li>
          ))}
      </ul>
      <p className="text-center text-[11px] text-muted">
        Les positions des membres apparaissent aussi sur la carte de chaque féria.
      </p>

      <button
        onClick={leaveGroup}
        className="w-full text-center text-xs font-semibold text-festa-red underline"
      >
        Quitter le groupe (supprime ma position)
      </button>
    </div>
  );
}
