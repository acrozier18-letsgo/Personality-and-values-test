// Selfscape OpenAI proxy (Cloudflare Worker)
// Holds the OpenAI key server-side so the public site can offer AI features
// without shipping the key. Restricts origins, endpoints, and models, and
// rate-limits per IP (images more strictly than chat).

const ALLOWED_ORIGINS = [
  'https://acrozier18-letsgo.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];

const ALLOWED_PATHS = ['/v1/chat/completions', '/v1/images/generations'];
const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-image-1'];

function corsHeaders(origin, reqHeaders) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    // Reflect requested headers — the OpenAI SDK sends several custom ones.
    'Access-Control-Allow-Headers': reqHeaders || 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      const reqHeaders = request.headers.get('Access-Control-Request-Headers');
      return new Response(null, { status: 204, headers: corsHeaders(origin, reqHeaders) });
    }

    // Only the known site (and local dev) may call the proxy from a browser.
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: { message: 'Origin not allowed.' } }, 403, origin);
    }

    if (request.method !== 'POST' || !ALLOWED_PATHS.includes(url.pathname)) {
      return json({ error: { message: 'Not found.' } }, 404, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: { message: 'Invalid JSON body.' } }, 400, origin);
    }

    if (!ALLOWED_MODELS.includes(body.model)) {
      return json({ error: { message: 'Model not permitted through this proxy.' } }, 400, origin);
    }

    // Per-IP rate limiting (the limiter bindings are optional; skipped if absent).
    const ip = request.headers.get('CF-Connecting-IP') || 'anonymous';
    const isImage = url.pathname === '/v1/images/generations';
    const limiter = isImage ? env.IMAGE_LIMITER : env.CHAT_LIMITER;
    if (limiter) {
      const { success } = await limiter.limit({ key: ip });
      if (!success) {
        return json({ error: { message: 'Rate limit reached — please wait a moment and try again.' } }, 429, origin);
      }
    }

    if (!env.OPENAI_API_KEY) {
      return json({ error: { message: 'Proxy is not configured with an API key.' } }, 500, origin);
    }

    const upstream = await fetch('https://api.openai.com' + url.pathname, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.OPENAI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  },
};
