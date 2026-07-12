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
  first_name: string | null;
  city: string | null;
  birthdate: string | null;
  gender: string | null;
  looking_for: string | null;
  photo_path: string | null;
};

/** Age revolu depuis une date ISO, null si non renseignee. */
function ageFrom(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age -= 1;
  return age;
}

type Post = { id: string; user_id: string; content: string; created_at: string };
type Ride = {
  id: string;
  user_id: string;
  direction: "aller" | "retour";
  detail: string;
  seats: number;
};

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
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
  // Conversation ouverte (user_id du match) + messages + brouillon.
  const [chatWith, setChatWith] = useState<{ id: string; name: string } | null>(null);
  // Non-lus par expediteur : { user_id: nombre de messages non lus }.
  const [unreadBySender, setUnreadBySender] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatText, setChatText] = useState("");
  // Signalement en cours : cible + raison choisie.
  const [reporting, setReporting] = useState<{ type: "profile" | "post"; id: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [rides, setRides] = useState<Ride[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  // Formulaires.
  const [formName, setFormName] = useState("");
  const [formFirst, setFormFirst] = useState("");
  const [formLast, setFormLast] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formBirth, setFormBirth] = useState("");
  const [formGender, setFormGender] = useState("");
  const [formLooking, setFormLooking] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formInsta, setFormInsta] = useState("");
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
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
      .select("user_id, display_name, bio, is_adult, first_name, city, birthdate, gender, looking_for, photo_path")
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
        .select("user_id, display_name, bio, is_adult, first_name, city, birthdate, gender, looking_for, photo_path")
        .eq("is_adult", true)
        .eq("hidden", false)
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

  /* ---- Messagerie interne (matchs uniquement) ----------------------- */

  /** Recompte les messages non lus, groupes par expediteur. */
  const refreshUnread = useCallback(async () => {
    if (!supabase || !user) return;
    const { data } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("recipient_id", user.id)
      .is("read_at", null);
    const counts: Record<string, number> = {};
    for (const m of data ?? []) {
      counts[m.sender_id as string] = (counts[m.sender_id as string] ?? 0) + 1;
    }
    setUnreadBySender(counts);
  }, [supabase, user]);

  useEffect(() => {
    refreshUnread();
    // Rafraichissement leger en arriere-plan (30 s).
    const timer = setInterval(refreshUnread, 30000);
    return () => clearInterval(timer);
  }, [refreshUnread]);

  const loadMessages = useCallback(async () => {
    if (!supabase || !user || !chatWith) return;
    // La RLS ne renvoie que les messages dont on fait partie : le
    // filtre or() ne sert qu'a isoler CETTE conversation.
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, content, created_at")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${chatWith.id}),` +
          `and(sender_id.eq.${chatWith.id},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages((data ?? []) as Message[]);

    // Tout ce que l'autre m'a envoye est desormais lu. Le trigger SQL
    // garantit que seul read_at peut changer.
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", user.id)
      .eq("sender_id", chatWith.id)
      .is("read_at", null);
    refreshUnread();
  }, [supabase, user, chatWith, refreshUnread]);

  // Polling leger tant que la conversation est ouverte (8 s, suffisant
  // pour une messagerie de feria, economise la batterie).
  useEffect(() => {
    if (!chatWith) return;
    loadMessages();
    const timer = setInterval(loadMessages, 8000);
    return () => clearInterval(timer);
  }, [chatWith, loadMessages]);

  const sendMessage = async () => {
    if (!supabase || !user || !chatWith || !chatText.trim()) return;
    // La policy messages_insert_matched refuse cote base tout envoi
    // hors match : pas besoin de re-verifier ici.
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: chatWith.id,
      content: chatText.trim(),
    });
    if (error) {
      setStatus("Envoi refusé (le match existe toujours ?).");
    } else {
      setChatText("");
      loadMessages();
    }
  };

  /* ---- Actions ------------------------------------------------------ */

  const saveProfile = async () => {
    if (!supabase || !user) return;
    if (!formAdult) {
      setStatus("La communauté Festayre est réservée aux majeurs.");
      return;
    }
    const age = ageFrom(formBirth);
    if (age === null || age < 18) {
      setStatus("Date de naissance requise, 18 ans minimum.");
      return;
    }

    // Photo d'abord : la policy Storage impose le dossier {user_id}/,
    // un client modifie ne peut pas ecrire ailleurs.
    let photoPath: string | null = myProfile?.photo_path ?? null;
    if (formPhoto) {
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, formPhoto, { upsert: true, contentType: formPhoto.type });
      if (upErr) {
        setStatus("Photo refusée (format image attendu).");
        return;
      }
      photoPath = path;
    }

    const { error } = await supabase.from("community_profiles").upsert({
      user_id: user.id,
      display_name: formName.trim(),
      first_name: formFirst.trim() || null,
      last_name: formLast.trim() || null,
      city: formCity.trim() || null,
      birthdate: formBirth,
      gender: formGender || null,
      looking_for: formLooking || null,
      bio: formBio.trim() || null,
      photo_path: photoPath,
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
        first_name: formFirst.trim() || null,
        city: formCity.trim() || null,
        birthdate: formBirth,
        gender: formGender || null,
        looking_for: formLooking || null,
        photo_path: null,
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

  /** Envoie un signalement (1 max par cible, contrainte unique). */
  const submitReport = async () => {
    if (!supabase || !user || !reporting || !reportReason) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: reporting.type,
      target_id: reporting.id,
      reason: reportReason,
    });
    setStatus(
      error
        ? "Déjà signalé (un signalement par personne et par cible)."
        : "Signalement envoyé, merci. 3 signalements distincts masquent un profil."
    );
    setReporting(null);
    setReportReason("");
    refresh();
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

  /** URL publique d'une photo de profil (bucket avatars public). */
  const photoUrl = (path: string | null) =>
    path && supabase
      ? supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl
      : null;

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
          <div className="flex gap-2">
            <input
              value={formFirst}
              onChange={(e) => setFormFirst(e.target.value)}
              placeholder="Prénom"
              autoComplete="given-name"
              className="min-h-11 w-1/2 rounded-lg border border-card-border bg-background px-3 text-sm"
            />
            <input
              value={formLast}
              onChange={(e) => setFormLast(e.target.value)}
              placeholder="Nom"
              autoComplete="family-name"
              className="min-h-11 w-1/2 rounded-lg border border-card-border bg-background px-3 text-sm"
            />
          </div>
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Pseudo (visible par tous)"
            className="min-h-11 w-full rounded-lg border border-card-border bg-background px-3 text-sm"
          />
          <div className="flex gap-2">
            <input
              value={formCity}
              onChange={(e) => setFormCity(e.target.value)}
              placeholder="Ville"
              autoComplete="address-level2"
              className="min-h-11 w-1/2 rounded-lg border border-card-border bg-background px-3 text-sm"
            />
            <input
              type="date"
              value={formBirth}
              onChange={(e) => setFormBirth(e.target.value)}
              aria-label="Date de naissance"
              className="min-h-11 w-1/2 rounded-lg border border-card-border bg-background px-3 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={formGender}
              onChange={(e) => setFormGender(e.target.value)}
              aria-label="Genre"
              className="min-h-11 w-1/2 rounded-lg border border-card-border bg-background px-2 text-sm"
            >
              <option value="">Genre (optionnel)</option>
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
              <option value="autre">Autre</option>
            </select>
            <select
              value={formLooking}
              onChange={(e) => setFormLooking(e.target.value)}
              aria-label="Recherche"
              className="min-h-11 w-1/2 rounded-lg border border-card-border bg-background px-2 text-sm"
            >
              <option value="">Recherche (optionnel)</option>
              <option value="femme">Femmes</option>
              <option value="homme">Hommes</option>
              <option value="peu importe">Peu importe</option>
            </select>
          </div>
          <label className="block text-xs font-semibold text-muted">
            Photo de profil
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormPhoto(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-xs"
            />
          </label>
          <input
            value={formBio}
            onChange={(e) => setFormBio(e.target.value)}
            placeholder="Bio courte (optionnel)"
            className="min-h-11 w-full rounded-lg border border-card-border bg-background px-3 text-sm"
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
        ).map(([id, label]) => {
          const totalUnread = Object.values(unreadBySender).reduce((a, b) => a + b, 0);
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative min-h-11 flex-1 rounded-lg ${
                tab === id ? "bg-festa-red text-white" : "text-muted"
              }`}
            >
              {label}
              {id === "rencontres" && totalUnread > 0 && (
                <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-festa-red px-1 text-[10px] font-bold text-white ring-2 ring-card">
                  {totalUnread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {status && (
        <p role="status" className="text-center text-xs text-muted">
          {status}
        </p>
      )}

      {/* Mini-formulaire de signalement. */}
      {reporting && (
        <div className="rounded-xl border border-festa-red/40 bg-festa-red/5 p-3">
          <p className="text-sm font-bold">Signaler ce {reporting.type === "profile" ? "profil" : "message"}</p>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            aria-label="Raison du signalement"
            className="mt-2 min-h-11 w-full rounded-lg border border-card-border bg-card px-2 text-sm"
          >
            <option value="">Choisir une raison</option>
            <option value="photo inappropriee">Photo inappropriée</option>
            <option value="faux profil">Faux profil</option>
            <option value="harcelement">Harcèlement</option>
            <option value="personne mineure">Personne mineure</option>
            <option value="autre">Autre</option>
          </select>
          <div className="mt-2 flex gap-2">
            <button
              onClick={submitReport}
              disabled={!reportReason}
              className="min-h-11 flex-1 rounded-lg bg-festa-red text-xs font-bold text-white disabled:opacity-50"
            >
              Envoyer le signalement
            </button>
            <button
              onClick={() => setReporting(null)}
              className="min-h-11 flex-1 rounded-lg border border-card-border text-xs font-bold"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ---- Conversation ouverte (remplace l'onglet) ---- */}
      {chatWith && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setChatWith(null)}
              aria-label="Fermer la conversation"
              className="-ml-2 flex h-11 w-11 items-center justify-center text-2xl font-bold"
            >
              {"<"}
            </button>
            <h3 className="display text-lg text-festa-red">{chatWith.name}</h3>
          </div>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto rounded-xl border border-card-border bg-card p-3">
            {messages.map((m) => (
              <p
                key={m.id}
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  m.sender_id === user.id
                    ? "ml-auto bg-festa-red text-white"
                    : "bg-background"
                }`}
              >
                {m.content}
              </p>
            ))}
            {messages.length === 0 && (
              <p className="p-4 text-center text-xs text-muted">
                C'est un match. À toi d'ouvrir le bal.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              maxLength={500}
              placeholder="Ton message..."
              className="min-h-11 flex-1 rounded-lg border border-card-border bg-card px-3 text-sm"
            />
            <button
              onClick={sendMessage}
              className="min-h-11 rounded-lg bg-festa-red px-4 text-sm font-bold text-white"
            >
              Envoyer
            </button>
          </div>
        </div>
      )}

      {/* ---- Rencontres ---- */}
      {!chatWith && tab === "rencontres" && (
        <div className="space-y-4">
          {matches.length > 0 && (
            <section className="rounded-xl border border-festa-green bg-festa-green/5 p-4">
              <h3 className="display text-base text-festa-green">Matchs</h3>
              <ul className="mt-2 space-y-2">
                {matches.map(({ profile, instagram }) => (
                  <li key={profile.user_id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {profile.display_name}
                    </span>
                    <button
                      onClick={() =>
                        setChatWith({ id: profile.user_id, name: profile.display_name })
                      }
                      className="relative flex min-h-11 items-center rounded-full bg-festa-navy px-4 text-xs font-bold text-white"
                    >
                      Messages
                      {(unreadBySender[profile.user_id] ?? 0) > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-festa-red px-1 text-[10px] font-bold text-white">
                          {unreadBySender[profile.user_id]}
                        </span>
                      )}
                    </button>
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
                {photoUrl(p.photo_path) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photoUrl(p.photo_path)!}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-full border border-card-border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-festa-navy/10 text-lg font-bold text-festa-navy">
                    {(p.first_name ?? p.display_name).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {p.first_name ?? p.display_name}
                    {ageFrom(p.birthdate) !== null && (
                      <span className="font-normal text-muted">, {ageFrom(p.birthdate)} ans</span>
                    )}
                  </p>
                  {p.city && <p className="text-xs text-muted">{p.city}</p>}
                  {p.bio && <p className="truncate text-xs text-muted">{p.bio}</p>}
                </div>
                <button
                  onClick={() => setReporting({ type: "profile", id: p.user_id })}
                  aria-label={`Signaler ${p.display_name}`}
                  className="flex h-11 w-8 shrink-0 items-center justify-center text-xs font-bold text-muted"
                >
                  !
                </button>
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
      {!chatWith && tab === "fil" && (
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
              <li key={p.id} className="flex items-start gap-2 rounded-xl border border-card-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-festa-red">
                    {names[p.user_id] ?? "Festayre"}
                  </p>
                  <p className="mt-0.5 text-sm">{p.content}</p>
                </div>
                <button
                  onClick={() => setReporting({ type: "post", id: p.id })}
                  aria-label="Signaler ce message"
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold text-muted"
                >
                  !
                </button>
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
      {!chatWith && tab === "covoit" && (
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
