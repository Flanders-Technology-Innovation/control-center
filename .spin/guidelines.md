# cyantula platform guidelines

This app runs on **cyantula**, your company's internal app platform. Follow these rules so it
builds, runs, and stays secure on the platform.

> This file is maintained by cyantula (do not edit by hand — cyantula overwrites it when the
> guidelines are updated). Put your own project notes in `CLAUDE.md` instead.

## Authentication & the current user
- Every visitor is already signed in with their company Google account before the request
  reaches this app. Do **not** build your own login, sessions, or password storage in production.
- Identify the user from the HTTP headers cyantula injects on every request:
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

## Pages that must work without sign-in (public paths)
- By default **every** path needs sign-in, so an anonymous visitor — or another service calling in —
  reaches the sign-in screen, never this app. cyantula can serve **individual path prefixes** without
  sign-in, sub-paths included: open `/public` and `/public/logo.png` is open too.
- So anything that has to answer publicly **stays in this app**: a page shared with an external
  partner, a webhook another service POSTs to, an RSS/iCal feed, a status endpoint, an image an
  email or a link preview has to load. **Never** move such a file to an external host, a public
  bucket or an image hosting service to get around sign-in.
- Serve it under one obvious prefix (`/public/…`, `/webhooks/…`, `/share/…`, `/feed`),
  keep everything else outside it, and ask the owner to open that prefix in cyantula: the app's
  **Access** tab → *Public pages*. Nothing is public until they say so — cyantula suggests prefixes that
  look public after a deploy, so a well-named prefix is usually one click.
- Assets a public page loads (images, CSS, JS, fonts) must sit under a public prefix too, or the
  page renders broken for anonymous visitors.
- Write those routes as if nobody is signed in: no `X-Spin-User-*` headers arrive, only
  `X-Spin-Public: 1` and `X-Spin-Env` — guard every identity read. A webhook receiver must
  verify its sender itself (signature/HMAC); the gateway does not authenticate anonymous calls.
  Never put admin or data-changing routes under a public prefix, and remember public paths open on
  the **production** address only.

## This app's own URL
- cyantula publishes every app on its own subdomain, so the app's public address lives in cyantula, not in
  the code. It is injected as `SPIN_APP_URL` (no trailing slash), together with `SPIN_APP_HOST`,
  `SPIN_APP_SLUG`, `SPIN_APP_NAME` and `SPIN_PORTAL_URL` (cyantula itself).
- Use `SPIN_APP_URL` for everything that leaves the app — links inside emails it sends, absolute
  URLs in exports, redirects back to itself, callback URLs, "copy link" buttons, canonical tags.
  **Never hardcode a host** and never build one from the `Host` header. Inside the app's own pages,
  keep using relative URLs.
- These variables are cyantula's to set: read them from the environment, do not add them to the app's
  configuration in cyantula. In local development they are absent — fall back to the local address and
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

## Other tools (MCP servers)
- Any tool the organisation published as an **MCP server** (Jira, HubSpot, Notion, Google Drive, ...)
  reaches this app through cyantula's proxy. For each server the owner declared on the app's
  **All integrations** tab, cyantula injects `SPIN_MCP_<KEY>_URL` (say `SPIN_MCP_ATLASSIAN_URL`) and
  `SPIN_MCP_SERVERS` (JSON: `[{key, url, upstream, account}]`). Call `url` with any MCP client that
  speaks Streamable HTTP (JSON-RPC over POST), never the real server directly while the variable is set.
- Send cyantula's bearer, not the tool's: for a server on **each visitor's own account**, forward the
  request's `X-Spin-Mcp-Token` as `Authorization: Bearer …` (it names this visitor and lives an hour;
  read it fresh per request); for one on the **company account** use `SPIN_API_TOKEN`. Do **not** run an
  OAuth flow against the tool, store a token, or build a "connect your account" screen: colleagues
  authorise once in their cyantula profile, and the proxy never answers an upstream problem with a 401.
- Read `tools/list` at startup instead of assuming which tools exist (an admin may have limited them),
  and handle the proxy's JSON-RPC errors by `error.data.reason`: `not_connected` and
  `connection_broken` carry a `connectUrl` to show the visitor; `tool_denied`, `server_disabled`,
  `upstream_unreachable` and `upstream_error` are not retried blindly.
- Never print, log, store or send `X-Spin-Mcp-Token` to the browser; cyantula checks every commit
  for it. In local development the `SPIN_MCP_*` variables are absent: call the real server
  (`upstream`) with its own OAuth flow, or read a `SPIN_DEV_MCP_<KEY>_TOKEN` you pasted, and keep
  that path out of production.

## Sending email
- If the owner switched **email** on for this app, cyantula sends mail on the app's behalf: it owns the
  provider account and the verified sending domain. Never add Resend/SendGrid/SMTP/nodemailer and
  never ask for an email API key.
- `POST {SPIN_API_URL}/api/spin/email` with `Authorization: Bearer {SPIN_API_TOKEN}` (both env
  vars are injected by cyantula) and a JSON body: `to` (string or array), `subject`, `html` and/or
  `text`, optionally `from`, `cc`, `bcc`, `replyTo`, `attachments` and `onBehalfOf`.
- Link back into the app from the mail with `SPIN_APP_URL` (see *This app's own URL*) — a mail
  whose links point at localhost is the classic way this goes wrong.
- The sender's local part is yours to pick (default `SPIN_EMAIL_FROM`); the **domain is fixed** by
  the platform (`SPIN_EMAIL_DOMAIN`) and any other domain is rejected. Recipients are limited to
  company addresses unless a cyantula admin allowed external ones, and there is a daily quota per app.
- Call it **server-side only** — never expose `SPIN_API_TOKEN` to the browser. In local development
  the variables are absent: log the message instead of sending, so the app still runs offline.

## Calling an LLM
- If the owner switched **AI** on for this app, cyantula makes model calls on the app's behalf: it owns
  the provider account and the key. Never add `@anthropic-ai/sdk`, `openai`, `langchain` or any
  other model client library, never add an `ANTHROPIC_API_KEY`, and never ask the owner for one.
- `POST {SPIN_AI_URL}` with `Authorization: Bearer {SPIN_API_TOKEN}` (both env vars are injected
  by cyantula) and a JSON body: `prompt` (or `messages`, a `[{role, content}]` conversation starting
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
- **The one exception to "no SDK, no key":** an app running on **each user's own key** whose owner
  also switched on **Hand the key to the app**. Then — and only then — the visitor's own Anthropic
  credential arrives on every request as `X-Spin-Ai-Kind`, `X-Spin-Ai-Token`, `X-Spin-Ai-Headers`
  (the exact request headers, as JSON) and `X-Spin-Ai-Api-Url` (or as `integrations.ai` from the
  OAuth userinfo endpoint), and the app may call Anthropic directly on that visitor's account —
  server-side only, read fresh per request, never logged, stored or sent to the browser. The app's
  "For your AI agent" prompt in cyantula carries the contract; `ai.keyForwarded` from
  `GET {SPIN_API_URL}/api/spin/whoami` says whether it applies.
- Call it **server-side only** — never expose `SPIN_API_TOKEN` to the browser. In local development
  the variables are absent: return a canned answer, so the app still runs offline.

## Scheduled work (cron)
- Never ship a scheduler in the app — no node-cron, node-schedule, APScheduler, celery beat or
  setInterval loops. The container restarts on every deploy and forgets everything it knew.
- Recurring work (a weekly report, a nightly cleanup) is a **cyantula scheduled task**: the owner puts
  a cron schedule on the app in cyantula (the app's cron tab, or over MCP), and cyantula POSTs to the
  app's own `/api/cron/<name>` at those times. Implement the route, do the work, answer **2xx**
  (or `202` right away for long work and continue in the background) — anything else is recorded
  as a failed run and notifies the owner.
- Calls carry `X-Spin-Cron: <name>` (require it — that alone keeps stray visitors out, since the
  gateway strips inbound `X-Spin-*` headers) plus an `X-Spin-Cron-Signature` JWT to verify with
  `SPIN_APP_SECRET` if the app wants proof. There is no signed-in user on a scheduled run.
- Make handlers safe to run twice ("already sent today?") — the owner can press "Run now" at any
  time. In local development nothing fires; trigger the route with `curl -X POST`.

## Sharing data between apps
- Apps can never reach each other directly — cyantula forwards app-to-app calls, and only when the
  providing app's owner granted the calling app access in cyantula (Data sharing tab).
- **Reading another app's data:** call `{SPIN_API_URL}/api/spin/data/<their-slug>/<path>` with
  `Authorization: Bearer {SPIN_API_TOKEN}` (env vars injected on the next deploy after the grant),
  server-side only. The `<path>` lands on the other app's `/api/shared/<path>`. A response marked
  with the `x-spin-gateway-error` header is cyantula itself (403 grant revoked, 503 app down, 429 slow
  down); treat everything else as the other app's answer. In local development the variables are
  absent — return stub data.
- **Exposing data to other apps:** serve it only under `/api/shared/…`; nothing else is reachable
  app-to-app. The caller arrives as `X-Spin-Consumer-App-Slug`/`-Id`/`-Name` headers (plus a
  signed `X-Spin-Consumer-Identity` JWT) — authorize on the slug. Forwarded calls carry **no**
  `X-Spin-User-*` headers; this app's own signed-in users can still hit `/api/shared/` from the
  browser, so check whichever header the endpoint expects. Answer JSON within 30 s, under 10 MB.

## Serving
- Listen on `0.0.0.0` (not `localhost`) and read the port from the `PORT` env var.
- Do not add HTTPS/TLS handling — cyantula terminates TLS in front of the app.
- Start with no interactive steps: install dependencies, build, then run.

## Icon (favicon)
- **Every app ships a favicon.** cyantula reads it after each deploy and uses it as the app's icon on
  its catalog card and app page, so an app without one shows up as a bare letter.
- If the owner gave you a logo or icon, use that. **If they did not, design one yourself**: a simple
  SVG (`favicon.svg`, square `viewBox`, one bold shape or a letter on a solid background in the
  app's accent colour, readable at 16px) that says what the app is about. Also add a 180×180 PNG as
  `apple-touch-icon` when the toolchain can produce one.
- Declare it in the `<head>` of every page with `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
  and make sure the *server* answers `/favicon.ico` or the declared path with the image, not with an
  SPA's index page. Keep it small (well under 1 MB) and served from the app itself, never a CDN.
- An icon the owner uploads in cyantula always wins: the gateway shows it as the favicon when the app is
  opened, whatever the app declares. Do not fight that from code.

## Health endpoint (uptime monitoring)
- Serve `GET /healthz` from the app's own server: **200** with a small JSON body (e.g.
  `{"ok":true}`) when the app can do its job, **503** when a critical dependency is broken
  (database unreachable, a required service gone). cyantula detects the endpoint on deploy and probes
  it about once a minute — that answer *is* the app's Status tab, its uptime numbers, and what
  opens an incident that mails the owner.
- Without it cyantula can only probe `/`, which says "something is listening" — a broken app behind a
  page that still renders looks healthy. `/healthz` lets the app say so itself.
- Keep it fast and boring: check what the app depends on, nothing more. No auth (cyantula probes it
  directly, without a signed-in user), no LLM calls, no writes. In an SPA, make sure the *server*
  answers `/healthz` — an index-page fallback for unknown routes is not a health check.

## Long jobs and redeploys (the deploy gate)
- A deploy is invisible to visitors but not to this app: the container that was serving is
  **stopped** once the new one answers. A request takes milliseconds and never notices; a job that
  runs for minutes — an import, an export, a batch of model calls — is simply lost, along with
  whatever it had not written yet.
- So say so. Serve `GET /deployz`: **200** `{"ready":true}` when a redeploy would cost nothing, and
  `{"ready":false,"reason":"importing 4,120 contacts (~6 min left)","retryAfterSeconds":120}` while
  something must not be interrupted. cyantula asks before every redeploy, **postpones** the deploy while
  the answer is false, asks again, and goes live the moment it flips — the owner sees the `reason`
  word for word, so write it for a person.
- Answer **ready whenever you are not sure**, and base "busy" on real state (jobs in flight, a row,
  a Redis key), never on the time of day. An app that answers busy by accident stops receiving its
  own new versions. No auth, no LLM call, no writes — cyantula probes it directly, like `/healthz`.
- **Work outside the web process** (a worker, a queue) cannot answer a request: report instead.
  `POST {SPIN_API_URL}/api/spin/deploy-hold` with `{"busy":true,"reason":"…","holdForSeconds":600}`
  when the job starts and `{"busy":false}` when it ends. A hold is a **lease** that expires by
  itself, so a crash cannot block deploys for ever — re-post while the work runs, release in a
  `finally`, and never rely on it as a lock.
- `GET {SPIN_API_URL}/api/spin/deploy-hold` says whether a deploy is waiting for this app. Read it
  before starting a long job, and let the job be the last one for now when it is — that is how the
  new version lands in minutes instead of at the end of the lease.
- None of this replaces writing work that can be interrupted. Checkpoint long jobs (record what is
  already done, make a re-run resume rather than restart): the gate buys the current job time to
  finish, it does not promise the app will never be stopped.

## Configuration & secrets
- Read all secrets/config from environment variables. Never hardcode them.
- Keep an up-to-date `.env.example` at the repo root listing every variable (no real values);
  cyantula reads it to ask the owner for values and injects them at runtime.

## Data & persistence (the container is wiped on every deploy)
- **PostgreSQL is the default database on cyantula.** If this app stores data, use Postgres unless there
  is a concrete reason not to — it is the engine cyantula runs, backs up and supports. Do not reach for
  SQLite, MySQL, MongoDB or a JSON file on disk "because it is simpler": on this platform Postgres is
  the simple option, because cyantula creates the database for you.
- Never run your own database in the app or its Dockerfile, and never add a database service to a
  `docker-compose.yml` for production. cyantula runs one shared Postgres server and gives this app
  **its own database, its own user and its own password** on it, then injects the connection string
  as `DATABASE_URL` at deploy time. Read it from the environment:
  `const pool = new Pool({ connectionString: process.env.DATABASE_URL })`.
- Because every app has its own credentials and its own database, **never hardcode a database name,
  user, password, host or port**, and never assume another app's data is reachable — it is not.
- **Sensitive personal data: keep as little as the job needs.** A national register number (rijksregisternummer),
  health or care data, religion or origin, grades: store only what the app really uses, never ship it to the
  browser in bulk, and never export it to a file anyone can download. Never commit real people's data, not
  even in a fixture or a seed: make up numbers that fail the check digit. cyantula reads every deploy for such
  fields and numbers, shows the owner and the admins, and may leave opening such an app to outsiders to an admin.
- **No Supabase, Firebase or other hosted backend.** Their database, sign-in and file storage live on
  somebody's own account, outside cyantula's backups and out of reach the day that person leaves. Use
  `DATABASE_URL` for data, the `X-Spin-User-*` headers for who is signed in (cyantula already signs
  people in), and a persistent folder for files. cyantula flags an app that uses Supabase and offers to
  move it.
- Locally, run your own Postgres (e.g. `docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:17-alpine`)
  and put its URL in `.env`. Keep the same schema/migrations locally and in production.
- **Qdrant is the default vector database on cyantula.** If this app stores embeddings — semantic
  search, RAG, recommendations — use Qdrant rather than embedding a vector store in the container
  (Chroma, FAISS on disk, LanceDB: all wiped on the next deploy) or reaching for a hosted one. cyantula
  runs one shared Qdrant server and injects `QDRANT_URL`, `QDRANT_API_KEY` and
  `QDRANT_COLLECTION_PREFIX`. That prefix is this app's namespace: **start every collection name
  with it** — what the code calls `documents` is created as
  `${process.env.QDRANT_COLLECTION_PREFIX}documents`. Never hardcode a bare collection name; that
  is how two apps end up in each other's vectors.
- Other engines are available when the app genuinely needs them (MySQL/MariaDB, MongoDB, Redis) — cyantula
  injects `DATABASE_URL`, `MONGODB_URI` or `REDIS_URL` the same way. On redis the keyspace is
  shared, so cyantula also injects `REDIS_PREFIX`: prefix **every** key with it.
- For files that must persist (uploads, generated output), write them under **one stable absolute
  path** and say which path, so cyantula can mount a durable volume there. Treat caches, tmp, and build
  output as disposable.
- A credentials file the app needs but may not commit (a service-account JSON, a certificate) is
  **uploaded by the owner** on the app's Environment tab and mounted read-only where they say. Read
  its path from an env var and fail loudly when it is missing — never commit one, never invent a
  placeholder, and never write to one.
- Never hardcode absolute paths from a developer's machine; derive paths from a base directory or env var.

## Going live (git)
- The owner does not use git — the AI agent handles 100% of it.
- First version: commit and push to `main`. After that: create a branch, open a pull request to
  `main`, and merge it once the app builds and runs.
- cyantula never auto-deploys; the owner clicks **Deploy** in cyantula to go live, so pushing and merging
  is always safe and never disturbs the live app.
