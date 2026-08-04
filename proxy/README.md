# Selfscape OpenAI proxy (Cloudflare Worker)

This tiny Cloudflare Worker lets the public site offer the AI features (persona
name, portrait, story, examples) using **your** OpenAI key **without exposing it**.
The key lives as a server-side secret; the browser only ever talks to the Worker,
which restricts origins, endpoints, and models and rate-limits per IP.

## One-time setup (~5 minutes)

You'll need a **free Cloudflare account** (https://dash.cloudflare.com/sign-up).
Node/npm is already installed, so use `npx wrangler` (no global install needed).

```bash
cd proxy

# 1. Log in to Cloudflare (opens your browser)
npx wrangler login

# 2. Store your OpenAI key as a secret (paste it when prompted — never committed)
npx wrangler secret put OPENAI_API_KEY

# 3. Deploy the Worker
npx wrangler deploy
```

`wrangler deploy` prints the Worker URL, e.g.:

```
https://selfscape-openai-proxy.<your-subdomain>.workers.dev
```

## Point the site at the proxy

1. Copy that Worker URL.
2. In the GitHub repo: **Settings → Secrets and variables → Actions → Variables**
   tab → **New repository variable**:
   - Name: `OPENAI_PROXY_URL`
   - Value: the Worker URL (no trailing slash)
3. Re-run the **Deploy to GitHub Pages** workflow (or push any commit). The rebuilt
   site will now use the shared key — visitors can generate portraits/stories
   without their own key. (Anyone who *does* enter their own key still uses theirs.)

## Fixing image throttling ("error code: 1015")

If the AI **Portrait keeps saying "rate limited"** but the persona name/description
still work, the *image* endpoint is being throttled. It's almost always **not**
OpenAI and **not** this Worker's own limiter — it's **Cloudflare's edge rate
limiting on the `*.workers.dev` hostname** (image requests are slow and large, so
they trip it first). The app now degrades gracefully (you still get the persona
text), but to make images reliable, fix it at the source:

### Best fix — put the Worker on a custom domain
`*.workers.dev` shares Cloudflare's edge throttling; a route on **your own
Cloudflare zone** does not. If you have any domain on your Cloudflare account
(free plan is fine):

1. In `wrangler.toml`, uncomment the `routes` block and set your hostname, e.g.
   `openai-proxy.yourdomain.com`.
2. `cd proxy && npx wrangler deploy` — Cloudflare provisions DNS + TLS for it.
3. Update the GitHub Actions **variable** `OPENAI_PROXY_URL` to
   `https://openai-proxy.yourdomain.com`, then re-run the site deploy.
4. Leave `ALLOWED_ORIGINS` in `worker.js` as-is (those are the *site's* origins,
   not the proxy's).

### Turn on this Worker's own per-IP limiter
The `[[unsafe.bindings]]` limiters in `wrangler.toml` are **not active on the
currently-deployed Worker** (it was deployed without them), so right now there is
no per-IP protection. Redeploying activates them and gives clean JSON `429`s
instead of relying on the edge:

```bash
cd proxy && npx wrangler deploy
```

Defaults are per-IP: **chat 60/min, images 10/min** — enough for a person to
regenerate a few times, low enough to cap cost. Tune in `wrangler.toml`. (This
runs *inside* the Worker, so on `*.workers.dev` it won't stop `1015` — the custom
domain does that; the limiter is for graceful cost control.)

## Protect your wallet

- **Set a hard monthly spend limit** in the OpenAI dashboard:
  Billing → Limits. This is your real safety net.
- Rate limits are in `wrangler.toml` (`CHAT_LIMITER`, `IMAGE_LIMITER`). Images are
  the pricey part (gpt-image-1 ≈ a few cents each); tune the per-IP limits there.
- Only the site's origin can call the Worker from a browser (see `ALLOWED_ORIGINS`
  in `worker.js`). Add your custom domain there if you set one up later.

## Notes

- If `wrangler deploy` ever objects to the `[[unsafe.bindings]]` rate-limit blocks,
  you can delete them from `wrangler.toml` — the Worker skips rate limiting
  gracefully when the bindings are absent (rely on the OpenAI spend cap instead).
- To rotate the key: `npx wrangler secret put OPENAI_API_KEY` again, then redeploy.
