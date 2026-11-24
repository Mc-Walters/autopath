import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Passwords: salted scrypt hashes (never stored in plain text)
// ---------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// ---------------------------------------------------------------------------
// Bearer token parsing (sessions themselves live in the storage layer)
// ---------------------------------------------------------------------------
export function bearerToken(authHeader?: string): string | undefined {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
  const t = authHeader.slice(7).trim();
  return t || undefined;
}

// ---------------------------------------------------------------------------
// Who is calling? A private random id per browser (+ the account, if logged in)
// ---------------------------------------------------------------------------
import type { Caller } from './storage.ts';
export type { Caller };

const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{16,80}$/;

/**
 * Works out who is calling: the private id of their browser and, if they are logged in,
 * their account id (looked up through `lookupUser`, which checks the login token).
 */
export async function identifyCaller(
  headers: Record<string, any>,
  lookupUser: (token: string | undefined) => Promise<string | undefined>
): Promise<Caller> {
  const rawClient = headers['x-client-id'];
  const clientId = typeof rawClient === 'string' && CLIENT_ID_PATTERN.test(rawClient) ? rawClient : undefined;
  const userId = await lookupUser(bearerToken(headers['authorization']));
  return { clientId, userId };
}

/** Removes the private owner fields from anything sent back to a browser. */
export function stripOwnerFields<T>(body: T): T {
  return JSON.parse(
    JSON.stringify(body, (key, value) => (key === 'ownerClientId' || key === 'ownerUserId' ? undefined : value))
  );
}

// ---------------------------------------------------------------------------
// Login throttling: max 8 wrong passwords per 15 minutes for each key
// ---------------------------------------------------------------------------
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; first: number }>();

export function loginBlocked(key: string): boolean {
  const f = failures.get(key);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return f.count >= MAX_FAILURES;
}

export function recordFailedLogin(key: string): void {
  const f = failures.get(key);
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else f.count += 1;
}

export function clearFailedLogins(key: string): void {
  failures.delete(key);
}
