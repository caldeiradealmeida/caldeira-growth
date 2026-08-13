import { createHash, randomBytes } from "node:crypto";
import {
  getReportAccessTokenByHash,
  touchReportAccessToken,
  upsertReportAccessToken,
} from "./_cgi-supabase.js";

// Opaque bearer-token access to a single CGI report. Only the token's
// SHA-256 hash is ever persisted (see cgi_report_access) -- the plaintext
// exists only in this module's return value (for whoever issues the link)
// and in the link itself. Deliberately simpler than an earlier,
// never-applied design that also stored a recoverable AES-256-GCM
// ciphertext: that existed only to resend an identical link on retry,
// which is not a requirement here. Reissuing (upsertReportAccessToken)
// simply replaces the row, invalidating the previous token.

const REPORT_ACCESS_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const CGI_REPORT_SITE_ORIGIN = "https://www.caldeiragrowth.com";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function generateReportAccessToken(): { plaintext: string; hash: string } {
  const plaintext = randomBytes(32).toString("base64url");
  return { plaintext, hash: sha256Hex(plaintext) };
}

/** Issues (or reissues) a report-access token for an assessment. Always
 * writes a fresh token -- never returns a previous one, since the
 * plaintext of an existing token cannot be recovered from its hash. The
 * previous link (if any) stops working the instant this succeeds, because
 * the row it depended on is replaced, not duplicated. */
export async function issueReportAccessToken(
  publicAssessmentId: string
): Promise<{ token: string; expiresAt: string } | null> {
  if (!publicAssessmentId) return null;
  const { plaintext, hash } = generateReportAccessToken();
  const expiresAt = new Date(Date.now() + REPORT_ACCESS_TTL_MS).toISOString();
  const ok = await upsertReportAccessToken({
    publicAssessmentId,
    tokenHash: hash,
    expiresAt,
  });
  if (!ok) return null;
  return { token: plaintext, expiresAt };
}

export function buildReportAccessUrl(token: string): string {
  return `${CGI_REPORT_SITE_ORIGIN}/cgi/relatorio#t=${token}`;
}

export type ReportAccessValidation =
  | { state: "link_unavailable" }
  | { state: "valid"; publicAssessmentId: string };

/** Resolves a bearer token to a public_assessment_id, or "link_unavailable"
 * for every failure mode (not found, expired, revoked) -- deliberately
 * collapsed into one response so nothing about *why* a link doesn't work
 * is observable from outside. */
export async function resolveReportAccessToken(token: string): Promise<ReportAccessValidation> {
  const hash = sha256Hex(token);
  const row = await getReportAccessTokenByHash(hash);
  if (!row) return { state: "link_unavailable" };
  if (row.revoked_at) return { state: "link_unavailable" };
  if (new Date(row.expires_at).getTime() <= Date.now()) return { state: "link_unavailable" };

  void touchReportAccessToken(row.id);

  return { state: "valid", publicAssessmentId: row.public_assessment_id };
}
