import { addModuleToLane } from "../src/game/actions";
import { createInitialBoard } from "../src/game/board";
import { generateRunReport } from "../src/game/report";
import { stepSimulation } from "../src/game/simulation";
import type { BoardState } from "../src/game/types";

function labelStyle(style: string): string {
  return style
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function installBasicRoutingPlan(board: BoardState): BoardState {
  let next = board;

  next = addModuleToLane(next, {
    kind: "filter",
    laneId: "intake",
    config: {
      strengthThreshold: 22
    }
  });

  next = addModuleToLane(next, {
    kind: "buffer",
    laneId: "processing",
    config: {
      capacity: 8,
      holdTicks: 1
    }
  });

  next = addModuleToLane(next, {
    kind: "gate",
    laneId: "processing",
    config: {
      confidenceThreshold: 45,
      urgencyOverride: 78
    }
  });

  next = addModuleToLane(next, {
    kind: "amplifier",
    laneId: "processing",
    config: {
      urgencyBoost: 3,
      strengthBoost: 2
    }
  });

  next = addModuleToLane(next, {
    kind: "router",
    laneId: "resolution",
    config: {
      routingMode: "by_kind"
    }
  });

  return next;
}

let board = createInitialBoard("inbox_flood", "starter");

board = installBasicRoutingPlan(board);
board = {
  ...board,
  status: "running"
};

while (board.status === "running" && board.tick < 200) {
  board = stepSimulation(board);
}

const report = generateRunReport(board);

console.log("PATCHBAY STARTER PLAYER PLAN");
console.log("");
console.log(`Scenario: ${board.scenarioLabel}`);
console.log(`Ticks Simulated: ${board.tick}`);
console.log(`Result: ${board.status.toUpperCase()}`);
console.log("");

console.log("Installed Modules:");
for (const lane of board.lanes) {
  const moduleLabels =
    lane.modules.length === 0
      ? "none"
      : lane.modules.map((module) => module.kind).join(", ");

  console.log(`- ${lane.label}: ${moduleLabels}`);
}
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

console.log("Operating Style:");
for (const style of report.operatingStyle) {
  console.log(`- ${labelStyle(style)}`);
}

if (board.failureReason) {
  console.log("");
  console.log(`Failure Reason: ${board.failureReason}`);
}

console.log("");
console.log("Recent Events:");
for (const event of board.events.slice(-8)) {
  console.log(`- Tick ${String(event.tick).padStart(3, "0")}: ${event.message}`);
}
