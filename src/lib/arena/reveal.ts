/**
 * How long an answered question stays on screen before the next one.
 *
 * The battle advances optimistically — nothing waits on the network — but the
 * green/red reveal cannot, because the correct answer is deliberately not in
 * the client's hands until the server replies to an answer already recorded.
 * That makes the reveal the one place where a round trip is visible.
 *
 * THE RULE: the colours are shown for REVEAL_HOLD_MS, measured from the moment
 * they land. Not from the answer — from the mark.
 *
 * The first version measured from the answer and capped the whole reveal at
 * 1.1 seconds, on the theory that a bounded reveal could never feel like lag.
 * It bounded the wrong thing. `submitAnswer` was making seven sequential
 * queries against a hosted database, so the mark took most of that budget and
 * the hold got whatever was left: at 800ms of latency the colours flashed for
 * 300, and past 1.1 seconds the reveal expired before the mark arrived and the
 * player saw no colour at all, ever. A reveal whose duration is
 * `budget − latency` is a feature that switches itself off on exactly the
 * connections that need it most.
 *
 * So the hold is now fixed and the wait is separate. A question costs the
 * round trip plus half a second, and the half second is always there. The
 * right way to make that quick is to make the mark quick — which is a server
 * problem, where it belongs, not something to paper over by shortening the one
 * part the player actually looks at.
 *
 * MARK_TIMEOUT_MS is the safety net and nothing more: if an answer fails or
 * the network has gone, the battle advances uncoloured rather than stalling,
 * and the marks trail under the score reports the result late.
 */

/** How long the colours stay up once they have landed. */
export const REVEAL_HOLD_MS = 500;

/** Give up waiting for a mark that is not coming. */
export const MARK_TIMEOUT_MS = 3500;

/**
 * When to leave the reveal, as a delay in milliseconds from `now`.
 *
 * `markedAt` is null while the answer is still in flight. Never negative: a
 * hold that has already elapsed advances on the next tick rather than
 * scheduling a timer into the past.
 */
export function revealDelay(input: {
  /** When the player answered and the reveal opened. */
  openedAt: number;
  /** When the server's mark landed, or null if it has not. */
  markedAt: number | null;
  now: number;
}): number {
  const { openedAt, markedAt, now } = input;

  return markedAt === null
    ? Math.max(0, MARK_TIMEOUT_MS - (now - openedAt))
    : Math.max(0, REVEAL_HOLD_MS - (now - markedAt));
}
