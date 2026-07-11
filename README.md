# Festayre

<!-- adam-badges:start -->
[![commits](https://img.shields.io/github/commit-activity/t/Adam-Blf/festayre?color=001329&label=commits&style=flat-square)](https://github.com/Adam-Blf/festayre/commits)
[![visites](https://hits.sh/github.com/Adam-Blf/festayre.svg?style=flat-square&label=visites&color=001329)](https://hits.sh/github.com/Adam-Blf/festayre/)
[![last commit](https://img.shields.io/github/last-commit/Adam-Blf/festayre?color=D4A437&style=flat-square&label=dernier%20push)](https://github.com/Adam-Blf/festayre/commits)
[![top language](https://img.shields.io/github/languages/top/Adam-Blf/festayre?style=flat-square)](https://github.com/Adam-Blf/festayre)
[![license](https://img.shields.io/github/license/Adam-Blf/festayre?style=flat-square&color=D4A437)](LICENSE)
<!-- adam-badges:end -->

![version](https://img.shields.io/badge/version-0.6.0-15274b?style=flat-square)
![brand](https://img.shields.io/badge/brand-navy%20%2315274b%20rouge%20%23b80c1d-15274b?style=flat-square)
![stack](https://img.shields.io/badge/Next.js%2016-TypeScript-black?style=flat-square)
![pwa](https://img.shields.io/badge/PWA-installable-C8102E?style=flat-square)

**Les ferias, directement dans votre poche.**

PWA de survie pour toutes les ferias du Sud-Ouest : Bayonne, Dax,
Mont-de-Marsan, Vic-Fezensac, Orthez, Hagetmau, Parentis, Aire-sur-l'Adour,
et San Fermin en bonus.

## Features

- [x] Selecteur multi-ferias avec statut (en ce moment / J-x / terminee)
- [x] Carte temps reel (Leaflet + OpenStreetMap) centree sur toi
- [x] Toilettes les plus proches, triees par distance a pied
- [x] Alcool le moins cher : supermarches avant epiceries de depannage
- [x] Points d'eau gratuits, pharmacies, arrets de bus et navettes
- [x] Programme indicatif par feria + lien officiel
- [x] Meteo + risque de pluie 6h (Open-Meteo)
- [x] Infos bracelets d'entree et navettes par feria
- [x] Numeros d'urgence en un tap
- [x] Checklist de survie a cocher (persistee en local)
- [x] Carte QR Instagram a faire scanner
- [x] PWA installable + mode hors ligne (service worker)
- [x] Point de RDV du groupe epingle sur la carte + partage en un tap
- [x] Mode SAM : groupe, partage de position, alerte SMS discrete
- [x] Passeport ferias : tampons geolocalises, badges, defis photos
- [x] Coins d'ombre (parcs) sur la carte
- [x] Communaute par feria (compte requis) : rencontres avec Instagram
      revele au match uniquement (RLS), messagerie interne reservee aux
      matchs (policy d'insertion verifiee cote base), fil de bons plans,
      covoiturage
- [x] Comptes par lien magique (Supabase) et pack soutien Festayre+ (Stripe)
- [x] Analytics PostHog (UE) et monitoring Sentry, actifs si cles presentes

## Marque

Logo officiel : pin de localisation navy `#15274b` au foulard rouge
`#b80c1d`, wordmark FESTAYRE en police **Badger** (fichiers
`public/logo.png`, `public/wordmark.png`, `public/logo-lockup.png`,
sources SVG `public/logo.svg` et `public/logo-full.svg`). Fond
applicatif blanc pur en mode clair. Icones PWA et favicon regeneres depuis la marque
via `python scripts/gen_icons.py`. Typo : Anton (titres, style affiche
de feria) + Archivo (texte).

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind 4 + framer-motion,
Leaflet / react-leaflet, Supabase (auth + Postgres RLS), Stripe Checkout,
PostHog, Sentry, Vitest. APIs sans cle : Overpass (OpenStreetMap),
Open-Meteo, tuiles OSM.

## Demarrage

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # tests unitaires (geo + parsing Overpass)
npm run build      # build de production
```

L'app fonctionne SANS aucune variable d'environnement (mode invite :
carte, toilettes, programme). Pour activer comptes, paiement et
observabilite, copier `.env.example` vers `.env.local` et remplir :

| Service | Ou recuperer les cles |
|---------|----------------------|
| Supabase | https://supabase.com/dashboard, projet, Settings, API |
| Stripe | https://dashboard.stripe.com/apikeys et /webhooks |
| PostHog | https://eu.posthog.com, Settings, Project API key |
| Sentry | https://sentry.io, Settings, Projects, Client Keys (DSN) |

Puis appliquer les migrations SQL : `supabase/migrations/0001_init.sql`
`0002` a `0005` (SQL Editor Supabase, ou
`supabase db push`).

## Architecture

Code range par domaine metier dans `src/features/` :
`ferias` (referentiel + selection), `pois` (toilettes, alcool, bus via
Overpass), `map` (Leaflet + geolocalisation), `program`, `weather`,
`checklist`, `account` (Supabase + Stripe), `qr`.
Detail dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Securite

- Row Level Security sur toutes les tables (chacun ne lit que ses donnees)
- Webhook Stripe verifie par signature, activation Festayre+ uniquement la
- Cles secretes serveur uniquement, `.env*` gitignore
- Headers securite globaux (frame deny, nosniff, permissions policy)
- La position GPS ne quitte jamais le telephone

## Changelog

Voir [docs/CHANGELOG.md](docs/CHANGELOG.md).

## Production et securite

Etat verifie, compromis assumes et process de mise en prod :
[docs/SECURITY.md](docs/SECURITY.md).

## Licence

MIT, voir [LICENSE](LICENSE).
