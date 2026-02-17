type Bucket = { count: number; resetAt: number };

const state = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit = 15, windowMs = 60_000) {
  const now = Date.now();
  const bucket = state.get(key);

  if (!bucket || now > bucket.resetAt) {
    state.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  state.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.count };
}
