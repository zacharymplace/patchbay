import { getScenarioById } from "./scenarios";
import type { BoardLane, BoardState, OutputCounts, ScoreState } from "./types";

export function createInitialScore(): ScoreState {
  return {
    clarity: 75,
    stability: 100,
    trust: 100,
    load: 0,
    criticalMisses: 0,
    falseAlerts: 0,
    misroutes: 0,
    discardedUseful: 0,
    heldSignals: 0,
    expiredSignals: 0,
    correctResolutions: 0,
    totalResolved: 0
  };
}

export function createOutputCounts(): OutputCounts {
  return {
    alert: 0,
    archive: 0,
    review: 0,
    discard: 0
  };
}

export function createDefaultLanes(): BoardLane[] {
  return [
    {
      id: "intake",
      label: "Intake",
      modules: [
        {
          id: "filter-default",
          kind: "filter",
          lane: "intake",
          position: 1,
          enabled: true,
          strengthThreshold: 22
        }
      ]
    },
    {
      id: "processing",
      label: "Processing",
      modules: [
        {
          id: "buffer-default",
          kind: "buffer",
          lane: "processing",
          position: 1,
          enabled: true,
          capacity: 8,
          holdTicks: 1
        },
        {
          id: "gate-default",
          kind: "gate",
          lane: "processing",
          position: 2,
          enabled: true,
          confidenceThreshold: 45,
          urgencyOverride: 78
        },
        {
          id: "amplifier-default",
          kind: "amplifier",
          lane: "processing",
          position: 3,
          enabled: true,
          urgencyBoost: 3,
          strengthBoost: 2
        }
      ]
    },
    {
      id: "resolution",
      label: "Resolution",
      modules: [
        {
          id: "router-default",
          kind: "router",
          lane: "resolution",
          position: 1,
          enabled: true,
          routingMode: "by_kind"
        }
      ]
    }
  ];
}

export function createInitialBoard(scenarioId = "inbox_flood"): BoardState {
  const scenario = getScenarioById(scenarioId);

  return {
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    maxTicks: scenario.maxTicks,
    tick: 0,
    status: "idle",
    lanes: createDefaultLanes(),
    activeSignals: [],
    resolvedSignals: [],
    truths: {},
    outputCounts: createOutputCounts(),
    score: createInitialScore(),
    events: [
      {
        tick: 0,
        severity: "info",
        message: `${scenario.label} loaded. Board is idle.`
      }
    ],
    stableTicks: 0,
    peakLoad: 0
  };
}
