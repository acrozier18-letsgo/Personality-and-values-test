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
