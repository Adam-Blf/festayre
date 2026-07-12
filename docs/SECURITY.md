# Securite Festayre, etat production

Passe du 2026-07-11, basee sur la checklist officielle Supabase
(going-into-prod) et les checklists communautaires Next.js + Supabase.
Chaque ligne est VERIFIEE, pas déclarative.

## Fait et verifie

| Controle | Etat | Preuve |
|----------|------|--------|
| RLS active sur 100 % des tables public | OK | requete pg_class : 0 table sans RLS |
| service_role uniquement cote serveur | OK | utilisee dans le webhook Stripe seulement, jamais NEXT_PUBLIC |
| Webhook Stripe signe | OK | constructEvent + secret env, 400 si signature invalide |
| Prix cote serveur | OK | Price ID en env, le client ne peut pas envoyer un montant |
| Majorite verifiee EN BASE | OK | contrainte check birthdate <= now() - 18 ans |
| Instagram revele au match uniquement | OK | policy RLS avec double exists sur likes |
| Messages restreints aux matchs | OK | policy insert avec verification match cote base |
| Photos : ecriture limitee au dossier {user_id}/ | OK | policies storage.objects sur foldername |
| Listing du bucket avatars bloque | OK | lint 0025 corrige (migration 0005) |
| SSL force sur Postgres | OK | ssl-enforcement appliedSuccessfully:true |
| Advisors Supabase securite | OK* | listing bucket corrige (0005), reste 1 WARN hors de portee (voir compromis) |
| CSP liste blanche + HSTS 2 ans | OK | next.config.ts, headers globaux |
| Anti-clickjacking, nosniff, referrer, permissions | OK | next.config.ts |
| Secrets hors git | OK | .env* gitignore + patterns defense en profondeur |
| Degradation gracieuse sans cles | OK | mode invite complet |
| Preuve E2E des policies (15 checks dont 4 negatifs) | OK | scripts/e2e_community.mjs, 15/15 le 2026-07-12 |
| Sync Festayre+ : gating d'achat en base | OK | scripts/e2e_sync.mjs, 6/6 dont refus sans achat |

## Compromis assumes (a re-evaluer)

- **Confirmation email desactivee** (mailer_autoconfirm) : choix UX
  feria (inscription en 10 s sur place). Consequence : une adresse
  peut etre usurpee a l'inscription. A reactiver si abus.
- **CSP avec 'unsafe-inline' scripts** : requis par l'hydratation
  Next sans nonce. Mitigation : connect-src en liste blanche stricte.
- **Age visible des profils** : la date de naissance est lisible par
  tout utilisateur connecte (l'age affiche est un choix produit type
  app de rencontre). Si besoin : deplacer birthdate dans une table a
  RLS proprietaire et exposer l'age via une vue.
- **Protection mots de passe compromis (HaveIBeenPwned)** : reserve
  au plan Pro Supabase, non activable sur le plan free. Mitigation :
  longueur minimale 8 imposee cote Supabase.
- **Pas de moderation photo automatique** : v1. Prevoir un bouton de
  signalement + revue manuelle, ou un scan automatise si le volume
  monte.

## Process de mise en prod (reproductible)

1. `npm test` et `npm run build` verts.
2. PR vers main, merge apres CI.
3. Migrations SQL appliquees AVANT le deploiement du code qui les
   utilise (ordre : base puis app).
4. `npx vercel deploy --prod`, verifier status Ready + curl de la prod.
5. Verifier les advisors Supabase apres toute migration :
   `GET /v1/projects/{ref}/advisors/security`.
6. Cles compromises (collees dans un chat, un log) : rotation
   immediate (Supabase account tokens, Stripe apikeys).

## Sources

- https://supabase.com/docs/guides/deployment/going-into-prod
- https://supabase.com/docs/guides/database/database-linter
- Checklists communautaires Next.js + Supabase (checkvibe.dev,
  unicoconnect.com, 2026)
