import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const COST = 1 << 15;
const OPTIONS = { N: COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, OPTIONS);
  return ['scrypt', COST, salt.toString('hex'), derived.toString('hex')].join('$');
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [algorithm, cost, saltHex, digestHex, extra] = stored.split('$');
  if (extra !== undefined || algorithm !== 'scrypt' || cost !== String(COST) ||
      !/^[0-9a-f]{32}$/.test(saltHex || '') ||
      !/^[0-9a-f]{128}$/.test(digestHex || '')) return false;
  const digest = Buffer.from(digestHex, 'hex');
  const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), digest.length, OPTIONS);
  return timingSafeEqual(digest, derived);
}
