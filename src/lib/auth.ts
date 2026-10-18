import "server-only";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

export { SESSION_COOKIE } from "@/lib/auth-constants";

/**
 * Secret used to sign session cookies. Set AUTH_SECRET in .env.local for
 * production; the dev fallback keeps local work frictionless.
 */
const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "paisa-dev-secret-change-me-in-env-local";

// --- Password hashing (scrypt) ---------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

// --- Session cookie signing -------------------------------------------------

function sign(value: string): string {
  return createHmac("sha256", AUTH_SECRET).update(value).digest("hex");
}

/** Build a signed cookie value: `userId.signature`. */
export function createSessionToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

/** Verify a signed cookie value and return the userId, or null if tampered. */
export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const userId = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  const expected = sign(userId);
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }
  return userId;
}
