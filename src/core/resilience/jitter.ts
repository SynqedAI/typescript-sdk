// What This Does
// If delay is: 1000ms Actual returned value may be: 800-1200ms

// Why?
// Avoids thundering herd problem.
// Prevents all clients from retrying at the same time.

export function addJitter(
  delay: number,
): number {
  return Math.random() * delay;
}