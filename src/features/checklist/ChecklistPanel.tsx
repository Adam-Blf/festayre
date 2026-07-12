"use client";

/**
 * ChecklistPanel.tsx, la checklist de survie du festayre.
 *
 * Metier : la meme scene chaque annee, on part a la feria en oubliant
 * la creme solaire ou la batterie externe. Liste par defaut issue de
 * l'experience terrain + items personnalises.
 *
 * Persistance : localStorage uniquement. Donnee non sensible, zero
 * reseau, fonctionne hors ligne (et la sync multi-appareils est une
 * candidate naturelle pour Festayre+).
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useCloudSync } from "@/features/sync/cloudSync";

type Item = {
  id: string;
  label: string;
  checked: boolean;
  /** true pour les items ajoutes par l'utilisateur (supprimables). */
  custom: boolean;
};

/** Le kit de survie standard, verifie par des generations de festayres. */
const DEFAULT_ITEMS = [
  "Tenue blanche",
  "Foulard et ceinture rouges",
  "Batterie externe chargée",
  "Crème solaire",
  "Espèces en petites coupures",
  "Gourde ou bouteille d'eau",
  "Bouchons d'oreilles",
  "Chaussures déjà portées (pas neuves)",
  "Doliprane pour le lendemain",
  "Point de rendez-vous fixé avec le groupe",
];

const STORAGE_KEY = "festayre.checklist.v1";

/** Etat initial : items par defaut, rien de coche. */
function defaultState(): Item[] {
  return DEFAULT_ITEMS.map((label, i) => ({
    id: `d${i}`,
    label,
    checked: false,
    custom: false,
  }));
}

export default function ChecklistPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [loaded, setLoaded] = useState(false);
  // Sync multi-appareils Festayre+ (last-write-wins).
  const sync = useCloudSync("checklist");

  // Lecture au montage (localStorage n'existe pas cote serveur).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setItems(raw ? (JSON.parse(raw) as Item[]) : defaultState());
    } catch {
      setItems(defaultState());
    }
    setLoaded(true);
  }, []);

  // Etat distant Festayre+ : il remplace le local au montage.
  useEffect(() => {
    if (!sync.remote || !Array.isArray(sync.remote)) return;
    setItems(sync.remote as Item[]);
  }, [sync.remote]);

  // Sauvegarde a chaque changement, une fois charge (+ push cloud).
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    sync.push(items);
  }, [items, loaded, sync]);

  const toggle = (id: string) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );

  const addItem = () => {
    const label = newLabel.trim();
    if (!label) return;
    setItems((prev) => [
      ...prev,
      { id: `c${Date.now()}`, label, checked: false, custom: true },
    ]);
    setNewLabel("");
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const reset = () =>
    setItems((prev) => prev.map((it) => ({ ...it, checked: false })));

  const done = items.filter((it) => it.checked).length;

  return (
    <div className="space-y-4">
      {sync.active && (
        <p className="text-center text-[11px] font-semibold text-festa-green">
          Synchronisé entre tes appareils (Festayre+)
        </p>
      )}
      {/* Barre de progression : pret pour la feria a 100 %. */}
      <div className="rounded-xl border border-card-border bg-card p-3">
        <div className="flex justify-between text-sm font-bold">
          <span>
            {done}/{items.length} prêt
          </span>
          <button onClick={reset} className="text-xs font-semibold text-muted underline">
            Tout décocher
          </button>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-card-border">
          <motion.div
            className="h-full bg-festa-red"
            animate={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 text-sm transition-colors ${
                item.checked ? "border-festa-green/50 opacity-70" : "border-card-border"
              }`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggle(item.id)}
                className="h-5 w-5 accent-[#b80c1d]"
              />
              <span className={item.checked ? "line-through" : ""}>{item.label}</span>
              {item.custom && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeItem(item.id);
                  }}
                  aria-label={`Supprimer ${item.label}`}
                  className="ml-auto text-xs font-bold text-muted"
                >
                  X
                </button>
              )}
            </label>
          </li>
        ))}
      </ul>

      {/* Ajout d'un item personnalise. */}
      <div className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Ajouter un truc à ne pas oublier..."
          className="flex-1 rounded-lg border border-card-border bg-card px-3 py-2 text-sm"
        />
        <button
          onClick={addItem}
          className="rounded-lg bg-festa-red px-4 text-sm font-bold text-white"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
