/** Pure parsing of the "#t=<token>" URL fragment used by the report-access
 * link. Kept separate from any DOM/React code so it is unit-testable
 * without a browser environment. */
export function extractReportAccessToken(hash: string): string | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;
  const match = /(?:^|&)t=([^&]+)/.exec(raw);
  if (!match) return null;
  try {
    const decoded = decodeURIComponent(match[1]);
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}
