# Changelog Festayre

Format : [semver] - date - resume. Le detail vit dans l'historique git.

## [0.13.2] - 2026-07-13

- CI GitHub Actions : tests unitaires + build sur chaque PR et sur
  main (badge README). Les E2E restent des verifications locales
  pre-release (secrets Supabase requis).

## [0.13.1] - 2026-07-12

- Smoke test HTTP de la prod (scripts/smoke_prod.mjs) : 25 checks,
  15 routes avec marqueur de contenu, headers securite, manifeste,
  service worker, icones, 404 maison. Execute ce jour : 25/25 verts.

## [0.13.0] - 2026-07-12

- Position live du groupe (0010_groups.sql) : groupe ephemere a code
  secret 6 caracteres (alphabet sans ambiguite, dictable en bodega),
  membres avec distance et fraicheur sur /groupe, marqueurs sur la
  carte de chaque feria. Pointage toutes les 30 s quand l'app est
  ouverte, jamais en arriere-plan.
- Vie privee : opt-in explicite, visibilite limitee au groupe par RLS
  (fonction is_group_member security definer, anti-recursion),
  position supprimee au depart du groupe, politique de confidentialite
  mise a jour.
- E2E dedie scripts/e2e_group.mjs : 8/8 verts sur la prod, dont les 3
  checks negatifs du non-membre (ni lecture ni ecriture).

## [0.12.0] - 2026-07-12

- Objets perdus / trouves (0009_lost_found.sql) : tableau par feria,
  annonce perdu/trouve avec lieu et contact optionnels, resolution par
  l'auteur. Lecture reservee aux connectes, ecriture proprietaire.
- Covoiturage : champ contact optionnel sur les annonces (visibilite
  aux connectes rappelee dans le formulaire).
- E2E communaute : 22 verifications, 22/22 verts sur la prod.

## [0.11.0] - 2026-07-12

- Signalement des profils et des posts (0008_reports.sql) : un
  signalement max par cible (contrainte unique), raisons predefinies.
- Auto-moderation en base : 3 signaleurs DISTINCTS sur un profil le
  masquent automatiquement (trigger), sans intervention manuelle. La
  revue humaine passe par le dashboard (service_role).
- E2E communaute etendu a 19 verifications (doublon refuse, masquage
  auto, disparition du browse), 19/19 verts sur la prod.

## [0.10.0] - 2026-07-12

- Sync multi-appareils Festayre+ (0007_plus_sync.sql) : passeport
  (tampons + defis) et checklist suivent le compte, last-write-wins.
  Ecriture reservee aux acheteurs festayre_plus, verifiee par la RLS
  (policy avec exists sur purchases), lecture conservee apres
  desabonnement (RGPD). E2E dedie 6/6 verts sur la prod, dont le refus
  d'ecriture sans achat.

## [0.9.0] - 2026-07-12

- i18n FR / ES / EN sur le coeur touristique : onglets de la page
  feria, categories de POI, actions (Y aller, Partager, RDV), section
  urgences, tagline accueil. Selecteur de langue persistant (accueil
  + page feria). Dictionnaire type, test d'exhaustivite (aucune cle
  sans traduction). Perimetre assume : programmes et contenus
  editoriaux encore en francais.

## [0.8.0] - 2026-07-12

- Mode SAM : compteur d'hydratation. Bouton "tournee d'eau faite",
  temps ecoule depuis la derniere tournee, alerte visuelle passe 2 h
  (logique pure testee a la minute pres, 4 tests unitaires).

## [0.7.0] - 2026-07-12

- Messagerie : statut lu / non lu (0006_message_read.sql). Marquage lu
  a l'ouverture de la conversation, badges de non-lus par match et sur
  l'onglet Rencontres (rafraichissement 30 s).
- Securite : trigger SQL messages_protect_update, le destinataire ne
  peut modifier QUE read_at, toute alteration du contenu est rejetee.
- E2E etendu a 15 verifications (lu/non-lu + falsification bloquee),
  15/15 verts sur la prod.

## [0.6.1] - 2026-07-11

- Script E2E communaute (scripts/e2e_community.mjs) : 12 verifications
  sur le Supabase de prod, dont 3 negatives de securite (message avant
  match refuse par la RLS, Instagram cache avant match, profil mineur
  rejete par la contrainte SQL). Execute ce jour : 12/12 verts.
- Headers CSP + HSTS verifies presents en production.

## [0.6.0] - 2026-07-11

- Auth par mot de passe (inscription/connexion/reinitialisation),
  confirmation auto pour l'UX feria (compromis documente).
- Profil rencontre complet : prenom, nom, ville, date de naissance
  (majorite verifiee par contrainte SQL), genre, recherche, photo de
  profil (Supabase Storage, ecriture verrouillee au dossier user).
- Ecrans : reglages (effacement donnees locales), politique de
  confidentialite, mentions legales, 404 maison.
- Passe securite production (docs/SECURITY.md) : audit RLS complet,
  SSL force, lint bucket public corrige (0005), CSP liste blanche,
  HSTS. Sources : checklist officielle Supabase going-into-prod.

## [0.5.0] - 2026-07-11

- Onboarding premiere ouverture (/bienvenue) : 3 ecrans, creation de
  compte magic link proposee, jamais imposee ("Continuer sans compte").
- Fond blanc pur en mode clair (regle de marque), icones PWA et
  manifest regeneres sur fond blanc.
- Nouveaux assets de marque : wordmark FESTAYRE (police Badger, FEST
  navy / AYRE rouge) detoure + lockup vertical.
- Infra activee : projet Supabase "festayre" (eu-west-3) provisionne,
  3 migrations appliquees, auth configuree sur festayre.vercel.app.
  Stripe live : produit Festayre+ (2,99 EUR), webhook signe. Env vars
  Vercel production + preview.

## [0.4.0] - 2026-07-11

- Messagerie interne (/communaute) : conversation privee entre matchs
  UNIQUEMENT. La policy RLS d'insertion (0003_messages.sql) exige le
  like mutuel cote base : aucun message non sollicite possible, meme
  avec un client modifie. Polling 8 s, suppression de ses messages.

## [0.3.0] - 2026-07-11

- Point de RDV du groupe : epingle sur la carte (localStorage par
  feria), partage Web Share / presse-papier, marqueur navy dedie.
- Mode SAM (/sam) : contacts du groupe, partage de position, alerte
  SMS discrete avec lien GPS, rappels et urgences.
- Passeport ferias (/passeport) : tampon par feria via check-in
  geolocalise (< 3 km pendant les dates), badges par paliers, defis
  photos.
- Categorie "Ombre" sur la carte (parcs et jardins OSM).
- Pack communautaire (/communaute, compte requis, migration
  0002_community.sql) : rencontres par feria avec Instagram revele
  uniquement en cas de like mutuel (policy RLS dediee, pas de chat
  interne a moderer), fil de bons plans, covoiturage aller/retour.
  Profil declare 18+, suppression RGPD en un tap.
- MCP PostHog et Sentry ajoutes a la config Claude du projet.

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
