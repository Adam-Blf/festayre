/**
 * e2e_sync.mjs, test de bout en bout de la sync Festayre+ sur le
 * VRAI projet Supabase (.env.local).
 *
 * Scenario :
 *  1. utilisateur SANS achat : ecriture user_sync -> REFUSEE (RLS),
 *  2. achat festayre_plus simule via service_role (comme le webhook),
 *  3. ecriture acceptee, relecture depuis une DEUXIEME session du
 *     meme compte (l'autre telephone) : donnees identiques,
 *  4. nettoyage complet.
 *
 * Usage : node scripts/e2e_sync.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
);

let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "OK " : "FAIL"} ${label}${detail ? ", " + detail : ""}`);
  if (!ok) failures += 1;
};

const stamp = Date.now();
const CREDS = { email: `e2e-sync-${stamp}@festayre-e2e.beloucif.com`, password: `E2e!${stamp}s` };

const phone1 = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const phone2 = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const { data: a, error } = await phone1.auth.signUp(CREDS);
  check("inscription", !error && Boolean(a.session));
  const uid = a.user.id;

  try {
    // 1. Sans achat : la RLS doit refuser l'ecriture.
    const { error: noPlus } = await phone1
      .from("user_sync")
      .upsert({ user_id: uid, passport: { stamps: { bayonne: "2026-07-15" } } });
    check("sync refusee sans Festayre+", Boolean(noPlus));

    // 2. Achat simule via service_role (voie normale : webhook Stripe).
    const { error: buyErr } = await admin.from("purchases").insert({
      user_id: uid,
      product: "festayre_plus",
      stripe_session_id: `cs_e2e_${stamp}`,
      amount_total: 299,
      currency: "eur",
    });
    check("achat festayre_plus simule", !buyErr, buyErr?.message);

    // 3. Ecriture acceptee, relecture depuis un deuxieme appareil.
    const payload = { stamps: { bayonne: "2026-07-15" }, challenges: { selfie: true } };
    const { error: pushErr } = await phone1
      .from("user_sync")
      .upsert({ user_id: uid, passport: payload, checklist: [{ id: "d0", checked: true }] });
    check("sync ecrite avec Festayre+", !pushErr, pushErr?.message);

    await phone2.auth.signInWithPassword(CREDS);
    const { data: pulled } = await phone2
      .from("user_sync").select("passport, checklist").eq("user_id", uid).single();
    check("passeport identique sur le 2e appareil", pulled?.passport?.stamps?.bayonne === "2026-07-15");
    check("checklist identique sur le 2e appareil", pulled?.checklist?.[0]?.checked === true);
  } finally {
    await admin.auth.admin.deleteUser(uid);
    console.log("nettoyage : compte e2e supprime");
  }

  console.log(failures === 0 ? "\nE2E SYNC : TOUT VERT" : `\nE2E SYNC : ${failures} echec(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("E2E crash :", e.message);
  process.exit(1);
});
