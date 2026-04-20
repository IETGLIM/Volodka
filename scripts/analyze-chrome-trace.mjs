/**
 * Summarize a DevTools Performance JSON trace (Chrome): long main-thread tasks,
 * common slow event names, and input-related markers (best-effort).
 * Usage: node --max-old-space-size=8192 scripts/analyze-chrome-trace.mjs Trace-....json
 */
import fs from "node:fs";
import path from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/analyze-chrome-trace.mjs <trace.json>");
  process.exit(1);
}

const abs = path.resolve(file);
const buf = fs.readFileSync(abs, "utf8");
const json = JSON.parse(buf);
const events = json.traceEvents;
if (!Array.isArray(events)) {
  console.error("No traceEvents array");
  process.exit(2);
}

/** @type {{ ts: number, dur: number, name: string, cat: string, tid?: number, pid?: number }[]} */
const completes = [];
/** @type {Map<string, number>} */
const nameDur = new Map();
/** @type {Map<string, number>} */
const catDur = new Map();

let longTaskCount = 0;
/** @type {any[]} */
const interactionHints = [];

for (const e of events) {
  if (e.ph !== "X" || typeof e.dur !== "number") continue;
  const cat = String(e.cat || "");
  const name = String(e.name || "");
  // Focus on blink/v8/devtools timeline on typical main thread work
  const interesting =
    cat.includes("devtools.timeline") ||
    cat.includes("blink") ||
    cat.includes("v8") ||
    cat.includes("disabled-by-default-devtools") ||
    cat === "loading";

  if (interesting && e.dur >= 50_000) {
    completes.push({
      ts: e.ts,
      dur: e.dur,
      name,
      cat,
      tid: e.tid,
      pid: e.pid,
    });
  }

  if (name === "RunTask" && e.dur >= 50_000) longTaskCount++;

  nameDur.set(name, (nameDur.get(name) || 0) + e.dur);
  catDur.set(cat, (catDur.get(cat) || 0) + e.dur);

  const n = name.toLowerCase();
  if (
    n.includes("input") ||
    n.includes("keyboard") ||
    n.includes("pointer") ||
    n.includes("interaction") ||
    n.includes("eventtiming") ||
    n.includes("inp")
  ) {
    if (e.dur >= 1000) interactionHints.push({ name, cat, dur: e.dur, ts: e.ts, tid: e.tid });
  }
}

completes.sort((a, b) => b.dur - a.dur);
interactionHints.sort((a, b) => b.dur - a.dur);

const topN = 40;
/** Chrome `dur` / `ts` are in microseconds; convert to milliseconds for display */
const usToMs = (d) => d / 1000;

console.log("File:", abs);
console.log("Events:", events.length);
console.log("Complete slices >=50ms (filtered cats):", completes.length);
console.log("RunTask >=50ms (all):", longTaskCount);
console.log("\nTop long slices (ms):");
for (const row of completes.slice(0, topN)) {
  console.log(
    `${usToMs(row.dur).toFixed(1)} ms\t${row.name}\t[${row.cat}] tid=${row.tid}`,
  );
}

const topNames = [...nameDur.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .map(([n, d]) => ({ n, ms: usToMs(d) }));
console.log("\nTop cumulative by event name (ms total, all X events):");
for (const { n, ms: t } of topNames) console.log(`${t.toFixed(0)} ms\t${n}`);

const topCats = [...catDur.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .map(([c, d]) => ({ c, ms: usToMs(d) }));
console.log("\nTop cumulative by category (ms total):");
for (const { c, ms: t } of topCats) console.log(`${t.toFixed(0)} ms\t${c}`);

console.log("\nInput/interaction-related completes >=1ms (top 30):");
for (const row of interactionHints.slice(0, 30)) {
  console.log(`${usToMs(row.dur).toFixed(1)} ms\t${row.name}\t[${row.cat}]`);
}
