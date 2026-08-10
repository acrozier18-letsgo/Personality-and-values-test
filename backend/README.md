# Selfscape profiles backend (Cloudflare Worker + D1)

Optional backend that stores answer sets so they can be shared by a **short link**
(`/#/p/<id>`) and listed per person ("your cloud profiles"). The app works fully
without it — this only turns on when `VITE_PROFILE_API_URL` is set (mirroring the
OpenAI proxy). Ownership is lightweight: the browser holds a secret account token
and optionally associates profiles with an email; there are **no passwords**.

> Privacy note: unlike the rest of Selfscape, saving to the cloud sends a person's
> answers (and, if provided, their email) to your database. Keep it opt-in and say
> so in any user-facing copy.

## One-time setup (~5 minutes)

Uses the same free Cloudflare account as the proxy. From `backend/`:

```bash
cd backend

# 1. Log in (if not already)
npx wrangler login

# 2. Create the D1 database — copy the printed database_id into wrangler.toml
npx wrangler d1 create selfscape-profiles

# 3. Apply the schema to the remote database
npx wrangler d1 execute selfscape-profiles --remote --file=./schema.sql

# 4. Deploy the Worker
npx wrangler deploy
```

`wrangler deploy` prints the Worker URL, e.g.
`https://selfscape-profiles.<subdomain>.workers.dev`.

## Point the site at the backend

1. In the GitHub repo: **Settings → Secrets and variables → Actions → Variables**
   → **New repository variable**:
   - Name: `PROFILE_API_URL`
   - Value: the Worker URL (no trailing slash)
2. Ensure the deploy workflow passes it through as `VITE_PROFILE_API_URL` at build
   time (same pattern as `OPENAI_PROXY_URL` → `VITE_OPENAI_PROXY_URL`).
3. Re-run the site deploy. "Save to cloud", short `/p/<id>` links, and the
   "Your cloud profiles" list light up automatically.

## Endpoints

| Method | Path            | Auth (X-Owner-Token) | Purpose                          |
|--------|-----------------|----------------------|----------------------------------|
| POST   | `/profiles`     | —                    | Create a profile → `{id, ownerToken}` |
| GET    | `/profiles/:id` | —                    | Public read (no token/email)     |
| PUT    | `/profiles/:id` | required             | Update answers/label             |
| DELETE | `/profiles/:id` | required             | Delete                           |
| GET    | `/account?email=&token=` | token in query | List a person's profiles   |

## Local development

```bash
cd backend
npx wrangler d1 execute selfscape-profiles --local --file=./schema.sql
npx wrangler dev --local --port 8787
```

Then run the site with `VITE_PROFILE_API_URL=http://localhost:8787` in `.env.local`.

## Notes

- Only the site origin (and localhost) may call it (`ALLOWED_ORIGINS` in `worker.js`).
  Add a custom domain there if you set one up.
- Answers are validated server-side (question-id shape + one of the 5 options) and
  capped at 40 KB.
- To wipe everything: `npx wrangler d1 execute selfscape-profiles --remote --command "DELETE FROM profiles"`.
