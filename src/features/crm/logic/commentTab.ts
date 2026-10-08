export const NO_COMMENT_MESSAGE = "O respondente não deixou comentário adicional.";

export function hasLeadComment(comments: string | null | undefined): boolean {
  return Boolean(String(comments || "").trim());
}
