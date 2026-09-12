/**
 * Background worker.
 *
 * Run alongside the app when you'd rather not rely on an HTTP cron:
 *
 *   npm run worker
 *
 * It processes queued AI jobs (retrying written-answer marking that failed
 * inline) and closes abandoned quiz attempts. Safe to run more than one — jobs
 * are claimed atomically.
 */

import "dotenv/config";

import { closeExpiredAttempts, processAiJobs, reconcileBalances } from "../src/server/jobs";

const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 15_000);
const RECONCILE_EVERY = Number(process.env.WORKER_RECONCILE_EVERY ?? 240); // ~1 hour at 15s

let running = true;
let ticks = 0;

process.on("SIGINT", () => {
  console.log("\n[worker] stopping…");
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});

async function tick() {
  const ai = await processAiJobs(20);
  if (ai.processed > 0 || ai.failed > 0) {
    console.log(`[worker] ai jobs: ${ai.processed} done, ${ai.failed} failed`);
    for (const error of ai.errors) console.warn(`[worker]   ${error}`);
  }

  const closed = await closeExpiredAttempts();
  if (closed > 0) console.log(`[worker] closed ${closed} expired attempt(s)`);

  ticks++;
  if (ticks % RECONCILE_EVERY === 0) {
    const result = await reconcileBalances();
    if (result.drifted.length > 0) {
      console.error(
        `[worker] COIN LEDGER DRIFT on ${result.drifted.length} user(s):`,
        result.drifted,
      );
    } else {
      console.log(`[worker] balances reconciled: ${result.checked} users, no drift`);
    }
  }
}

async function main() {
  console.log(`[worker] started, polling every ${POLL_MS / 1000}s`);

  while (running) {
    try {
      await tick();
    } catch (error) {
      console.error("[worker] tick failed", error);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  console.log("[worker] stopped");
  process.exit(0);
}

void main();
