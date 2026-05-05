import { createInitialBoard } from "../src/game/board";
import { generateRunReport } from "../src/game/report";
import { stepSimulation } from "../src/game/simulation";
import type { BoardModule, BoardState } from "../src/game/types";

type Variant = {
  label: string;
  expectedPressure: string;
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
    label: "Calibrated default board",
    expectedPressure: "Should stabilize with clean routing.",
    mutate: (board) => board
  },
  {
    label: "Over-filtering board",
    expectedPressure: "Should suppress useful signal and create misroutes.",
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
    expectedPressure: "Should over-alert volatile signal and degrade trust.",
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
    expectedPressure: "Should fall back to Review and fail through misrouting.",
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
  const initial = createInitialBoard("inbox_flood");
  const finalBoard = run(variant.mutate(initial));
  const report = generateRunReport(finalBoard);

  console.log(`## ${variant.label}`);
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
  console.log(
    `Style: ${report.operatingStyle.map(labelStyle).join(", ")}`
  );

  if (finalBoard.failureReason) {
    console.log(`Failure Reason: ${finalBoard.failureReason}`);
  }

  console.log("");
}
