var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var ALLOWED_ORIGINS = [
  "https://acrozier18-letsgo.github.io",
  "http://localhost:5173",
  "http://localhost:4173"
];
var MAX_ANSWERS_BYTES = 4e4;
var ID_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
function randomId(len) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let s = "";
  for (const b of bytes) s += ID_ALPHABET[b % ID_ALPHABET.length];
  return s;
}
__name(randomId, "randomId");
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(randomToken, "randomToken");
function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Owner-Token",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}
__name(cors, "cors");
function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" }
  });
}
__name(json, "json");
var VALID_ANSWERS = /* @__PURE__ */ new Set(["strongly_disagree", "disagree", "no_opinion", "agree", "strongly_agree"]);
function sanitizeAnswers(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (/^[a-z]{1,4}\d{3}$/.test(k) && typeof v === "string" && VALID_ANSWERS.has(v)) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}
__name(sanitizeAnswers, "sanitizeAnswers");
var worker_default = {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: "Origin not allowed." }, 403, origin);
    }
    if (!env.DB) {
      return json({ error: "Backend is not configured with a database." }, 500, origin);
    }
    const now = Date.now();
    try {
      if (request.method === "GET" && parts[0] === "account") {
        const email = (url.searchParams.get("email") || "").trim().toLowerCase();
        const token = url.searchParams.get("token") || "";
        if (!email || !token) return json({ error: "email and token required." }, 400, origin);
        const { results } = await env.DB.prepare(
          "SELECT id, label, updated_at FROM profiles WHERE email = ? AND owner_token = ? ORDER BY updated_at DESC"
        ).bind(email, token).all();
        return json({ profiles: results || [] }, 200, origin);
      }
      if (request.method === "POST" && parts[0] === "profiles" && parts.length === 1) {
        const body = await request.json().catch(() => null);
        const answers = sanitizeAnswers(body && body.answers);
        if (!answers) return json({ error: "No valid answers provided." }, 400, origin);
        const answersJson = JSON.stringify(answers);
        if (answersJson.length > MAX_ANSWERS_BYTES) return json({ error: "Profile too large." }, 413, origin);
        const label = typeof body.label === "string" ? body.label.slice(0, 80) : "My profile";
        const email = typeof body.email === "string" && body.email.includes("@") ? body.email.trim().toLowerCase().slice(0, 200) : null;
        const ownerToken = typeof body.ownerToken === "string" && body.ownerToken.length >= 16 && body.ownerToken.length <= 128 ? body.ownerToken : randomToken();
        let id = randomId(8);
        for (let attempt = 0; attempt < 3; attempt++) {
          const existing = await env.DB.prepare("SELECT id FROM profiles WHERE id = ?").bind(id).first();
          if (!existing) break;
          id = randomId(8);
        }
        await env.DB.prepare(
          "INSERT INTO profiles (id, owner_token, email, label, answers, created_at, updated_at) VALUES (?,?,?,?,?,?,?)"
        ).bind(id, ownerToken, email, label, answersJson, now, now).run();
        return json({ id, ownerToken, label }, 200, origin);
      }
      if (request.method === "GET" && parts[0] === "profiles" && parts[1]) {
        const row = await env.DB.prepare("SELECT id, label, answers, updated_at FROM profiles WHERE id = ?").bind(parts[1]).first();
        if (!row) return json({ error: "Not found." }, 404, origin);
        return json({ id: row.id, label: row.label, answers: JSON.parse(row.answers), updatedAt: row.updated_at }, 200, origin);
      }
      if (request.method === "PUT" && parts[0] === "profiles" && parts[1]) {
        const token = request.headers.get("X-Owner-Token") || "";
        const row = await env.DB.prepare("SELECT owner_token FROM profiles WHERE id = ?").bind(parts[1]).first();
        if (!row) return json({ error: "Not found." }, 404, origin);
        if (row.owner_token !== token) return json({ error: "Not authorised." }, 403, origin);
        const body = await request.json().catch(() => null);
        const answers = sanitizeAnswers(body && body.answers);
        if (!answers) return json({ error: "No valid answers provided." }, 400, origin);
        const label = typeof body.label === "string" ? body.label.slice(0, 80) : "My profile";
        await env.DB.prepare("UPDATE profiles SET answers = ?, label = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(answers), label, now, parts[1]).run();
        return json({ id: parts[1], label }, 200, origin);
      }
      if (request.method === "DELETE" && parts[0] === "profiles" && parts[1]) {
        const token = request.headers.get("X-Owner-Token") || "";
        const row = await env.DB.prepare("SELECT owner_token FROM profiles WHERE id = ?").bind(parts[1]).first();
        if (!row) return json({ error: "Not found." }, 404, origin);
        if (row.owner_token !== token) return json({ error: "Not authorised." }, 403, origin);
        await env.DB.prepare("DELETE FROM profiles WHERE id = ?").bind(parts[1]).run();
        return json({ ok: true }, 200, origin);
      }
      return json({ error: "Not found." }, 404, origin);
    } catch (e) {
      return json({ error: "Server error: " + (e && e.message ? e.message : String(e)) }, 500, origin);
    }
  }
};

// ../../AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-VHUKZV/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-VHUKZV/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
