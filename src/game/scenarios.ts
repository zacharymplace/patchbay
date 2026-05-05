import type { ScenarioDefinition, ScenarioWave, SignalKind, SignalTemplate } from "./types";

const inboxFloodWaves: ScenarioWave[] = [
  {
    id: "noise_floor",
    label: "Wave 1 — Noise Floor",
    startTick: 1,
    endTick: 25,
    mix: {
      noise: 60,
      useful: 25,
      critical: 10,
      volatile: 5
    },
    purpose: "Teach filtering and basic routing."
  },
  {
    id: "workload_spike",
    label: "Wave 2 — Workload Spike",
    startTick: 26,
    endTick: 55,
    mix: {
      noise: 30,
      useful: 35,
      critical: 25,
      volatile: 10
    },
    purpose: "Teach load management and critical preservation."
  },
  {
    id: "ambiguous_risk",
    label: "Wave 3 — Ambiguous Risk",
    startTick: 56,
    endTick: 90,
    mix: {
      noise: 25,
      useful: 25,
      critical: 20,
      volatile: 30
    },
    purpose: "Teach review routing and trust calibration."
  }
];

const inboxFloodSignals: SignalTemplate[] = [
  {
    label: "Vendor invoice due today",
    kind: "critical",
    urgency: 88,
    confidence: 91,
    strength: 76,
    idealOutput: "alert",
    harmIfMissed: 90,
    harmIfOverreacted: 10
  },
  {
    label: "Contract renewal notice",
    kind: "critical",
    urgency: 77,
    confidence: 83,
    strength: 71,
    idealOutput: "alert",
    harmIfMissed: 80,
    harmIfOverreacted: 12
  },
  {
    label: "Payroll approval deadline",
    kind: "critical",
    urgency: 93,
    confidence: 88,
    strength: 82,
    idealOutput: "alert",
    harmIfMissed: 95,
    harmIfOverreacted: 8
  },
  {
    label: "Newsletter promo",
    kind: "noise",
    urgency: 12,
    confidence: 85,
    strength: 18,
    idealOutput: "discard",
    harmIfMissed: 0,
    harmIfOverreacted: 22
  },
  {
    label: "Duplicate reminder",
    kind: "noise",
    urgency: 20,
    confidence: 88,
    strength: 24,
    idealOutput: "discard",
    harmIfMissed: 0,
    harmIfOverreacted: 20
  },
  {
    label: "Conference sponsor pitch",
    kind: "noise",
    urgency: 18,
    confidence: 73,
    strength: 29,
    idealOutput: "discard",
    harmIfMissed: 0,
    harmIfOverreacted: 18
  },
  {
    label: "Meeting notes attached",
    kind: "useful",
    urgency: 35,
    confidence: 78,
    strength: 52,
    idealOutput: "archive",
    harmIfMissed: 20,
    harmIfOverreacted: 8
  },
  {
    label: "Interesting research link",
    kind: "useful",
    urgency: 21,
    confidence: 64,
    strength: 44,
    idealOutput: "archive",
    harmIfMissed: 16,
    harmIfOverreacted: 6
  },
  {
    label: "Updated project brief",
    kind: "useful",
    urgency: 42,
    confidence: 81,
    strength: 58,
    idealOutput: "archive",
    harmIfMissed: 24,
    harmIfOverreacted: 7
  },
  {
    label: "Suspicious payment request",
    kind: "volatile",
    urgency: 82,
    confidence: 46,
    strength: 69,
    idealOutput: "review",
    harmIfMissed: 70,
    harmIfOverreacted: 55
  },
  {
    label: "Unknown sender asking for wire change",
    kind: "volatile",
    urgency: 91,
    confidence: 39,
    strength: 81,
    idealOutput: "review",
    harmIfMissed: 95,
    harmIfOverreacted: 75
  },
  {
    label: "Unusual login notification",
    kind: "volatile",
    urgency: 74,
    confidence: 52,
    strength: 67,
    idealOutput: "review",
    harmIfMissed: 65,
    harmIfOverreacted: 40
  }
];

export const inboxFloodScenario: ScenarioDefinition = {
  id: "inbox_flood",
  label: "Scenario 001 — Inbox Flood",
  maxTicks: 90,
  waves: inboxFloodWaves,
  templates: inboxFloodSignals
};

export const scenarios: ScenarioDefinition[] = [inboxFloodScenario];

export function getScenarioById(scenarioId: string): ScenarioDefinition {
  const scenario = scenarios.find((candidate) => candidate.id === scenarioId);

  if (!scenario) {
    throw new Error(`Unknown scenario id: ${scenarioId}`);
  }

  return scenario;
}

export function getWaveForTick(scenario: ScenarioDefinition, tick: number): ScenarioWave {
  return (
    scenario.waves.find((wave) => tick >= wave.startTick && tick <= wave.endTick) ??
    scenario.waves[scenario.waves.length - 1]
  );
}

export function templatesByKind(
  scenario: ScenarioDefinition,
  kind: SignalKind
): SignalTemplate[] {
  return scenario.templates.filter((template) => template.kind === kind);
}
