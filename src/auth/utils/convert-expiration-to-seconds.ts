/**
 * Converts JWT expiration format to seconds for Redis TTL
 * Supports formats like: '15m', '1h', '24h', '900' (already in seconds)
 */
export function convertExpirationToSeconds(expiration: string | number): number {
  if (typeof expiration === 'number') {
    return expiration;
  }

  if (typeof expiration !== 'string') {
    throw new Error('Expiration must be a string or number');
  }

  // If it's just a number as string, convert and return
  if (/^\d+$/.test(expiration)) {
    return parseInt(expiration, 10);
  }

  // Parse string format like '15m', '1h', etc.
  const match = expiration.match(/^(\d+)([smh]?)$/);
  if (!match) {
    throw new Error(`Invalid expiration format: ${expiration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case '':
      // No unit means seconds
      return value;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}
