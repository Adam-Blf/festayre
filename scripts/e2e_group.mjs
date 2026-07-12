/**
 * e2e_group.mjs, test de bout en bout du groupe live sur le VRAI
 * projet Supabase (.env.local).
 *
 * Scenario :
 *  1. A cree un groupe (code), B le rejoint avec le code,
 *  2. A et B poussent leur position, chacun voit celle de l'autre,
 *  3. SECURITE : C (hors groupe) ne voit NI membres NI positions,
 *     et ne peut pas pousser de position dans le groupe,
 *  4. B quitte : sa position disparait,
 *  5. nettoyage complet.
 *
 * Usage : node scripts/e2e_group.mjs
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
const mk = (n) =>
  createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const clients = [mk(), mk(), mk()];
  const ids = [];
  for (const [i, cli] of clients.entries()) {
    const { data } = await cli.auth.signUp({
      email: `e2e-g${i}-${stamp}@festayre-e2e.beloucif.com`,
      password: `E2e!${stamp}g${i}`,
    });
    ids.push(data.user.id);
  }
  const [A, B, C] = clients;
  const [idA, idB] = ids;

  try {
    // 1. Creation + jonction par code.
    const code = "E2E" + String(stamp).slice(-3);
    const { data: g, error: gErr } = await A.from("groups")
      .insert({ code, name: "groupe e2e", created_by: idA })
      .select("id").single();
    check("groupe cree", !gErr, gErr?.message);
    await A.from("group_members").insert({ group_id: g.id, user_id: idA, display_name: "A" });

    const { data: found } = await B.from("groups").select("id").eq("code", code).maybeSingle();
    check("groupe trouve par code", Boolean(found));
    const { error: joinErr } = await B.from("group_members")
      .insert({ group_id: g.id, user_id: idB, display_name: "B" });
    check("B rejoint par code", !joinErr, joinErr?.message);

    // 2. Positions croisees.
    await A.from("group_positions").upsert({ group_id: g.id, user_id: idA, lat: 43.49, lng: -1.47 });
    await B.from("group_positions").upsert({ group_id: g.id, user_id: idB, lat: 43.4905, lng: -1.4755 });
    const { data: seenByA } = await A.from("group_positions").select("user_id").eq("group_id", g.id);
    check("A voit les 2 positions", (seenByA ?? []).length === 2);

    // 3. C, hors groupe : rien a voir, rien a ecrire.
    const { data: cMembers } = await C.from("group_members").select("user_id").eq("group_id", g.id);
    check("C ne voit pas les membres", (cMembers ?? []).length === 0);
    const { data: cPos } = await C.from("group_positions").select("user_id").eq("group_id", g.id);
    check("C ne voit pas les positions", (cPos ?? []).length === 0);
    const { error: cPush } = await C.from("group_positions")
      .upsert({ group_id: g.id, user_id: ids[2], lat: 0, lng: 0 });
    check("C ne peut pas pousser de position", Boolean(cPush));

    // 4. B quitte : position + adhesion supprimees.
    await B.from("group_positions").delete().eq("group_id", g.id).eq("user_id", idB);
    await B.from("group_members").delete().eq("group_id", g.id).eq("user_id", idB);
    const { data: after } = await A.from("group_positions").select("user_id").eq("group_id", g.id);
    check("position de B supprimee apres depart", (after ?? []).length === 1);
  } finally {
    for (const id of ids) await admin.auth.admin.deleteUser(id);
    console.log("nettoyage : comptes e2e supprimes");
  }

  console.log(failures === 0 ? "\nE2E GROUPE : TOUT VERT" : `\nE2E GROUPE : ${failures} echec(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("E2E crash :", e.message);
  process.exit(1);
});
