# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [0.14.0] - 2026-10-09

### Changed

- Buttons say what the visitor gets (onboarding, account, community entry), see `docs/boutons.md`. Fill text and button borders now meet 4.5:1 and 3:1 in light and dark themes (new `on-fill` and `edge` tokens).
- chore(env): prefix shared keys with `FESTAYRE` so every key is unique across projects (`NEXT_PUBLIC_FESTAYRE_SUPABASE_URL`, `NEXT_PUBLIC_FESTAYRE_SUPABASE_ANON_KEY`, `FESTAYRE_SUPABASE_SERVICE_ROLE_KEY`, `FESTAYRE_STRIPE_SECRET_KEY`, `FESTAYRE_STRIPE_WEBHOOK_SECRET`), and load the central secrets file `~/.secrets/projets.env` (or `CENTRAL_ENV_FILE`) in local dev from `next.config.ts` and the e2e scripts (`scripts/load-env.mjs`).

## [0.13.1] - 2026-10-07

First tagged release. Latest changes:

- docs: add colors to mermaid diagrams (#21)
- test: production http smoke suite, 25 checks (#19)
- docs: typography pass, no em dash or middle dot (#18)
- feat(group): live position sharing with secret code groups (#17)
- feat(community): lost and found board, carpool contact field (#16)
- feat(moderation): reports with auto-hide at 3 distinct reporters (#15)
- feat(plus): cross-device sync for passport and checklist, rls purchase gating (#14)
- feat(i18n): fr es en core survival ui with typed dictionary (#13)
- docs: add mermaid architecture diagram to README (#12)
- feat(sam): hydration tracker with 2h overdue alert (#11)
- feat(messages): read status, unread badges, content tamper trigger (#10)
- test: e2e community flow against live supabase, 12 checks (#9)
- feat: password auth, dating profiles, screens, prod security v0.6.0 (#8)
- feat: onboarding + white brand v0.5.0 (#7)
- fix(db): create likes before contacts match policy (#6)
