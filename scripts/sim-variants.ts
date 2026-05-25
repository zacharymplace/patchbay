import { createInitialBoard } from "../src/game/board";
import { generateRunReport } from "../src/game/report";
import { stepSimulation } from "../src/game/simulation";
import type { BoardModule, BoardPreset, BoardState } from "../src/game/types";

type Variant = {
  label: string;
  preset: BoardPreset;
  expectedPressure: string;
  expectedResult: "stable" | "failed";
  mutate: (board: BoardState) => BoardState;
};

function run(board: BoardState): BoardState {
  let current: BoardState = {
    ...board,
    status: "running"
  };

  while (current.status === "running" && current.tick < 200) {
    current = stepSimulation(current);
  }

  return current;
}

function mapModules(
  board: BoardState,
  mapper: (module: BoardModule) => BoardModule | undefined
): BoardState {
  return {
    ...board,
    lanes: board.lanes.map((lane) => ({
      ...lane,
      modules: lane.modules.flatMap((module) => {
        const next = mapper(module);
        return next ? [next] : [];
      })
    }))
  };
}

function labelStyle(style: string): string {
  return style
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

const variants: Variant[] = [
  {
    label: "Starter player board",
    preset: "starter",
    expectedPressure: "Should fail without player-added routing modules.",
    expectedResult: "failed",
    mutate: (board) => board
  },
  {
    label: "Calibrated smoke-test board",
    preset: "calibrated",
    expectedPressure: "Should stabilize with clean routing.",
    expectedResult: "stable",
    mutate: (board) => board
  },
  {
    label: "Over-filtering board",
    preset: "calibrated",
    expectedPressure: "Should suppress useful signal and create misroutes.",
    expectedResult: "failed",
    mutate: (board) =>
      mapModules(board, (module) => {
        if (module.kind === "filter") {
          return {
            ...module,
            strengthThreshold: 65
          };
        }

        return module;
      })
  },
  {
    label: "Alarm cascade board",
    preset: "calibrated",
    expectedPressure: "Should over-alert volatile signal and degrade trust.",
    expectedResult: "failed",
    mutate: (board) =>
      mapModules(board, (module) => {
        if (module.kind === "amplifier") {
          return {
            ...module,
            urgencyBoost: 22,
            strengthBoost: 15
          };
        }

        if (module.kind === "router") {
          return {
            ...module,
            routingMode: "by_urgency"
          };
        }

        return module;
      })
  },
  {
    label: "No-router board",
    preset: "calibrated",
    expectedPressure: "Should fall back to Review and fail through misrouting.",
    expectedResult: "failed",
    mutate: (board) =>
      mapModules(board, (module) => {
        if (module.kind === "router") {
          return undefined;
        }

        return module;
      })
  }
];

console.log("PATCHBAY VARIANT SIMULATION");
console.log("");

for (const variant of variants) {
  const initial = createInitialBoard("inbox_flood", variant.preset);
  const finalBoard = run(variant.mutate(initial));
  const report = generateRunReport(finalBoard);

  console.log(`## ${variant.label}`);
  console.log(`Preset: ${variant.preset}`);
  console.log(`Expected: ${variant.expectedPressure}`);
  console.log(`Result: ${finalBoard.status.toUpperCase()}`);
  console.log(`Ticks: ${finalBoard.tick}`);
  console.log(
    `Scores: clarity=${finalBoard.score.clarity} stability=${finalBoard.score.stability} trust=${finalBoard.score.trust} load=${finalBoard.score.load}`
  );
  console.log(
    `Counters: misses=${finalBoard.score.criticalMisses} falseAlerts=${finalBoard.score.falseAlerts} misroutes=${finalBoard.score.misroutes} discardedUseful=${finalBoard.score.discardedUseful}`
  );
  console.log(
    `Outputs: alert=${finalBoard.outputCounts.alert} archive=${finalBoard.outputCounts.archive} review=${finalBoard.outputCounts.review} discard=${finalBoard.outputCounts.discard}`
  );
  console.log(`Style: ${report.operatingStyle.map(labelStyle).join(", ")}`);

  if (finalBoard.failureReason) {
    console.log(`Failure Reason: ${finalBoard.failureReason}`);
  }

  const actualResult = finalBoard.status === "stable" ? "stable" : "failed";
  if (actualResult !== variant.expectedResult) {
    console.error(
      `ASSERTION FAILED: "${variant.label}" expected result=${variant.expectedResult}, got result=${actualResult}`
    );
    process.exit(1);
  }

  console.log("");
}
