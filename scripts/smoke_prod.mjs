/**
 * smoke_prod.mjs, smoke test HTTP de la production.
 *
 * Verifie sans navigateur :
 *  - chaque route repond 200 et contient son marqueur de contenu,
 *  - les headers de securite (CSP, HSTS, nosniff) sont presents,
 *  - le manifeste PWA et le service worker sont servis,
 *  - les icones PWA existent.
 *
 * Usage : node scripts/smoke_prod.mjs [url]
 * (defaut : https://festayre.vercel.app)
 */
const BASE = process.argv[2] ?? "https://festayre.vercel.app";

let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "OK " : "FAIL"} ${label}${detail ? ", " + detail : ""}`);
  if (!ok) failures += 1;
};

/** Routes HTML et le texte qui prouve que la bonne page est rendue. */
const PAGES = [
  ["/", "dans votre poche"],
  ["/feria/bayonne", "Fêtes de Bayonne"],
  ["/feria/dax", "Fêtes de Dax"],
  ["/groupe", "Mon groupe"],
  ["/communaute", "Communauté"],
  ["/compte", "Mon compte"],
  ["/carte", "Ma carte"],
  ["/checklist", "Checklist"],
  ["/sam", "Mode SAM"],
  ["/passeport", "Passeport"],
  ["/bienvenue", "Bienvenue"],
  ["/reglages", "Réglages"],
  ["/confidentialite", "Confidentialité"],
  ["/mentions", "Mentions légales"],
  ["/offline", "Hors ligne"],
];

async function main() {
  for (const [path, marker] of PAGES) {
    try {
      const res = await fetch(BASE + path);
      const html = await res.text();
      check(`GET ${path}`, res.status === 200 && html.includes(marker),
        res.status !== 200 ? `HTTP ${res.status}` : html.includes(marker) ? "" : "marqueur absent");
    } catch (e) {
      check(`GET ${path}`, false, e.message);
    }
  }

  // Headers de securite sur la racine.
  const home = await fetch(BASE + "/");
  check("header CSP", Boolean(home.headers.get("content-security-policy")));
  check("header HSTS", Boolean(home.headers.get("strict-transport-security")));
  check("header nosniff", home.headers.get("x-content-type-options") === "nosniff");

  // PWA : manifeste, service worker, icones.
  const manifest = await fetch(BASE + "/manifest.webmanifest");
  const mJson = await manifest.json().catch(() => null);
  check("manifest PWA", manifest.status === 200 && mJson?.name?.includes("Festayre"));
  const sw = await fetch(BASE + "/sw.js");
  check("service worker servi", sw.status === 200 && (await sw.text()).includes("CACHE_VERSION"));
  for (const icon of ["/icons/icon-192.png", "/icons/icon-512.png", "/logo.png", "/logo-lockup.png"]) {
    const r = await fetch(BASE + icon);
    check(`asset ${icon}`, r.status === 200);
  }

  // Une route inconnue doit servir la 404 maison.
  const notFound = await fetch(BASE + "/nimportequoi-e2e");
  check("404 maison", notFound.status === 404 && (await notFound.text()).includes("Perdu"));

  console.log(failures === 0 ? "\nSMOKE PROD : TOUT VERT" : `\nSMOKE PROD : ${failures} echec(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Smoke crash :", e.message);
  process.exit(1);
});
