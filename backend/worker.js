// Selfscape profiles backend (Cloudflare Worker + D1).
// Stores answer sets so they can be shared by a short link and listed per person.
// Lightweight ownership: the client holds a secret owner_token (never exposed by
// GET); email is optional and only used to let someone list their own profiles.

const ALLOWED_ORIGINS = [
  'https://theselfscape.com',
  'https://www.theselfscape.com',
  'https://acrozier18-letsgo.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];

const MAX_ANSWERS_BYTES = 40_000; // generous cap for ~456 short answers
const ID_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // no ambiguous chars

function randomId(len) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let s = '';
  for (const b of bytes) s += ID_ALPHABET[b % ID_ALPHABET.length];
  return s;
}
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Token',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json' },
  });
}

// Validate an answers map: object of questionId -> one of the 5 options.
const VALID_ANSWERS = new Set(['strongly_disagree', 'disagree', 'no_opinion', 'agree', 'strongly_agree']);
function sanitizeAnswers(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (/^[a-z]{1,4}\d{3}$/.test(k) && typeof v === 'string' && VALID_ANSWERS.has(v)) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean); // e.g. ['profiles','abc123']

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: 'Origin not allowed.' }, 403, origin);
    }
    if (!env.DB) {
      return json({ error: 'Backend is not configured with a database.' }, 500, origin);
    }
    const now = Date.now();

    try {
      // GET /account?email=&token=  -> list this owner's profiles
      if (request.method === 'GET' && parts[0] === 'account') {
        const email = (url.searchParams.get('email') || '').trim().toLowerCase();
        const token = url.searchParams.get('token') || '';
        if (!email || !token) return json({ error: 'email and token required.' }, 400, origin);
        const { results } = await env.DB.prepare(
          'SELECT id, label, updated_at FROM profiles WHERE email = ? AND owner_token = ? ORDER BY updated_at DESC',
        ).bind(email, token).all();
        return json({ profiles: results || [] }, 200, origin);
      }

      // POST /profiles  -> create
      if (request.method === 'POST' && parts[0] === 'profiles' && parts.length === 1) {
        const body = await request.json().catch(() => null);
        const answers = sanitizeAnswers(body && body.answers);
        if (!answers) return json({ error: 'No valid answers provided.' }, 400, origin);
        const answersJson = JSON.stringify(answers);
        if (answersJson.length > MAX_ANSWERS_BYTES) return json({ error: 'Profile too large.' }, 413, origin);
        const label = typeof body.label === 'string' ? body.label.slice(0, 80) : 'My profile';
        const email = typeof body.email === 'string' && body.email.includes('@') ? body.email.trim().toLowerCase().slice(0, 200) : null;
        // The client may supply its own account token so all its profiles share
        // ownership (enabling the /account listing); otherwise generate one.
        const ownerToken = typeof body.ownerToken === 'string' && body.ownerToken.length >= 16 && body.ownerToken.length <= 128
          ? body.ownerToken
          : randomToken();
        let id = randomId(8);
        // Best-effort uniqueness (collisions astronomically unlikely at this size).
        for (let attempt = 0; attempt < 3; attempt++) {
          const existing = await env.DB.prepare('SELECT id FROM profiles WHERE id = ?').bind(id).first();
          if (!existing) break;
          id = randomId(8);
        }
        await env.DB.prepare(
          'INSERT INTO profiles (id, owner_token, email, label, answers, created_at, updated_at) VALUES (?,?,?,?,?,?,?)',
        ).bind(id, ownerToken, email, label, answersJson, now, now).run();
        return json({ id, ownerToken, label }, 200, origin);
      }

      // GET /profiles/:id  -> public read (no token/email exposed)
      if (request.method === 'GET' && parts[0] === 'profiles' && parts[1]) {
        const row = await env.DB.prepare('SELECT id, label, answers, updated_at FROM profiles WHERE id = ?')
          .bind(parts[1]).first();
        if (!row) return json({ error: 'Not found.' }, 404, origin);
        return json({ id: row.id, label: row.label, answers: JSON.parse(row.answers), updatedAt: row.updated_at }, 200, origin);
      }

      // PUT /profiles/:id  -> update (owner only)
      if (request.method === 'PUT' && parts[0] === 'profiles' && parts[1]) {
        const token = request.headers.get('X-Owner-Token') || '';
        const row = await env.DB.prepare('SELECT owner_token FROM profiles WHERE id = ?').bind(parts[1]).first();
        if (!row) return json({ error: 'Not found.' }, 404, origin);
        if (row.owner_token !== token) return json({ error: 'Not authorised.' }, 403, origin);
        const body = await request.json().catch(() => null);
        const answers = sanitizeAnswers(body && body.answers);
        if (!answers) return json({ error: 'No valid answers provided.' }, 400, origin);
        const label = typeof body.label === 'string' ? body.label.slice(0, 80) : 'My profile';
        await env.DB.prepare('UPDATE profiles SET answers = ?, label = ?, updated_at = ? WHERE id = ?')
          .bind(JSON.stringify(answers), label, now, parts[1]).run();
        return json({ id: parts[1], label }, 200, origin);
      }

      // DELETE /profiles/:id  -> owner only
      if (request.method === 'DELETE' && parts[0] === 'profiles' && parts[1]) {
        const token = request.headers.get('X-Owner-Token') || '';
        const row = await env.DB.prepare('SELECT owner_token FROM profiles WHERE id = ?').bind(parts[1]).first();
        if (!row) return json({ error: 'Not found.' }, 404, origin);
        if (row.owner_token !== token) return json({ error: 'Not authorised.' }, 403, origin);
        await env.DB.prepare('DELETE FROM profiles WHERE id = ?').bind(parts[1]).run();
        return json({ ok: true }, 200, origin);
      }

      return json({ error: 'Not found.' }, 404, origin);
    } catch (e) {
      return json({ error: 'Server error: ' + (e && e.message ? e.message : String(e)) }, 500, origin);
    }
  },
};
