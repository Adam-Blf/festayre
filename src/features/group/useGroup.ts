"use client";

/**
 * useGroup.ts, cycle de vie du groupe live.
 *
 * Le groupe actif (id + code + nom + pseudo) vit en localStorage pour
 * survivre aux rechargements. Le hook expose :
 *  - create / join / leave,
 *  - la liste des membres avec leur derniere position,
 *  - le POINTAGE : pushPosition, appele par les pages qui ont deja la
 *    geolocalisation (aucun suivi en arriere-plan : app fermee =
 *    position figee puis obsolete, c'est voulu).
 */
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/features/account/supabase";
import type { LatLng } from "@/lib/geo";
import { generateGroupCode, isValidGroupCode, normalizeGroupCode } from "./code";

const STORAGE_KEY = "festayre.group.v1";

export type ActiveGroup = { id: string; code: string; name: string };

export type GroupMember = {
  user_id: string;
  display_name: string;
  /** Derniere position connue, null si jamais pointee. */
  position: (LatLng & { updatedAt: string }) | null;
};

export function useGroup() {
  const supabase = getSupabaseBrowser();
  const [group, setGroup] = useState<ActiveGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setGroup(JSON.parse(raw) as ActiveGroup);
    } catch {
      // Stockage corrompu : pas de groupe actif.
    }
  }, []);

  const persist = (g: ActiveGroup | null) => {
    setGroup(g);
    if (g) localStorage.setItem(STORAGE_KEY, JSON.stringify(g));
    else localStorage.removeItem(STORAGE_KEY);
  };

  /** Cree un groupe et s'y inscrit. */
  const createGroup = useCallback(
    async (name: string, displayName: string) => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Connexion requise (Mon compte).");
        return;
      }
      const code = generateGroupCode();
      const { data, error: gErr } = await supabase
        .from("groups")
        .insert({ code, name: name.trim(), created_by: user.id })
        .select("id")
        .single();
      if (gErr || !data) {
        setError("Création impossible, réessaie.");
        return;
      }
      await supabase.from("group_members").insert({
        group_id: data.id,
        user_id: user.id,
        display_name: displayName.trim(),
      });
      persist({ id: data.id, code, name: name.trim() });
      setError(null);
    },
    [supabase]
  );

  /** Rejoint un groupe par code d'invitation. */
  const joinGroup = useCallback(
    async (rawCode: string, displayName: string) => {
      if (!supabase) return;
      const code = normalizeGroupCode(rawCode);
      if (!isValidGroupCode(code)) {
        setError("Code invalide (6 lettres/chiffres).");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Connexion requise (Mon compte).");
        return;
      }
      const { data: g } = await supabase
        .from("groups")
        .select("id, code, name")
        .eq("code", code)
        .maybeSingle();
      if (!g) {
        setError("Aucun groupe avec ce code.");
        return;
      }
      const { error: mErr } = await supabase.from("group_members").upsert({
        group_id: g.id,
        user_id: user.id,
        display_name: displayName.trim(),
      });
      if (mErr) {
        setError("Impossible de rejoindre, réessaie.");
        return;
      }
      persist({ id: g.id, code: g.code, name: g.name });
      setError(null);
    },
    [supabase]
  );

  /** Quitte le groupe : position supprimee AVANT le depart (RLS). */
  const leaveGroup = useCallback(async () => {
    if (!supabase || !group) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("group_positions").delete()
        .eq("group_id", group.id).eq("user_id", user.id);
      await supabase.from("group_members").delete()
        .eq("group_id", group.id).eq("user_id", user.id);
    }
    persist(null);
    setMembers([]);
  }, [supabase, group]);

  /** Recharge membres + positions (appele en polling par les pages). */
  const refreshMembers = useCallback(async () => {
    if (!supabase || !group) return;
    const [{ data: mems }, { data: pos }] = await Promise.all([
      supabase.from("group_members").select("user_id, display_name").eq("group_id", group.id),
      supabase.from("group_positions").select("user_id, lat, lng, updated_at").eq("group_id", group.id),
    ]);
    const posBy = new Map(
      (pos ?? []).map((p) => [p.user_id as string, { lat: p.lat as number, lng: p.lng as number, updatedAt: p.updated_at as string }])
    );
    setMembers(
      (mems ?? []).map((m) => ({
        user_id: m.user_id as string,
        display_name: m.display_name as string,
        position: posBy.get(m.user_id as string) ?? null,
      }))
    );
  }, [supabase, group]);

  /** Pousse SA position (les pages appellent avec leur geoloc). */
  const pushPosition = useCallback(
    async (p: LatLng) => {
      if (!supabase || !group) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("group_positions").upsert({
        group_id: group.id,
        user_id: user.id,
        lat: p.lat,
        lng: p.lng,
        updated_at: new Date().toISOString(),
      });
    },
    [supabase, group]
  );

  return { group, members, error, createGroup, joinGroup, leaveGroup, refreshMembers, pushPosition };
}
