/** Answered-question counts at which the end of a CGI dimension is reached
 * (8 questions per dimension, 5 dimensions). */
export const CGI_CHECKPOINT_QUESTION_COUNTS = [8, 16, 24, 32, 40] as const;

/** Which dimension-boundary checkpoints does reaching `answeredCount`
 * newly cross? Normally returns at most one, but resuming a saved session
 * (or answering out of order) can legitimately cross more than one at
 * once -- callers only need to send a single request either way, since
 * each checkpoint payload already carries the full cumulative answer set. */
export function checkpointsToSend(
  answeredCount: number,
  alreadySent: ReadonlySet<number>
): number[] {
  return CGI_CHECKPOINT_QUESTION_COUNTS.filter(
    (count) => answeredCount >= count && !alreadySent.has(count)
  );
}
