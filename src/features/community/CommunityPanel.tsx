"use client";

/**
 * CommunityPanel.tsx, le pack communautaire : rencontres, fil,
 * covoiturage, le tout par feria.
 *
 * Regles metier et securite (voir supabase/migrations/0002_community.sql) :
 *  - compte obligatoire (magic link), profil declare 18+ pour les
 *    rencontres,
 *  - PAS de chat interne : un match mutuel revele l'Instagram des deux
 *    personnes (la RLS ne laisse lire le contact QUE si le like est
 *    mutuel), la conversation continue sur Instagram qui gere deja
 *    blocage et signalement,
 *  - toutes les ecritures passent par la RLS : le client ne peut agir
 *    que sur ses propres lignes.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/features/account/supabase";
import { FERIAS } from "@/features/ferias/data";

type Profile = {
  user_id: string;
  display_name: string;
  bio: string | null;
  is_adult: boolean;
};

type Post = { id: string; user_id: string; content: string; created_at: string };
type Ride = {
  id: string;
  user_id: string;
  direction: "aller" | "retour";
  detail: string;
  seats: number;
};

type Tab = "rencontres" | "fil" | "covoit";

export default function CommunityPanel() {
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<User | null>(null);
  const [feriaId, setFeriaId] = useState(FERIAS[0].id);
  const [tab, setTab] = useState<Tab>("rencontres");
  const [status, setStatus] = useState<string | null>(null);

  // Profil de l'utilisateur courant (null = pas encore cree).
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Donnees des onglets.
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [matches, setMatches] = useState<{ profile: Profile; instagram: string }[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  // Formulaires.
  const [formName, setFormName] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formInsta, setFormInsta] = useState("");
  const [formAdult, setFormAdult] = useState(false);
  const [postText, setPostText] = useState("");
  const [rideDirection, setRideDirection] = useState<"aller" | "retour">("retour");
  const [rideDetail, setRideDetail] = useState("");
  const [rideSeats, setRideSeats] = useState(2);

  /* ---- Session + profil ------------------------------------------- */

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) return;
    supabase
      .from("community_profiles")
      .select("user_id, display_name, bio, is_adult")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setMyProfile((data as Profile) ?? null);
        setProfileLoaded(true);
      });
  }, [supabase, user]);

  /* ---- Chargement des donnees de l'onglet actif -------------------- */

  const refresh = useCallback(async () => {
    if (!supabase || !user) return;

    if (tab === "rencontres") {
      // 1. Tous les profils 18+ sauf le mien.
      const { data: rows } = await supabase
        .from("community_profiles")
        .select("user_id, display_name, bio, is_adult")
        .eq("is_adult", true)
        .neq("user_id", user.id)
        .limit(100);
      const others = (rows ?? []) as Profile[];
      setProfiles(others);

      // 2. Mes likes donnes / recus sur CETTE feria (RLS : uniquement
      //    les likes qui me concernent).
      const { data: given } = await supabase
        .from("likes")
        .select("liked_id")
        .eq("liker_id", user.id)
        .eq("feria_id", feriaId);
      const { data: received } = await supabase
        .from("likes")
        .select("liker_id")
        .eq("liked_id", user.id)
        .eq("feria_id", feriaId);

      const givenSet = new Set((given ?? []).map((l) => l.liked_id as string));
      const receivedSet = new Set((received ?? []).map((l) => l.liker_id as string));
      setMyLikes(givenSet);

      // 3. Match = like dans les deux sens. La RLS de profile_contacts
      //    ne revelera l'Instagram QUE pour ces personnes.
      const matchedIds = [...givenSet].filter((id) => receivedSet.has(id));
      if (matchedIds.length) {
        const { data: contacts } = await supabase
          .from("profile_contacts")
          .select("user_id, instagram")
          .in("user_id", matchedIds);
        setMatches(
          (contacts ?? []).flatMap((c) => {
            const profile = others.find((p) => p.user_id === c.user_id);
            return profile ? [{ profile, instagram: c.instagram as string }] : [];
          })
        );
      } else {
        setMatches([]);
      }
    }

    if (tab === "fil") {
      const { data } = await supabase
        .from("posts")
        .select("id, user_id, content, created_at")
        .eq("feria_id", feriaId)
        .order("created_at", { ascending: false })
        .limit(50);
      setPosts((data ?? []) as Post[]);
    }

    if (tab === "covoit") {
      const { data } = await supabase
        .from("rides")
        .select("id, user_id, direction, detail, seats")
        .eq("feria_id", feriaId)
        .order("created_at", { ascending: false })
        .limit(50);
      setRides((data ?? []) as Ride[]);
    }
  }, [supabase, user, tab, feriaId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Pseudos des auteurs du fil / covoit (une requete groupee).
  useEffect(() => {
    if (!supabase) return;
    const ids = [...new Set([...posts.map((p) => p.user_id), ...rides.map((r) => r.user_id)])];
    const missing = ids.filter((id) => !names[id]);
    if (!missing.length) return;
    supabase
      .from("community_profiles")
      .select("user_id, display_name")
      .in("user_id", missing)
      .then(({ data }) => {
        const add: Record<string, string> = {};
        for (const row of data ?? []) add[row.user_id as string] = row.display_name as string;
        setNames((prev) => ({ ...prev, ...add }));
      });
  }, [supabase, posts, rides, names]);

  /* ---- Actions ------------------------------------------------------ */

  const saveProfile = async () => {
    if (!supabase || !user) return;
    if (!formAdult) {
      setStatus("La communauté Festayre est réservée aux majeurs.");
      return;
    }
    const { error } = await supabase.from("community_profiles").upsert({
      user_id: user.id,
      display_name: formName.trim(),
      bio: formBio.trim() || null,
      is_adult: formAdult,
    });
    if (!error && formInsta.trim()) {
      await supabase.from("profile_contacts").upsert({
        user_id: user.id,
        instagram: formInsta.trim().replace(/^@/, ""),
      });
    }
    if (error) {
      setStatus("Profil invalide (pseudo 2-40 caractères).");
    } else {
      setStatus("Profil créé. Bienvenue dans la communauté.");
      setMyProfile({
        user_id: user.id,
        display_name: formName.trim(),
        bio: formBio.trim() || null,
        is_adult: true,
      });
    }
  };

  const deleteProfile = async () => {
    if (!supabase || !user) return;
    // RGPD : suppression totale, cascade sur likes via FK.
    await supabase.from("profile_contacts").delete().eq("user_id", user.id);
    await supabase.from("community_profiles").delete().eq("user_id", user.id);
    setMyProfile(null);
    setStatus("Profil supprimé, données effacées.");
  };

  const like = async (likedId: string) => {
    if (!supabase || !user) return;
    await supabase.from("likes").upsert({
      liker_id: user.id,
      liked_id: likedId,
      feria_id: feriaId,
    });
    refresh();
  };

  const publishPost = async () => {
    if (!supabase || !user || !postText.trim()) return;
    const { error } = await supabase.from("posts").insert({
      feria_id: feriaId,
      user_id: user.id,
      content: postText.trim(),
    });
    if (!error) {
      setPostText("");
      refresh();
    }
  };

  const publishRide = async () => {
    if (!supabase || !user || rideDetail.trim().length < 5) return;
    const { error } = await supabase.from("rides").insert({
      feria_id: feriaId,
      user_id: user.id,
      direction: rideDirection,
      detail: rideDetail.trim(),
      seats: rideSeats,
    });
    if (!error) {
      setRideDetail("");
      refresh();
    }
  };

  /* ---- Rendus des etats bloquants ----------------------------------- */

  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-xl border border-card-border bg-card p-4 text-sm text-muted">
        La communauté nécessite les comptes (Supabase), pas encore activés
        sur ce déploiement. Carte, toilettes et programme restent 100 %
        dispo sans compte.
      </p>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-card-border bg-card p-4 text-sm">
        <p>La communauté demande un compte (anti-spam, anti-troll).</p>
        <Link
          href="/compte"
          className="mt-3 block rounded-lg bg-festa-red py-2.5 text-center font-bold text-white"
        >
          Se connecter en 30 secondes
        </Link>
      </div>
    );
  }

  if (profileLoaded && !myProfile) {
    return (
      <div className="rounded-xl border border-card-border bg-card p-4">
        <h2 className="display text-lg text-festa-red">Créer mon profil</h2>
        <div className="mt-3 space-y-2">
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Pseudo (visible par tous)"
            className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={formBio}
            onChange={(e) => setFormBio(e.target.value)}
            placeholder="Bio courte (optionnel)"
            className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={formInsta}
            onChange={(e) => setFormInsta(e.target.value)}
            placeholder="@instagram (révélé seulement en cas de match)"
            className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
          />
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formAdult}
              onChange={(e) => setFormAdult(e.target.checked)}
              className="h-5 w-5 accent-[#b80c1d]"
            />
            Je certifie avoir 18 ans ou plus
          </label>
          <button
            onClick={saveProfile}
            disabled={formName.trim().length < 2 || !formAdult}
            className="w-full rounded-lg bg-festa-red py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Créer mon profil
          </button>
          {status && <p className="text-xs text-muted">{status}</p>}
          <p className="text-[11px] text-muted">
            Ton Instagram n&apos;est jamais public : il est révélé uniquement
            aux personnes avec qui le like est mutuel. Profil supprimable à
            tout moment (toutes les données partent avec).
          </p>
        </div>
      </div>
    );
  }

  /* ---- Ecran principal ---------------------------------------------- */

  return (
    <div className="space-y-4">
      {/* Selecteur de feria : la communaute vit feria par feria. */}
      <select
        value={feriaId}
        onChange={(e) => setFeriaId(e.target.value)}
        aria-label="Choisir la féria"
        className="min-h-11 w-full rounded-lg border border-card-border bg-card px-3 text-sm font-semibold"
      >
        {FERIAS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}, {f.city}
          </option>
        ))}
      </select>

      {/* Onglets. */}
      <nav className="flex rounded-lg border border-card-border bg-card text-sm font-bold">
        {(
          [
            ["rencontres", "Rencontres"],
            ["fil", "Fil"],
            ["covoit", "Covoit"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`min-h-11 flex-1 rounded-lg ${
              tab === id ? "bg-festa-red text-white" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {status && (
        <p role="status" className="text-center text-xs text-muted">
          {status}
        </p>
      )}

      {/* ---- Rencontres ---- */}
      {tab === "rencontres" && (
        <div className="space-y-4">
          {matches.length > 0 && (
            <section className="rounded-xl border border-festa-green bg-festa-green/5 p-4">
              <h3 className="display text-base text-festa-green">Matchs</h3>
              <ul className="mt-2 space-y-2">
                {matches.map(({ profile, instagram }) => (
                  <li key={profile.user_id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">{profile.display_name}</span>
                    <a
                      href={`https://instagram.com/${instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center rounded-full bg-festa-green px-4 text-xs font-bold text-white"
                    >
                      @{instagram}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ul className="space-y-2">
            {profiles.map((p) => (
              <li
                key={p.user_id}
                className="flex items-center gap-3 rounded-xl border border-card-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{p.display_name}</p>
                  {p.bio && <p className="truncate text-xs text-muted">{p.bio}</p>}
                </div>
                <button
                  onClick={() => like(p.user_id)}
                  disabled={myLikes.has(p.user_id)}
                  className={`flex min-h-11 items-center rounded-full px-4 text-xs font-bold ${
                    myLikes.has(p.user_id)
                      ? "bg-card-border text-muted"
                      : "bg-festa-red text-white"
                  }`}
                >
                  {myLikes.has(p.user_id) ? "Liké" : "Like"}
                </button>
              </li>
            ))}
            {profiles.length === 0 && (
              <p className="p-4 text-center text-sm text-muted">
                Personne ici pour l&apos;instant. Reviens quand la féria chauffe.
              </p>
            )}
          </ul>

          <button onClick={deleteProfile} className="w-full text-center text-xs text-muted underline">
            Supprimer mon profil et toutes mes données
          </button>
        </div>
      )}

      {/* ---- Fil ---- */}
      {tab === "fil" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && publishPost()}
              maxLength={300}
              placeholder="Un bon plan, un concert, une info..."
              className="flex-1 rounded-lg border border-card-border bg-card px-3 py-2 text-sm"
            />
            <button
              onClick={publishPost}
              className="rounded-lg bg-festa-red px-4 text-sm font-bold text-white"
            >
              Publier
            </button>
          </div>
          <ul className="space-y-2">
            {posts.map((p) => (
              <li key={p.id} className="rounded-xl border border-card-border bg-card p-3">
                <p className="text-xs font-bold text-festa-red">
                  {names[p.user_id] ?? "Festayre"}
                </p>
                <p className="mt-0.5 text-sm">{p.content}</p>
              </li>
            ))}
            {posts.length === 0 && (
              <p className="p-4 text-center text-sm text-muted">
                Fil vide. Lance le premier bon plan.
              </p>
            )}
          </ul>
        </div>
      )}

      {/* ---- Covoit ---- */}
      {tab === "covoit" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-card-border bg-card p-3">
            <div className="flex gap-2">
              <select
                value={rideDirection}
                onChange={(e) => setRideDirection(e.target.value as "aller" | "retour")}
                aria-label="Sens du trajet"
                className="min-h-11 rounded-lg border border-card-border bg-background px-2 text-sm"
              >
                <option value="aller">Aller</option>
                <option value="retour">Retour</option>
              </select>
              <select
                value={rideSeats}
                onChange={(e) => setRideSeats(Number(e.target.value))}
                aria-label="Places disponibles"
                className="min-h-11 rounded-lg border border-card-border bg-background px-2 text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} pl.
                  </option>
                ))}
              </select>
              <input
                value={rideDetail}
                onChange={(e) => setRideDetail(e.target.value)}
                placeholder="Ex : retour Pau, départ 3h, mairie"
                className="min-w-0 flex-1 rounded-lg border border-card-border bg-background px-3 text-sm"
              />
            </div>
            <button
              onClick={publishRide}
              className="mt-2 w-full rounded-lg bg-festa-navy py-2.5 text-sm font-bold text-white"
            >
              Proposer le trajet
            </button>
          </div>
          <ul className="space-y-2">
            {rides.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl border border-card-border bg-card p-3">
                <span
                  className={`stamp shrink-0 ${
                    r.direction === "retour" ? "text-festa-red" : "text-festa-green"
                  }`}
                >
                  {r.direction}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{r.detail}</p>
                  <p className="text-xs text-muted">
                    {names[r.user_id] ?? "Festayre"}, {r.seats} place{r.seats > 1 ? "s" : ""}
                  </p>
                </div>
                {r.user_id === user.id && (
                  <button
                    onClick={async () => {
                      await supabase?.from("rides").delete().eq("id", r.id);
                      refresh();
                    }}
                    aria-label="Supprimer mon annonce"
                    className="flex h-11 w-11 items-center justify-center text-xs font-bold text-muted"
                  >
                    X
                  </button>
                )}
              </li>
            ))}
            {rides.length === 0 && (
              <p className="p-4 text-center text-sm text-muted">
                Aucun trajet. Propose le tien, le SAM te bénira.
              </p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
