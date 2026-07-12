"use client";

/**
 * cloudSync.ts, synchronisation multi-appareils Festayre+.
 *
 * Strategie volontairement simple : last-write-wins.
 *  - au montage d'une page synchronisable, on TIRE l'etat distant
 *    (s'il existe, il remplace le local : le dernier appareil qui a
 *    ecrit a raison),
 *  - a chaque modification locale, on POUSSE tout le blob.
 * La policy RLS refuse l'ecriture sans achat Festayre+ : le hook se
 * contente de tenter, et se tait si la base refuse.
 */
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/features/account/supabase";

type SyncSection = "passport" | "checklist";

export type CloudSyncState = {
  /** true si l'utilisateur est connecte ET Festayre+. */
  active: boolean;
  /** Donnees distantes recuperees au montage (null si aucune). */
  remote: unknown | null;
  /** Pousse le nouvel etat local vers le cloud (fire and forget). */
  push: (value: unknown) => void;
};

export function useCloudSync(section: SyncSection): CloudSyncState {
  const supabase = getSupabaseBrowser();
  const [active, setActive] = useState(false);
  const [remote, setRemote] = useState<unknown | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Detection compte + Festayre+ + tirage initial.
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: plus } = await supabase
        .from("purchases")
        .select("id")
        .eq("product", "festayre_plus")
        .limit(1);
      if (!plus?.length || cancelled) return;
      setUserId(user.id);
      setActive(true);
      const { data: row } = await supabase
        .from("user_sync")
        .select(section)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && row) setRemote((row as Record<string, unknown>)[section] ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, section]);

  const push = useCallback(
    (value: unknown) => {
      if (!supabase || !userId) return;
      // Upsert silencieux : la RLS tranche (refus = pas Festayre+).
      supabase
        .from("user_sync")
        .upsert({ user_id: userId, [section]: value })
        .then(() => {});
    },
    [supabase, userId, section]
  );

  return { active, remote, push };
}
