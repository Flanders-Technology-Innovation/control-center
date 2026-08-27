# spin platform guidelines

This app runs on **spin**, elli's internal app platform. Follow these rules so it
builds, runs, and stays secure on the platform.

> This file is maintained by spin (do not edit by hand — spin overwrites it when the
> guidelines are updated). Put your own project notes in `CLAUDE.md` instead.

## Authentication & the current user
- Every visitor is already signed in with their company Google account before the request
  reaches this app. Do **not** build your own login, sessions, or password storage in production.
- Identify the user from the HTTP headers spin injects on every request:
  `X-Spin-User-Email` (stable id), `X-Spin-User-Id`, `X-Spin-User-Name`,
  `X-Spin-User-First-Name`, `X-Spin-User-Last-Name`, `X-Spin-User-Role`.
  The name headers are percent-encoded UTF-8 — decode them before displaying.
- The user's personal profile also rides along on every request: `X-Spin-User-Picture`
  (avatar URL), `X-Spin-User-Job-Title`, `X-Spin-User-Department`, `X-Spin-User-Phone`,
  `X-Spin-User-Location`. Any of these may be empty; the text ones are percent-encoded
  UTF-8 like the name headers. Use them instead of asking the user to fill in a profile again.
- For team-based authorization, read `X-Spin-User-Groups`: a comma-separated list of the
  user's group names, **lowercased** and each percent-encoded. Split on "," and
  `decodeURIComponent` each entry (the header is empty when the user is in no groups). Compare
  against lowercase group names. Use it to gate features by team.
- In local development these headers are absent; fall back to a dummy user, overridable
  via the `SPIN_DEV_USER` env var (JSON).
- For sensitive actions, optionally verify `X-Spin-Identity` (an HS256 JWT signed with
  the `SPIN_APP_SECRET` env var).

## This app's own URL
- spin publishes every app on its own subdomain, so the app's public address lives in spin, not in
  the code. It is injected as `SPIN_APP_URL` (no trailing slash), together with `SPIN_APP_HOST`,
  `SPIN_APP_SLUG`, `SPIN_APP_NAME` and `SPIN_PORTAL_URL` (spin itself).
- Use `SPIN_APP_URL` for everything that leaves the app — links inside emails it sends, absolute
  URLs in exports, redirects back to itself, callback URLs, "copy link" buttons, canonical tags.
  **Never hardcode a host** and never build one from the `Host` header. Inside the app's own pages,
  keep using relative URLs.
- These variables are spin's to set: read them from the environment, do not add them to the app's
  configuration in spin. In local development they are absent — fall back to the local address and
  list `SPIN_APP_URL` in `.env.example` with an empty value.

## This app may be running more than once
- If its owner switched on a **dev address**, the same code also runs at `<slug>--dev`, with its
  own container and its own empty database, redeploying on every commit so a change can be looked
  at before it goes live. `SPIN_APP_URL` is already that copy's own address, so links keep working.
- `SPIN_ENV` says which copy this is: `production`, or the environment name (`dev`). The same
  value is on every request as `X-Spin-Env`. In local development `SPIN_ENV` is absent — treat
  that as "not production".
- Use it where a copy should not behave identically: label the UI so a preview is never mistaken
  for the real thing, seed sample data instead of waiting for real data, and think twice before
  doing something outward-facing and irreversible (mailing colleagues, calling a third-party API
  that writes) from a non-production copy.
- Do **not** use it to change what the app *is*. Both copies run with the same configuration on
  purpose: the dev copy is a rehearsal, and a rehearsal that runs different code proves nothing.
- Per request the same address is also available as `X-Forwarded-Host` / `X-Forwarded-Proto`, but
  prefer the env var: background jobs and scheduled email have no request to read a header from.

## Atlassian (Jira & Confluence)
- If the owner marked this app as **requiring Atlassian** in spin, every request also carries the
  visitor's own Atlassian credentials: `X-Spin-Atlassian-Site-Url`, `X-Spin-Atlassian-Email`,
  `X-Spin-Atlassian-Api-Token`, and a ready-made `X-Spin-Atlassian-Authorization` (Basic) value.
  Call `{siteUrl}/rest/api/3/...` (Jira) or `{siteUrl}/wiki/rest/api/...` (Confluence) with it,
  server-side only. Do **not** build your own Atlassian OAuth flow or "connect your account"
  screen, and never store or log the token.
- In local development those headers are absent; fall back to a `SPIN_DEV_ATLASSIAN` env var
  (JSON: `{"siteUrl":...,"email":...,"apiToken":...}`) so the app is testable with your own token.

## HubSpot
- If the owner marked this app as **requiring HubSpot** in spin, every request also carries a
  valid token for the visitor's own HubSpot account: `X-Spin-Hubspot-Api-Base-Url`
  (https://api.hubapi.com), `X-Spin-Hubspot-Access-Token`, a ready-made
  `X-Spin-Hubspot-Authorization` (`Bearer …`) value, and `X-Spin-Hubspot-Portal-Id`. Call
  `{baseUrl}/crm/v3/...` with it, server-side only. Do **not** build your own HubSpot OAuth flow
  or "connect your account" screen, and never store or log the token.
- The token is **opaque and can be short-lived**: users connect with a personal access key, a
  service key, or spin's own HubSpot OAuth app, and spin renews expiring credentials itself — read
  the token fresh from the headers on every request, and don't assume the `pat-…` shape. A 403
  from HubSpot means the connection is missing a scope — say which scope the call needs (the user
  can connect a key that has it, e.g. a service key) rather than failing silently.
- In local development those headers are absent; fall back to a `SPIN_DEV_HUBSPOT` env var
  (listed in `.env.example` with an empty value) so the app stays testable. It must be a bearer
  token: create a **service key** in HubSpot (Settings → Integrations → Service Keys) with exactly
  the scopes the app calls and put its `pat-…` value in `.env` — a personal access key does not
  work there (it is not a bearer token; only spin can use those).
## Sending email
- If the owner switched **email** on for this app, spin sends mail on the app's behalf: it owns the
  provider account and the verified sending domain. Never add Resend/SendGrid/SMTP/nodemailer and
  never ask for an email API key.
- `POST {SPIN_API_URL}/api/spin/email` with `Authorization: Bearer {SPIN_API_TOKEN}` (both env
  vars are injected by spin) and a JSON body: `to` (string or array), `subject`, `html` and/or
  `text`, optionally `from`, `cc`, `bcc`, `replyTo`, `attachments` and `onBehalfOf`.
- Link back into the app from the mail with `SPIN_APP_URL` (see *This app's own URL*) — a mail
  whose links point at localhost is the classic way this goes wrong.
- The sender's local part is yours to pick (default `SPIN_EMAIL_FROM`); the **domain is fixed** by
  the platform (`SPIN_EMAIL_DOMAIN`) and any other domain is rejected. Recipients are limited to
  company addresses unless a spin admin allowed external ones, and there is a daily quota per app.
- Call it **server-side only** — never expose `SPIN_API_TOKEN` to the browser. In local development
  the variables are absent: log the message instead of sending, so the app still runs offline.

## Calling an LLM
- If the owner switched **AI** on for this app, spin makes model calls on the app's behalf: it owns
  the provider account and the key. Never add `@anthropic-ai/sdk`, `openai`, `langchain` or any
  other model client library, never add an `ANTHROPIC_API_KEY`, and never ask the owner for one.
- `POST {SPIN_AI_URL}` with `Authorization: Bearer {SPIN_API_TOKEN}` (both env vars are injected
  by spin) and a JSON body: `prompt` (or `messages`, a `[{role, content}]` conversation starting
  with the user), optionally `system`, `model`, `maxTokens`, `thinking`, `effort`,
  `jsonSchema`, `purpose` and `onBehalfOf`. The answer is `{ text, model, stopReason, usage,
  quota }` — and `json` too when you sent a `jsonSchema`.
- **Want structured data? Send `jsonSchema`.** Do not ask the model to "reply with JSON only" and
  then parse `text` — that fails the day it adds a sentence in front.
- **Every call costs real money and is metered per app.** `usage` says what this call cost and
  `quota` what is left of the app's rolling 24h token budget — log both, and do less as
  `tokensRemaining` shrinks. Never call the model in an unbounded loop over rows, on every page
  load, or for anything ordinary code does perfectly well; cache what doesn't change.
- Model calls take seconds. Run them in a background job or a request the user knows is working —
  never in a health check, a page render, or while holding a database transaction open.
- Always set `purpose` (a short stable label) and set `onBehalfOf` when a user's action caused
  the call: together they make the owner's cost report answerable. Never put a credential, token or
  password into a prompt.
- Call it **server-side only** — never expose `SPIN_API_TOKEN` to the browser. In local development
  the variables are absent: return a canned answer, so the app still runs offline.

## Scheduled work (cron)
- Never ship a scheduler in the app — no node-cron, node-schedule, APScheduler, celery beat or
  setInterval loops. The container restarts on every deploy and forgets everything it knew.
- Recurring work (a weekly report, a nightly cleanup) is a **spin scheduled task**: the owner puts
  a cron schedule on the app in spin (the app's cron tab, or over MCP), and spin POSTs to the
  app's own `/api/cron/<name>` at those times. Implement the route, do the work, answer **2xx**
  (or `202` right away for long work and continue in the background) — anything else is recorded
  as a failed run and notifies the owner.
- Calls carry `X-Spin-Cron: <name>` (require it — that alone keeps stray visitors out, since the
  gateway strips inbound `X-Spin-*` headers) plus an `X-Spin-Cron-Signature` JWT to verify with
  `SPIN_APP_SECRET` if the app wants proof. There is no signed-in user on a scheduled run.
- Make handlers safe to run twice ("already sent today?") — the owner can press "Run now" at any
  time. In local development nothing fires; trigger the route with `curl -X POST`.

## Sharing data between apps
- Apps can never reach each other directly — spin forwards app-to-app calls, and only when the
  providing app's owner granted the calling app access in spin (Data sharing tab).
- **Reading another app's data:** call `{SPIN_API_URL}/api/spin/data/<their-slug>/<path>` with
  `Authorization: Bearer {SPIN_API_TOKEN}` (env vars injected on the next deploy after the grant),
  server-side only. The `<path>` lands on the other app's `/api/shared/<path>`. A response marked
  with the `x-spin-gateway-error` header is spin itself (403 grant revoked, 503 app down, 429 slow
  down); treat everything else as the other app's answer. In local development the variables are
  absent — return stub data.
- **Exposing data to other apps:** serve it only under `/api/shared/…`; nothing else is reachable
  app-to-app. The caller arrives as `X-Spin-Consumer-App-Slug`/`-Id`/`-Name` headers (plus a
  signed `X-Spin-Consumer-Identity` JWT) — authorize on the slug. Forwarded calls carry **no**
  `X-Spin-User-*` headers; this app's own signed-in users can still hit `/api/shared/` from the
  browser, so check whichever header the endpoint expects. Answer JSON within 30 s, under 10 MB.

## Serving
- Listen on `0.0.0.0` (not `localhost`) and read the port from the `PORT` env var.
- Do not add HTTPS/TLS handling — spin terminates TLS in front of the app.
- Start with no interactive steps: install dependencies, build, then run.

## Health endpoint (uptime monitoring)
- Serve `GET /healthz` from the app's own server: **200** with a small JSON body (e.g.
  `{"ok":true}`) when the app can do its job, **503** when a critical dependency is broken
  (database unreachable, a required service gone). spin detects the endpoint on deploy and probes
  it about once a minute — that answer *is* the app's Status tab, its uptime numbers, and what
  opens an incident that mails the owner.
- Without it spin can only probe `/`, which says "something is listening" — a broken app behind a
  page that still renders looks healthy. `/healthz` lets the app say so itself.
- Keep it fast and boring: check what the app depends on, nothing more. No auth (spin probes it
  directly, without a signed-in user), no LLM calls, no writes. In an SPA, make sure the *server*
  answers `/healthz` — an index-page fallback for unknown routes is not a health check.

## Configuration & secrets
- Read all secrets/config from environment variables. Never hardcode them.
- Keep an up-to-date `.env.example` at the repo root listing every variable (no real values);
  spin reads it to ask the owner for values and injects them at runtime.

## Data & persistence (the container is wiped on every deploy)
- **PostgreSQL is the default database on spin.** If this app stores data, use Postgres unless there
  is a concrete reason not to — it is the engine spin runs, backs up and supports. Do not reach for
  SQLite, MySQL, MongoDB or a JSON file on disk "because it is simpler": on this platform Postgres is
  the simple option, because spin creates the database for you.
- Never run your own database in the app or its Dockerfile, and never add a database service to a
  `docker-compose.yml` for production. spin runs one shared Postgres server and gives this app
  **its own database, its own user and its own password** on it, then injects the connection string
  as `DATABASE_URL` at deploy time. Read it from the environment:
  `const pool = new Pool({ connectionString: process.env.DATABASE_URL })`.
- Because every app has its own credentials and its own database, **never hardcode a database name,
  user, password, host or port**, and never assume another app's data is reachable — it is not.
- Locally, run your own Postgres (e.g. `docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:17-alpine`)
  and put its URL in `.env`. Keep the same schema/migrations locally and in production.
- Other engines are available when the app genuinely needs them (MySQL/MariaDB, MongoDB, Redis) — spin
  injects `DATABASE_URL`, `MONGODB_URI` or `REDIS_URL` the same way. On redis the keyspace is
  shared, so spin also injects `REDIS_PREFIX`: prefix **every** key with it.
- For files that must persist (uploads, generated output), write them under **one stable absolute
  path** and say which path, so spin can mount a durable volume there. Treat caches, tmp, and build
  output as disposable.
- Never hardcode absolute paths from a developer's machine; derive paths from a base directory or env var.

## Going live (git)
- The owner does not use git — the AI agent handles 100% of it.
- First version: commit and push to `main`. After that: create a branch, open a pull request to
  `main`, and merge it once the app builds and runs.
- spin never auto-deploys; the owner clicks **Deploy** in spin to go live, so pushing and merging
  is always safe and never disturbs the live app.
