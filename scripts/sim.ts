import { createInitialBoard } from "../src/game/board";
import { generateRunReport } from "../src/game/report";
import { stepSimulation } from "../src/game/simulation";

function labelStyle(style: string): string {
  return style
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

let board = createInitialBoard("inbox_flood", "calibrated");
board = {
  ...board,
  status: "running"
};

while (board.status === "running" && board.tick < 200) {
  board = stepSimulation(board);
}

const report = generateRunReport(board);
const recentEvents = board.events.slice(-8);

console.log(`Scenario: ${board.scenarioLabel}`);
console.log(`Ticks Simulated: ${board.tick}`);
console.log(`Result: ${board.status.toUpperCase()}`);
console.log("");

console.log("Final Scores:");
console.log(`Clarity: ${board.score.clarity}`);
console.log(`Stability: ${board.score.stability}`);
console.log(`Trust: ${board.score.trust}`);
console.log(`Load: ${board.score.load}`);
console.log("");

console.log("Counters:");
console.log(`Critical Misses: ${board.score.criticalMisses}`);
console.log(`False Alerts: ${board.score.falseAlerts}`);
console.log(`Misroutes: ${board.score.misroutes}`);
console.log(`Discarded Useful: ${board.score.discardedUseful}`);
console.log(`Resolved: ${board.score.totalResolved}`);
console.log("");

console.log("Outputs:");
console.log(`Alert: ${board.outputCounts.alert}`);
console.log(`Archive: ${board.outputCounts.archive}`);
console.log(`Review: ${board.outputCounts.review}`);
console.log(`Discard: ${board.outputCounts.discard}`);
console.log("");

console.log("Operating Style:");
for (const style of report.operatingStyle) {
  console.log(`- ${labelStyle(style)}`);
}
console.log("");

console.log("Best Behaviors:");
for (const behavior of report.bestBehaviors) {
  console.log(`- ${behavior}`);
}
console.log("");

console.log("Risk Patterns:");
for (const risk of report.riskPatterns) {
  console.log(`- ${risk}`);
}
console.log("");

console.log("Recent Events:");
for (const event of recentEvents) {
  console.log(`- Tick ${String(event.tick).padStart(3, "0")}: ${event.message}`);
}

if (board.status !== "stable") {
  console.log("");
  console.log(`Failure Reason: ${board.failureReason ?? "unknown"}`);
  console.error(`ASSERTION FAILED: calibrated board expected status=stable, got status=${board.status}`);
  process.exit(1);
}
