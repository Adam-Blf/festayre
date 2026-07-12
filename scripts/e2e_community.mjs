/**
 * e2e_community.mjs, test de bout en bout du parcours communaute sur
 * le VRAI projet Supabase (celui de .env.local).
 *
 * Scenario :
 *  1. inscription de 2 comptes email + mot de passe,
 *  2. creation des 2 profils rencontre (majeurs),
 *  3. SECURITE : message avant match -> doit etre REFUSE par la RLS,
 *  4. SECURITE : lecture du contact Instagram avant match -> vide,
 *  5. like mutuel sur la feria bayonne,
 *  6. le contact Instagram devient visible, le message passe,
 *  7. nettoyage complet (suppression des 2 comptes via service_role).
 *
 * Usage : node scripts/e2e_community.mjs
 * Aucun secret n'est affiche, tout vient de .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Lecture minimale de .env.local sans dependance dotenv.
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`${ok ? "OK " : "FAIL"} ${label}${detail ? ", " + detail : ""}`);
  if (!ok) failures += 1;
}

const stamp = Date.now();
const USERS = [
  { email: `e2e-a-${stamp}@festayre-e2e.beloucif.com`, password: `E2e!${stamp}a` },
  { email: `e2e-b-${stamp}@festayre-e2e.beloucif.com`, password: `E2e!${stamp}b` },
];

// Un client par utilisateur : chacun sa session, comme deux telephones.
const clientA = createClient(URL_, ANON, { auth: { persistSession: false } });
const clientB = createClient(URL_, ANON, { auth: { persistSession: false } });
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

async function main() {
  // 1. Inscriptions (autoconfirm actif : session immediate).
  const { data: a, error: ea } = await clientA.auth.signUp(USERS[0]);
  const { data: b, error: eb } = await clientB.auth.signUp(USERS[1]);
  check("inscription A", !ea && Boolean(a.session));
  check("inscription B", !eb && Boolean(b.session));
  if (!a.session || !b.session) throw new Error("signup KO, abandon");
  const idA = a.user.id;
  const idB = b.user.id;

  try {
    // 2. Profils (18+, contrainte SQL verifiee au passage).
    const { error: pa } = await clientA.from("community_profiles").insert({
      user_id: idA, display_name: "E2E Alice", first_name: "Alice",
      city: "Bayonne", birthdate: "2000-01-01", is_adult: true,
    });
    const { error: pb } = await clientB.from("community_profiles").insert({
      user_id: idB, display_name: "E2E Bob", first_name: "Bob",
      city: "Dax", birthdate: "1999-06-15", is_adult: true,
    });
    check("profil A", !pa, pa?.message);
    check("profil B", !pb, pb?.message);

    await clientA.from("profile_contacts").insert({ user_id: idA, instagram: "alice_e2e" });
    await clientB.from("profile_contacts").insert({ user_id: idB, instagram: "bob_e2e" });

    // 3. SECURITE : message sans match -> la RLS doit refuser.
    const { error: early } = await clientA.from("messages").insert({
      sender_id: idA, recipient_id: idB, content: "spam avant match",
    });
    check("message AVANT match refuse par la RLS", Boolean(early));

    // 4. SECURITE : contact de B invisible pour A avant match.
    const { data: hidden } = await clientA
      .from("profile_contacts").select("instagram").eq("user_id", idB);
    check("instagram cache avant match", (hidden ?? []).length === 0);

    // 5. Like mutuel sur bayonne.
    const { error: l1 } = await clientA.from("likes").insert({
      liker_id: idA, liked_id: idB, feria_id: "bayonne",
    });
    const { error: l2 } = await clientB.from("likes").insert({
      liker_id: idB, liked_id: idA, feria_id: "bayonne",
    });
    check("like A->B", !l1, l1?.message);
    check("like B->A", !l2, l2?.message);

    // 6. Match : contact revele + message accepte + lu par B.
    const { data: revealed } = await clientA
      .from("profile_contacts").select("instagram").eq("user_id", idB);
    check("instagram revele apres match", revealed?.[0]?.instagram === "bob_e2e");

    const { error: msgErr } = await clientA.from("messages").insert({
      sender_id: idA, recipient_id: idB, content: "On se retrouve aux bodegas ?",
    });
    check("message apres match accepte", !msgErr, msgErr?.message);

    const { data: inbox } = await clientB
      .from("messages").select("id, content, read_at").eq("recipient_id", idB);
    check("message recu par B", inbox?.[0]?.content?.includes("bodegas"));
    check("message non lu a la reception", inbox?.[0]?.read_at === null);

    // B marque lu : autorise. B modifie le contenu : bloque (trigger).
    const { error: readErr } = await clientB.from("messages")
      .update({ read_at: new Date().toISOString() }).eq("id", inbox[0].id);
    check("marquage lu par le destinataire", !readErr, readErr?.message);
    const { error: tamper } = await clientB.from("messages")
      .update({ content: "contenu falsifie" }).eq("id", inbox[0].id);
    check("falsification du contenu bloquee par le trigger", Boolean(tamper));

    // Signalements : anti-doublon puis auto-masquage a 3 distincts.
    const { error: r1 } = await clientA.from("reports").insert({
      reporter_id: idA, target_type: "profile", target_id: idB, reason: "faux profil",
    });
    check("signalement accepte", !r1, r1?.message);
    const { error: rDup } = await clientA.from("reports").insert({
      reporter_id: idA, target_type: "profile", target_id: idB, reason: "faux profil",
    });
    check("doublon de signalement refuse", Boolean(rDup));

    // Deux signaleurs supplementaires -> le profil B doit se masquer.
    const extras = [];
    for (const n of [1, 2]) {
      const cli = createClient(URL_, ANON, { auth: { persistSession: false } });
      const { data: u } = await cli.auth.signUp({
        email: `e2e-r${n}-${stamp}@festayre-e2e.beloucif.com`,
        password: `E2e!${stamp}r${n}`,
      });
      extras.push(u.user.id);
      await cli.from("reports").insert({
        reporter_id: u.user.id, target_type: "profile", target_id: idB, reason: "harcelement",
      });
    }
    const { data: bProfile } = await admin
      .from("community_profiles").select("hidden").eq("user_id", idB).single();
    check("profil masque apres 3 signaleurs distincts", bProfile?.hidden === true);
    const { data: browse } = await clientA
      .from("community_profiles").select("user_id").eq("hidden", false).neq("user_id", idA);
    check("profil masque absent du browse", !(browse ?? []).some((r) => r.user_id === idB));
    for (const id of extras) await admin.auth.admin.deleteUser(id);

    // Bonus : un profil mineur doit etre refuse par la contrainte SQL.
    const { error: minor } = await clientA.from("community_profiles")
      .update({ birthdate: "2015-01-01" }).eq("user_id", idA);
    check("profil mineur refuse par la contrainte SQL", Boolean(minor));
  } finally {
    // 7. Nettoyage : suppression des comptes (cascade sur toutes les
    //    tables via les FK on delete cascade).
    await admin.auth.admin.deleteUser(idA);
    await admin.auth.admin.deleteUser(idB);
    console.log("nettoyage : comptes e2e supprimes");
  }

  console.log(failures === 0 ? "\nE2E COMMUNAUTE : TOUT VERT" : `\nE2E : ${failures} echec(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("E2E crash :", e.message);
  process.exit(1);
});
