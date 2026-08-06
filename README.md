# Earth Unseen

A photography journal for landscape and wildlife work, organized by season — with a
login-protected studio for uploading, captioning, reordering and deleting photographs
without touching code.

- **Public site** — a blog-style feed of photographs grouped into four seasons
  (Winter, Spring, Summer, Fall), with lightbox viewing, page transitions and
  blur-up image loading.
- **Studio** — a private admin panel (`/admin`) where new photos are compressed in
  the browser, uploaded, and appear on the public site immediately.

Built with Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4,
`motion` for animation, and a pluggable data backend.

---

## Quick start (local development)

Requirements: Node.js ≥ 20.

```bash
npm install
cp .env.example .env.local   # defaults are fine for local work
npm run dev                  # http://localhost:3000
```

The default `DATA_BACKEND=local` mode needs no external services:

- **Media** is written to `public/uploads/` (gitignored).
- **Metadata** is stored in `data/db.json` (gitignored).

Seed a real photo so the site is populated before you log in to upload:

```bash
npm run db:seed -- --file /path/to/photo.jpg --season summer --caption "Caption text"
```

Open the studio at http://localhost:3000/admin and sign in with the password in
`ADMIN_PASSWORD` (default `earth-unseen`). You can change it in `.env.local`.

### Environment variables

| Variable                  | Required | Purpose                                                        |
| ------------------------- | -------- | -------------------------------------------------------------- |
| `DATA_BACKEND`            | optional | `local`, `supabase`, or `auto`. `auto` uses Supabase when keys are set, otherwise local. |
| `ADMIN_PASSWORD`          | local    | Password for the single admin account.                          |
| `SESSION_SECRET`          | local    | Secret used to sign the admin session cookie. Use a long random value. |
| `SUPABASE_URL`            | supabase | Project URL, e.g. `https://YOURREF.supabase.co`.                |
| `SUPABASE_ANON_KEY`       | supabase | Publishable anon key (safe to expose).                          |
| `ADMIN_EMAIL`             | supabase | The admin's Supabase auth email; only this address may sign in. |
| `NEXT_PUBLIC_SITE_URL`    | optional | Public URL for sitemap / canonical / Open Graph URLs.           |

---

## Upload pipeline

1. In the studio, choose a photograph. The browser downscales it (long edge 2048 px,
   JPEG ≈ quality 84), strips metadata and generates a 24 px blur-up placeholder —
   no large originals are ever transmitted.
2. The optimized file, dimensions, caption and season are sent to a server action.
3. The backend (local disk or Supabase Storage) stores the file, records the entry,
   and the public pages are revalidated so the photo goes live immediately.

---

## Supabase backend (production)

The local backend is for development only. For a hosted deployment, Earth Unseen
uses Supabase for storage, the Postgres data API and email/password admin auth.

### 1. Create a project

Create a project at https://supabase.com (free tier is fine).

### 2. Run the migration

Open **SQL Editor → New query** and paste the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), then run it.

It creates:

- the `public.photos` table (season enum, caption, image path, dimensions,
  blur-up placeholder, sort order, timestamps) with RLS enabled;
- read access for everyone, write access for signed-in users (admin);
- the public `photos` storage bucket with matching policies.

> The table and storage are intentionally *not* exposed through Supabase's
> auto-generated REST endpoints (`*` privileges were not granted), so the public
> site cannot be queried directly. All reads go through Next.js; writes only
> through the protected server actions.

### 3. Create the admin user

In **Authentication → Users → Add user**, create a user with the email you will use
to sign in (e.g. `you@example.com`) and a strong password. This is the
`ADMIN_EMAIL` account; no other email can sign in to the studio.

### 4. Configure the app

In your hosting provider's environment (or `.env.local` when running `next start`):

```bash
DATA_BACKEND=supabase
SUPABASE_URL=https://YOURREF.supabase.co
SUPABASE_ANON_KEY=your-publishable-anon-key
ADMIN_EMAIL=you@example.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

No `ADMIN_PASSWORD` / `SESSION_SECRET` are used in Supabase mode.

> The anon key can be public; RLS + the email check are what keep the studio
> private. The admin password lives only in Supabase Auth.

### 5. Configure remote image loading

For Next.js Image Optimization to load Supabase-hosted images, add a
`remotePatterns` entry for your project. `next.config.ts` already includes a
pattern matching `**.supabase.co`; remove or tighten it if you prefer.

---

## Scripts

| Command                     | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `npm run dev`               | Start the dev server with Turbopack.             |
| `npm run build`             | Production build (static + ISR pages).           |
| `npm start`                 | Serve the production build.                      |
| `npm run lint`              | ESLint over the project.                         |
| `npm run db:seed`           | Seed the local backend with a real photo.        |

---

## Project structure

```
app/
  (site)/              Public pages: home, seasons/[slug], about, 404
  admin/               Studio: login + protected manage/upload pages
  layout.tsx           Root layout (fonts, motion providers, metadata)
proxy.ts               Edge guard — redirects /admin/* to /admin/login
components/
  public/              Header, footer, lightbox, page transition, entries…
  admin/               Login form, upload form, photo manager, UI kit
lib/
  db/                  Backend interface + local & Supabase implementations
  auth/                Session cookie (local) + Supabase SSR client
  actions/admin.ts     Server actions: login, upload, update, delete, reorder
  data.ts              Public read helpers (featured, covers, counts)
scripts/seed.mjs       Local seed script (sharp)
supabase/migrations/   Database + storage schema
```

---

## Notes

- Public pages use ISR with a 2-minute revalidate; the studio calls
  `revalidatePath("/", "layout")` on every change so new photos appear within
  that window (instantly on a freshly served page).
- The local mode session cookie is HMAC-signed with `SESSION_SECRET` and lasts
  30 days. Rotating the secret signs everyone out.
- Uploads are rejected above 25 MB. Compression always happens in the browser
  first, so only a small optimized JPEG is ever transmitted (server actions are
  configured with an 8 MB body limit).
