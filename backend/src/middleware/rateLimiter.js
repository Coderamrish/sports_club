/**
 * ══════════════════════════════════════════════════════════════
 *  SLIDING WINDOW RATE LIMITER  —  True Log-based Algorithm
 * ══════════════════════════════════════════════════════════════
 *
 *  Algorithm: Sliding Window Log
 *  ─────────────────────────────
 *  Stores an array of actual request timestamps per key and evicts
 *  any timestamp older than the window on every check.
 *
 *  Example (window=5min, max=5):
 *    t=0:00 → req1 [0]          remaining=4
 *    t=4:59 → req5 [0..299000]  remaining=0  BLOCKED
 *    t=5:01 → req6 [60..301000] remaining=4  t=0 evicted → ALLOWED
 *
 *  Limits:
 *    login       → 5 attempts / 5 min  (per IP+email)
 *    signup      → 5 attempts / 5 min  (per IP)
 *    admin_login → 3 attempts / 5 min  (stricter)
 *    global IP   → 20 attempts / 5 min (all routes combined)
 */

const WINDOW_MS       = 5 * 60 * 1000;  // 5 minutes
const LOGIN_MAX       = 5;
const SIGNUP_MAX      = 5;
const ADMIN_MAX       = 3;
const IP_GLOBAL_MAX   = 20;

// In-memory store: key -> sorted timestamp array
const store = new Map();

function slidingWindowCheck(key, max, window) {
  const win = window || WINDOW_MS;
  const now = Date.now();
  const cutoff = now - win;

  let timestamps = (store.get(key) || []).filter(ts => ts > cutoff);
  const count = timestamps.length;

  if (count >= max) {
    store.set(key, timestamps);
    const retryAfterMs = timestamps[0] + win - now;
    return { allowed: false, remaining: 0, retryAfterMs, count };
  }

  timestamps.push(now);
  store.set(key, timestamps);

  // GC: auto-clean after window expires
  setTimeout(() => {
    const entries = (store.get(key) || []).filter(ts => ts > Date.now() - win);
    if (entries.length === 0) store.delete(key);
    else store.set(key, entries);
  }, win + 1000);

  return { allowed: true, remaining: max - timestamps.length, retryAfterMs: 0, count: timestamps.length };
}

function resetKey(key) { store.delete(key); }

function peekRemaining(key, max) {
  const now = Date.now();
  const timestamps = (store.get(key) || []).filter(ts => ts > now - WINDOW_MS);
  return Math.max(0, max - timestamps.length);
}

function buildHeaders(max, remaining, retryAfterMs) {
  return {
    'X-RateLimit-Limit':      String(max),
    'X-RateLimit-Remaining':  String(remaining),
    'X-RateLimit-Reset':      new Date(Date.now() + retryAfterMs).toISOString(),
    'Retry-After':            String(Math.ceil(retryAfterMs / 1000)),
  };
}

const slidingWindowLimiter = (type) => (req, res, next) => {
  const t     = type || 'login';
  const ip    = req.ip || req.socket?.remoteAddress || 'unknown';
  const email = (req.body?.email || '').toLowerCase().trim();

  const max = t === 'admin_login' ? ADMIN_MAX
            : t === 'signup'      ? SIGNUP_MAX
            :                       LOGIN_MAX;

  // 1. Global IP guard
  const ipResult = slidingWindowCheck('ip:' + ip, IP_GLOBAL_MAX);
  if (!ipResult.allowed) {
    const secs = Math.ceil(ipResult.retryAfterMs / 1000);
    res.set(buildHeaders(IP_GLOBAL_MAX, 0, ipResult.retryAfterMs));
    return res.status(429).json({
      success: false, code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from your IP. Try again in ' + Math.ceil(secs/60) + ' minute(s).',
      retryAfterSeconds: secs,
    });
  }

  // 2. Specific key (type:ip:email)
  const specificKey    = t + ':' + ip + (email ? ':' + email : '');
  const specificResult = slidingWindowCheck(specificKey, max);
  if (!specificResult.allowed) {
    const secs = Math.ceil(specificResult.retryAfterMs / 1000);
    res.set(buildHeaders(max, 0, specificResult.retryAfterMs));
    return res.status(429).json({
      success: false, code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many ' + t.replace('_', ' ') + ' attempts. Try again in ' + Math.ceil(secs/60) + ' minute(s).',
      retryAfterSeconds: secs,
      attemptsUsed: specificResult.count,
      attemptsMax: max,
      windowMinutes: 5,
    });
  }

  req.rateLimitInfo = { type: t, ip, email, remaining: specificResult.remaining, attemptsUsed: specificResult.count };
  next();
};

const resetLoginLimit = (ip, email) => {
  if (ip)    resetKey('ip:' + ip);
  if (email) { resetKey('login:' + ip + ':' + email); resetKey('admin_login:' + ip + ':' + email); }
};

const getRemainingAttempts = (ip, email, type) => {
  const t   = type || 'login';
  const max = t === 'admin_login' ? ADMIN_MAX : LOGIN_MAX;
  return peekRemaining(t + ':' + ip + (email ? ':' + email : ''), max);
};

module.exports = { slidingWindowLimiter, resetLoginLimit, getRemainingAttempts };
