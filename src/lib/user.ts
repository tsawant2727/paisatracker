import { requireUserId } from "@/lib/session";

/**
 * Returns the current signed-in user's id. Redirects to /login if there is no
 * valid session. Used by every page and server action to scope data per user.
 */
export async function getCurrentUserId(): Promise<string> {
  return requireUserId();
}
