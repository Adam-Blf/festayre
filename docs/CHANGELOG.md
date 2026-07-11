# Changelog Festayre

Format : [semver] - date - resume. Le detail vit dans l'historique git.

## [0.2.0] - 2026-07-11

- Rebrand complet sur le logo officiel (pin de localisation navy
  #15274b + foulard rouge #b80c1d), icones PWA et favicon regeneres
  depuis la marque (`scripts/gen_icons.py`).
- Refonte design "affiche de feria" : typo Anton pour les titres,
  Archivo en body, cartes ferias transformees en billets d'entree
  (souche dates, perforation, tampon de statut).
- Dates 2026 corrigees depuis les sources officielles (Bayonne 15-19
  juillet, Madeleine 22-26 juillet, Dax 12-16 aout, Hagetmau 31
  juillet - 4 aout, Parentis 7-11 aout, etc.).
- Accents francais corriges sur toutes les chaines visibles.
- Accessibilite : touch targets >= 44 px (retour, onglets, filtres,
  boutons "Y aller"), chiffres tabulaires sur les distances.
- Nettoyage code mort : champ `accent`, `APP_NAME`, variable CSS
  `--festa-red-deep`.

## [0.1.1] - 2026-07-11

- Renommage du package en `festayre`.

## [0.1.0] - 2026-07-11

- Version initiale : multi-ferias, carte Leaflet + geolocalisation,
  toilettes, alcool le moins cher, eau, bus, pharmacies, programme,
  meteo, bracelets, urgences, checklist, carte QR Instagram, PWA
  offline, comptes Supabase + Stripe Festayre+, PostHog + Sentry.
