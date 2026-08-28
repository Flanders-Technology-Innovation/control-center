# Changelog

## Unreleased

- Fixed every write behind the company gateway being refused as a cross-site request, which stopped Control Center from opening with "The first-run workspace could not be initialized." The same-origin check rebuilt the request origin from the request URL, which keeps the container's internal port that no browser ever sees; it now compares against the app's public address (`SPIN_APP_URL`) and the forwarded host, and tolerates a gateway that does not send `X-Forwarded-Proto`.
- Made the startup failure screen and the workspace save error repeat the reason the server gave, so a refused request is no longer reported as a local-data problem to investigate with `npm run doctor`.

## 0.3.1 - 2026-08-25

- Added persistent dark mode with a saved theme preference.
- Added Google OAuth client ID validation and clearer setup guidance to prevent account email addresses from being entered as client IDs.
- Added durable response snapshots for Industry, Mentions, and Newsletters so tab navigation opens saved results instead of rerunning collectors.
- Made Industry, Mention, and Newsletter archive actions update both SQLite and the saved response atomically, eliminating the post-archive collection delay.
- Added a direct Mention-to-Reminder action.
- Rebuilt Newsletters as an AI-required intelligence pipeline that reads unseen Gmail issues, extracts actual news, filters utility/promotional content, resolves safe public redirects, and combines duplicate coverage into stable topics with source and Gmail evidence links. Newsletter text goes only to the selected provider with tracking links and email addresses masked; raw bodies are not stored locally.
- Added schema-v5 migration backups plus normalized newsletter issue/mention tables and collector snapshots.

## 0.3.0 - 2026-08-25

- Split Industry into a broad raw-discovery store and a bounded importance queue, with canonical/title/event deduplication, configurable exclusions, source diversity, scoring reasons, and a default 30-update daily target.
- Added optional provider-selectable OpenAI, Anthropic, or Gemini background intelligence with private server-side keys, environment-key support, model overrides, two-hour caching, and deterministic fallback behavior.
- Expanded Mentions beyond news feeds with optional broad-web research, while requiring independently fetched canonical-page evidence, preserving strict namesake filtering, supporting negative contexts, and excluding owned sites by default.
- Changed Audience growth from the previous hourly refresh to a true 24–36 hour comparison, retaining one anchor per 12-hour bucket and safely migrating legacy snapshot files.
- Added schema-v4 migration backups and a separate SQLite table for raw Industry discoveries so surfaced history and user archive state remain durable.
- Updated first-run, backup, security, diagnostics, UI, and portable-install documentation for the new generic curation model.

## 0.2.1 - 2026-08-25

- Split automatically expired Industry history from items a user manually archived, added deterministic newest/oldest/watched-site sorting across the complete active set, and stopped stale or undated feed backlogs from appearing as new discoveries.
- Improved generic RSS/Atom and sitemap discovery, accepted valid empty feeds, exposed partial failures instead of false live status, and removed silent result caps that could hide current Industry or Mention items.
- Tightened seven-day mention matching so provider query terms never count as observed evidence, configured handles remain exact identities, and ambiguous names require configured corroboration in strict mode.
- Persisted follower and subscriber changes between successful audience checks, kept the comparison tied to the same primary metric, and separated post, video, and thread counts as content metadata.
- Made corrupt Audience history fail closed and visible in `npm run doctor` instead of silently replacing a verified baseline.
- Added immutable dated completion records for repeating tasks, guarded against double completion, preserved monthly schedule anchors, and made task writes immediately recoverable after a reload or process interruption.
- Kept fresh clones isolated from another checkout's browser state while retaining a safe migration path for existing repo-local installs.
- Pinned public-source requests to the DNS addresses that passed network validation, revalidated every redirect, and applied the same protection to LinkedIn profile checks.
- Expanded cross-platform production smoke coverage for personalized-data-free first runs, every live dashboard area, and the documented one-command launcher.

## 0.2.0 - 2026-08-25

- Added a one-command local launcher with health wait, browser opening, rebuild detection, and single-instance protection.
- Moved fresh-install data to stable per-user operating-system directories while preserving existing repo-local installs.
- Added fail-closed startup, ordered workspace saves, visible persistence errors, SQLite schema versioning, and serialized settings/token writes.
- Added a local request boundary, production smoke test, diagnostics, and consistent private backups.
- Hardened public-source network validation, Windows-safe atomic snapshots, private backup permissions, and cross-platform CI pinning.
- Added a provider-neutral Daily Brief bridge for user-approved Codex connectors, local scripts, and Today/Week action overviews.
- Added authoritative per-source Daily Brief syncs with empty-run health, failure reporting, source-scoped IDs, privacy cleanup, and bounded Week filtering.
- Made task/reminder corruption fail closed and fixed Unicode Daily Brief migrations plus future Today/Week event windows.
- Improved first-run deep links, live-load error handling, audience duplicate protection, valid profile examples, and configurable Gmail newsletter search.
- Hardened Industry, Mentions, and Audience collectors for feed/sitemap fallbacks, strict identity, archive deduplication, and public-account attribution.

## 0.1.0 - 2026-08-21

- Initial local Control Center dashboard and settings-driven collectors.
