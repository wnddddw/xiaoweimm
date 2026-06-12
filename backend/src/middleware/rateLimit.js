/**
 * Rate Limiting Middleware — in-memory, per-IP and per-identifier
 */
const rateMap = new Map(); // key → { count, windowStart }

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateMap) {
    if (now - entry.windowStart > entry.windowMs * 2) rateMap.delete(key);
  }
}, 600_000).unref();

/**
 * Create a rate limiter.
 * @param {object} opts
 * @param {number} opts.windowMs   — time window in ms (default 60s)
 * @param {number} opts.max        — max attempts in window (default 5)
 * @param {string} opts.keyBy      — 'ip' | 'ip+body' field name | function(req)=>string
 */
function createRateLimit(opts = {}) {
  const windowMs = opts.windowMs || 60_000;
  const max = opts.max || 5;
  const keyBy = opts.keyBy || 'ip';

  return (req, res, next) => {
    let key;
    if (typeof keyBy === 'function') {
      key = keyBy(req);
    } else if (keyBy === 'ip') {
      key = req.ip || req.connection.remoteAddress || '127.0.0.1';
    } else if (keyBy.startsWith('ip+')) {
      const field = keyBy.slice(3);
      const val = req.body?.[field] || '';
      key = (req.ip || '127.0.0.1') + '|' + val;
    } else {
      key = req.ip || '127.0.0.1';
    }

    const now = Date.now();
    let entry = rateMap.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 0, windowStart: now, windowMs };
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: `请求过于频繁，请 ${retryAfter} 秒后重试`,
      });
    }

    rateMap.set(key, entry);
    next();
  };
}

// Pre-built limiters
const loginLimiter = createRateLimit({
  windowMs: 5 * 60_000,  // 5 minutes
  max: 10,               // 10 attempts per 5 min per IP
  keyBy: 'ip+phone',
});

const smsLimiter = createRateLimit({
  windowMs: 60_000,
  max: 1,
  keyBy: 'ip+phone',
});

const apiLimiter = createRateLimit({
  windowMs: 60_000,
  max: 100,
  keyBy: 'ip',
});

module.exports = { createRateLimit, loginLimiter, smsLimiter, apiLimiter };
