// Simple in-memory fixed-window rate limiter. No external store needed since
// the app runs as a single Railway instance — a Map is sufficient and resets
// harmlessly on redeploy.
const buckets = new Map();

// Sweep expired buckets periodically so the Map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref();

function rateLimit({ windowMs, max, message }) {
  return (req, res, next) => {
    const key = `${req.baseUrl}${req.path}:${req.ip}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: message || 'Too many attempts. Please try again later.',
        retryAfterSeconds: retryAfterSec,
      });
    }

    next();
  };
}

module.exports = rateLimit;
