# Pesa Studio

> **The developer tooling layer Safaricom never shipped.**  
> Hosted callback capture, replay, and simulator for M-Pesa Daraja integrations.

**Codename:** Daraja OS Engine &nbsp;·&nbsp; **Brand:** Pesa Studio &nbsp;·&nbsp; **Version:** MVP 0.1  
**Live demo:** [pesastudio.vercel.app](https://pesastudio.vercel.app)

---

## The Story

Every M-Pesa developer in Kenya hits the same wall: Daraja sends a callback to your server, something goes wrong (network blip, local tunnel dropped, code bug), and the callback is **gone forever**. No retry, no logs, no way to debug. Safaricom's portal shows you nothing useful.

The idea was simple — build a hosted intermediary that sits between Daraja and your app:

1. **Capture everything.** Every POST Daraja sends hits Pesa Studio first.
2. **Show it live.** A real-time dashboard so you can see exactly what arrived, parsed.
3. **Forward it.** Tunnel the callback to your local machine while you develop.
4. **Replay it.** One click to re-fire any past callback — no more "I can't reproduce it."
5. **Simulate it.** Fire synthetic STK Push callbacks without touching real money or Safaricom's sandbox quotas.

We built this in a single session, going from zero to a working full-stack product.

---

## What's Working ✅

### Core Engine
- **Callback receiver** — `POST /api/callback/:apiKey` accepts all Daraja payload shapes (STK Push, B2C, C2B), parses them, extracts receipt number / amount / phone / result code, and stores to SQLite
- **Real-time SSE stream** — `GET /api/projects/:id/stream` broadcasts live events (`new-callback`, `callback-updated`, `reset`) to all connected dashboards via Server-Sent Events
- **Local forwarding** — every captured callback is immediately fire-and-forget POSTed to your configured local endpoint (e.g. `http://localhost:3000/webhook`) with a 5s timeout
- **Replay** — `POST /api/projects/:id/callbacks/:cid/replay` re-fires the exact original payload to your current local endpoint, increments `replayCount`, and broadcasts the update live
- **STK Push Simulator** — `POST /api/simulate/stk` fires a realistic synthetic callback (success / cancelled / timeout / insufficient funds) to any target URL with no real money involved
- **M-Pesa payload parser** — handles all three Daraja callback structures automatically

### Dashboard (`/dashboard`)
- Live feed of all incoming callbacks with slide-in animations
- Expandable rows — full JSON payload, receipt, phone (masked), result code + description
- Stats cards: total callbacks, success rate, replay count — all computed live from state
- Latency chart — real `forwardedAt - receivedAt` measurements from DB, auto-refreshed every 15s
- Copy callback URL button
- Local endpoint config (save with Enter or button)
- STK Push Simulator panel with 4 scenarios

### Settings (`/settings`)
- Live delivery rate, avg latency, total / success / failed counts from `/api/projects/:id/stats` (10s poll)
- Copy callback URL + API key (with reveal/hide toggle)
- Local endpoint management
- Environment toggle (Sandbox / Production) — cosmetic for now
- **Reset Project Data** — functional `DELETE /api/projects/:id/reset`, confirms before deleting, clears the live feed via SSE broadcast

### CLI Auth (`/cli/auth`)
- Real project list loaded from API
- Unique device code generated per session
- Platform detected from `navigator.userAgent`
- Authorize → redirects to success with project name + code in URL params

### CLI Success (`/cli/success`)
- Displays real project name, device code, authorization timestamp from URL params

### Navigation
- Fixed top bar on all pages
- Bottom nav (mobile) — Dashboard / Projects / Docs / Settings with active state indicator

### Docs (`/docs`)
- In-app quick reference for all features

### Infrastructure
- SQLite via `better-sqlite3` with WAL mode, auto-schema init on startup
- Demo project seeded automatically (`ps_demo_abc123`)
- Vercel deployment config (`vercel.json` + `output: standalone`)
- Full README

---

## What's Not Working / Not Yet Built ❌

### Authentication
- **No real auth.** The entire app runs in demo mode with a single hardcoded project (`ps_demo_abc123`). Anyone with the URL can see your callbacks. This is intentional for MVP validation — you're meant to be the only user.

### Multi-project / Multi-user
- The API supports multiple projects (list, create) but the UI only ever shows the demo project. There's no signup, login, or project creation flow in the UI.

### CLI Tool
- The CLI auth flow UI is built but there is no actual CLI binary. The `pesa auth login` command referenced in docs doesn't exist yet. The auth page is functional as a UI component — it just needs a real CLI client to call it.

### Persistent Storage on Vercel
- Vercel's filesystem is **ephemeral**. Every new deployment wipes `/tmp/pesastudio.db`. For production use, `lib/db.ts` needs to be swapped to a hosted database (Neon Postgres, PlanetScale, Turso, etc.). The schema is already clean SQL — migration is straightforward.

### SSE on Vercel Serverless
- Vercel's serverless functions have a max duration (10s on hobby, 300s on pro). Long-running SSE connections **will be cut off**. The fix is to move to Edge Runtime for the stream route or use a separate WebSocket service (Ably, Pusher, Soketi).

### Latency Stats (Edge Case)
- `avgLatency` only shows a value when `forwardedAt` is set — meaning a local endpoint must be configured AND a callback must have been forwarded. Sessions with no local endpoint show `—`.

### Daraja Consumer Key / Secret Storage
- The Settings page links to `developer.safaricom.co.ke` but there's no form to save your actual Daraja credentials. They'd need to be stored (encrypted) in the DB and used by a future "initiate STK push" feature.

### B2C / C2B Replay Validation
- Replay works for all types but there's no validation that your local endpoint is still reachable before attempting. A failed replay just stores the error silently.

### Mobile Polish
- The dashboard is functional on mobile but the 3-column desktop layout collapses to a long single column. The simulator and callback feed ordering could be improved for small screens.

---

## Stack

| Layer | Tech | Why |
|---|---|---|
| Framework | Next.js 16 App Router (TypeScript) | File-based routing, server components, API routes all in one |
| Styling | Tailwind CSS v4 + custom M3 tokens | Material You dark theme, consistent design language |
| Database | SQLite via `better-sqlite3` | Zero-config, embedded, fast for single-server MVP |
| Real-time | Server-Sent Events (SSE) | Simpler than WebSockets for one-way server→client push |
| Fonts | Inter + JetBrains Mono | Clean UI + readable code/receipt numbers |

---

## File Map

```
pesastudio/
├── app/
│   ├── api/
│   │   ├── callback/[apiKey]/route.ts      ← Daraja callback receiver
│   │   ├── projects/route.ts               ← List / create projects
│   │   ├── projects/[id]/
│   │   │   ├── callbacks/route.ts          ← List callbacks (paginated)
│   │   │   ├── callbacks/[cid]/replay/     ← Replay a callback
│   │   │   ├── endpoint/route.ts           ← Set local forwarding URL
│   │   │   ├── stats/route.ts              ← Live stats (delivery rate, latency)
│   │   │   ├── reset/route.ts              ← Delete all callbacks
│   │   │   └── stream/route.ts             ← SSE live stream
│   │   └── simulate/stk/route.ts           ← STK Push simulator
│   ├── dashboard/page.tsx                  ← Main dashboard (server)
│   ├── settings/page.tsx                   ← Project settings (server)
│   ├── cli/auth/page.tsx                   ← CLI authorization flow
│   ├── cli/success/page.tsx                ← Auth success
│   ├── docs/page.tsx                       ← In-app docs
│   ├── layout.tsx                          ← Root layout + fonts
│   └── globals.css                         ← M3 design tokens + animations
├── components/
│   ├── DashboardClient.tsx                 ← Full dashboard UI (client)
│   ├── CallbackList.tsx                    ← Live callback feed + SSE listener
│   ├── SettingsClient.tsx                  ← Settings UI (client)
│   ├── CLIAuthClient.tsx                   ← CLI auth UI (client)
│   ├── CLISuccessClient.tsx                ← Auth success UI (client)
│   ├── BottomNav.tsx                       ← Mobile bottom navigation
│   └── TopBar.tsx                          ← Shared top app bar
├── lib/
│   ├── db.ts                               ← SQLite client, schema, M-Pesa parser
│   └── sse.ts                              ← SSE broadcaster (per-project rooms)
├── next.config.ts                          ← Standalone output, turbopack
└── vercel.json                             ← Vercel deployment config
```

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/dashboard`.

**Demo callback URL:**
```
http://localhost:3000/api/callback/ps_demo_abc123
```

Test it immediately:
```bash
# Simulate a successful STK Push
curl -X POST http://localhost:3000/api/simulate/stk \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"http://localhost:3000/api/callback/ps_demo_abc123","resultCode":0,"amount":100}'
```

---

## Environment Variables

| Variable | Development | Vercel | Used by |
|---|---|---|---|
| `DATABASE_URL` | `file:./dev.db` (the default if unset) | `file:/tmp/pesastudio.db` | `lib/db.ts`, SQLite file location |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (the default if unset) | your deployment URL | the callback URL shown on the dashboard |

Set them in your shell, a local env file (git ignores it), or the Vercel project settings.

---

## Deploy to Vercel

### One-click (recommended)

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add the environment variables (above)
4. Deploy — Vercel auto-detects Next.js and reads `vercel.json`

### Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

> ⚠️ **Important:** SQLite on Vercel is ephemeral — data resets on each deploy. Fine for demos, not for production. To persist data, replace `lib/db.ts` with Neon/Turso/Supabase.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/callback/:apiKey` | Receive Daraja callback |
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create a new project |
| `GET` | `/api/projects/:id/callbacks` | List callbacks (paginated) |
| `POST` | `/api/projects/:id/callbacks/:cid/replay` | Replay callback to local endpoint |
| `PUT` | `/api/projects/:id/endpoint` | Set local forwarding URL |
| `GET` | `/api/projects/:id/stats` | Live stats |
| `DELETE` | `/api/projects/:id/reset` | Delete all callbacks |
| `GET` | `/api/projects/:id/stream` | SSE live stream |
| `POST` | `/api/simulate/stk` | Fire synthetic STK Push callback |

---

## What's Next (Post-MVP)

- [ ] **Auth** — Clerk or NextAuth, real project isolation per user
- [ ] **Persistent DB** — Turso (SQLite-compatible, hosted) or Neon Postgres
- [ ] **Edge SSE** — Move stream route to Edge Runtime for Vercel compatibility
- [ ] **CLI binary** — `npm i -g pesa-studio-cli` → `pesa auth login`, `pesa logs`, `pesa replay`
- [ ] **Daraja emulator** — Full STK Push initiation (no real Daraja account needed)
- [ ] **B2C + Paybill simulation** — Expand simulator beyond STK Push
- [ ] **Webhook inspector** — Diff viewer between callback versions
- [ ] **AI diagnostics** — "Why did this callback fail?" powered by LLM
- [ ] **Team workspaces** — Share projects across a dev team
- [ ] **Billing** — Stripe integration, paid tiers

---

## Demo Mode

Ships with a seeded project — no signup required:

| Field | Value |
|---|---|
| Project | Demo Project |
| API Key | `ps_demo_abc123` |
| Callback URL | `{APP_URL}/api/callback/ps_demo_abc123` |

Point your Daraja `CallBackURL` here and watch the feed light up.

---

## Licence

Copyright © 2026 Kennedy Muritu. All rights reserved. The code is public to read, not to reuse. See [LICENSE](LICENSE).
