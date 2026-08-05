export type AccessDecision = "loading" | "login" | "denied" | "ok";

/** Pure decision table for the CRM route guard. Kept separate from the
 * component so it can be unit tested without a DOM. */
export function decideAccess(input: {
  sessionLoading: boolean;
  hasSession: boolean;
  adminCheckLoading: boolean;
  isAdmin: boolean | null; // null = not checked yet
}): AccessDecision {
  if (input.sessionLoading) return "loading";
  if (!input.hasSession) return "login";
  if (input.adminCheckLoading || input.isAdmin === null) return "loading";
  return input.isAdmin ? "ok" : "denied";
}
