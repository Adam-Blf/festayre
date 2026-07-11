# Architecture Festayre

## Principe directeur

Code range par DOMAINE METIER, pas par type technique. Un dossier de
`src/features/` = un besoin du festayre. La logique pure (calculs,
parsing) est separee des composants React pour etre testable sans DOM.

```
src/
  app/                    Routes Next.js (App Router)
    page.tsx              Accueil : choisir sa feria
    feria/[id]/           Ecran principal : carte, liste, programme, infos
    checklist/            Checklist de survie
    compte/               Compte + Festayre+
    carte/                Carte QR Instagram
    offline/              Fallback hors ligne du service worker
    api/checkout/         Creation session Stripe (serveur)
    api/stripe/webhook/   Activation Festayre+ apres paiement (serveur)
    manifest.ts           Manifeste PWA
  features/
    ferias/               Referentiel des ferias (dates, GPS, programme)
    pois/                 POI Overpass : toilettes, alcool, eau, bus, sante
    map/                  Carte Leaflet + hook geolocalisation
    program/              Affichage programme
    weather/              Open-Meteo
    checklist/            Checklist localStorage
    account/              Clients Supabase (navigateur + serveur) + UI compte
  lib/
    geo.ts                Haversine, formatage distance, tri (pur, teste)
    version.ts            Version unique depuis package.json
  components/             Transverse : service worker, analytics
public/sw.js              Service worker (network-first HTML, SWR donnees)
supabase/migrations/      Schema SQL + policies RLS
scripts/gen_icons.py      Generation des icones PWA depuis la geometrie logo
```

## Flux de donnees

1. `useGeolocation` suit la position (locale uniquement, jamais envoyee).
2. `fetchPois` interroge Overpass (2 miroirs, bascule auto) une fois par
   feria, `parseOverpassResponse` normalise en categories metier.
3. `sortByDistance` retrie a chaque deplacement de l'utilisateur.
4. Le tri alcool applique la regle prix d'abord (supermarche 1, cave 2,
   depannage 3), distance ensuite.

## Decisions notables (mini ADR)

- **Overpass plutot qu'une base maison** : donnees toilettes/commerces
  deja maintenues par la communaute OSM, zero backend a entretenir.
- **CircleMarker plutot qu'icones images Leaflet** : evite les problemes
  d'assets, lisible, leger.
- **Paiement active par webhook uniquement** : la redirection success
  n'est pas une preuve de paiement.
- **Tout degradable** : sans cle env, l'app reste 100 % utilisable en
  mode invite. Une feria ne attend pas une config.
- **localStorage pour la checklist** : donnee triviale, offline-first,
  la sync compte est une evolution Festayre+.
