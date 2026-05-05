import { applyModule, getEnabledModules } from "./modules";
import { getScenarioById, getWaveForTick, templatesByKind } from "./scenarios";
import { calculateScore, getFailureReason, meetsStableThreshold } from "./scoring";
import type {
  BoardState,
  GameEvent,
  ModuleResult,
  ScenarioDefinition,
  Signal,
  SignalKind,
  SignalOutput,
  SignalTemplate,
  SignalTruth
} from "./types";

function deterministicFraction(seed: number): number {
  const value = Math.sin(seed * 999.1337) * 10000;
  return value - Math.floor(value);
}

function chooseKind(mix: Record<SignalKind, number>, seed: number): SignalKind {
  const roll = deterministicFraction(seed) * 100;
  let cumulative = 0;

  const order: SignalKind[] = ["noise", "useful", "critical", "volatile"];

  for (const kind of order) {
    cumulative += mix[kind];

    if (roll <= cumulative) {
      return kind;
    }
  }

  return "noise";
}

function chooseTemplate(
  scenario: ScenarioDefinition,
  kind: SignalKind,
  seed: number
): SignalTemplate {
  const candidates = templatesByKind(scenario, kind);

  if (candidates.length === 0) {
    throw new Error(`No signal templates found for kind: ${kind}`);
  }

  const index = Math.floor(deterministicFraction(seed) * candidates.length);
  return candidates[index] ?? candidates[0];
}

function maxAgeForTemplate(template: SignalTemplate): number {
  if (template.kind === "critical") return 9;
  if (template.kind === "volatile") return 12;
  if (template.kind === "useful") return 16;
  return 20;
}

function signalFromTemplate(
  template: SignalTemplate,
  tick: number,
  spawnIndex: number
): { signal: Signal; truth: SignalTruth } {
  const id = `sig-${tick}-${spawnIndex}-${template.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

  return {
    signal: {
      id,
      label: template.label,
      kind: template.kind,
      urgency: template.urgency,
      confidence: template.confidence,
      strength: template.strength,
      age: 0,
      maxAge: maxAgeForTemplate(template),
      currentLane: "intake",
      heldTicks: 0,
      bufferTicks: 0,
      tags: []
    },
    truth: {
      signalId: id,
      idealOutput: template.idealOutput,
      harmIfMissed: template.harmIfMissed,
      harmIfOverreacted: template.harmIfOverreacted
    }
  };
}

function spawnSignals(board: BoardState): { signals: Signal[]; truths: SignalTruth[]; events: GameEvent[] } {
  const scenario = getScenarioById(board.scenarioId);

  if (board.tick >= scenario.maxTicks) {
    return {
      signals: [],
      truths: [],
      events: []
    };
  }

  const wave = getWaveForTick(scenario, board.tick);
  const spawnCount = board.tick % 7 === 0 ? 2 : 1;

  const signals: Signal[] = [];
  const truths: SignalTruth[] = [];
  const events: GameEvent[] = [];

  for (let index = 0; index < spawnCount; index += 1) {
    const seed = board.tick * 31 + index * 17;
    const kind = chooseKind(wave.mix, seed);
    const template = chooseTemplate(scenario, kind, seed + 13);
    const created = signalFromTemplate(template, board.tick, index);

    signals.push(created.signal);
    truths.push(created.truth);
    events.push({
      tick: board.tick,
      severity: "info",
      message: `${created.signal.label} entered the board.`
    });
  }

  return { signals, truths, events };
}

function trimEvents(events: GameEvent[]): GameEvent[] {
  return events.slice(-80);
}

function fallbackOutput(_signal: Signal): SignalOutput {
  // Without an explicit Router, the board defaults to safe-but-slow Review.
  // This prevents no-router boards from becoming magically perfect.
  return "review";
}

function processSignalThroughModules(signal: Signal, board: BoardState): ModuleResult {
  let currentSignal = signal;
  const events: GameEvent[] = [];

  for (const module of getEnabledModules(board)) {
    const result = applyModule(currentSignal, module, board);
    events.push(...result.events);
    currentSignal = result.signal;

    if (result.resolvedOutput) {
      return {
        signal: currentSignal,
        resolvedOutput: result.resolvedOutput,
        held: false,
        events
      };
    }

    if (result.held) {
      return {
        signal: currentSignal,
        held: true,
        events
      };
    }
  }

  return {
    signal: currentSignal,
    resolvedOutput: fallbackOutput(currentSignal),
    held: false,
    events
  };
}

export function resolveSignal(
  signal: Signal,
  output: SignalOutput,
  board: BoardState
): BoardState {
  const truth = board.truths[signal.id];
  const isCorrect = truth?.idealOutput === output;

  const resolvedSignal: Signal = {
    ...signal,
    currentLane: "resolved",
    resolvedOutput: output
  };

  const message = isCorrect
    ? `${signal.label} correctly resolved to ${output.toUpperCase()}.`
    : `${signal.label} misrouted to ${output.toUpperCase()}${
        truth ? `; ideal was ${truth.idealOutput.toUpperCase()}` : ""
      }.`;

  return {
    ...board,
    resolvedSignals: [...board.resolvedSignals, resolvedSignal],
    outputCounts: {
      ...board.outputCounts,
      [output]: board.outputCounts[output] + 1
    },
    events: [
      ...board.events,
      {
        tick: board.tick,
        severity: isCorrect ? "info" : "warning",
        message
      }
    ]
  };
}

export function stepSimulation(board: BoardState): BoardState {
  if (board.status !== "running") {
    return board;
  }

  let next: BoardState = {
    ...board,
    tick: board.tick + 1,
    activeSignals: board.activeSignals.map((signal) => ({
      ...signal,
      age: signal.age + 1
    })),
    events: [...board.events],
    truths: { ...board.truths },
    resolvedSignals: [...board.resolvedSignals],
    outputCounts: { ...board.outputCounts }
  };

  const spawned = spawnSignals(next);
  next.activeSignals = [...next.activeSignals, ...spawned.signals];

  for (const truth of spawned.truths) {
    next.truths[truth.signalId] = truth;
  }

  next.events.push(...spawned.events);

  const remainingSignals: Signal[] = [];

  for (const signal of next.activeSignals) {
    if (signal.age > signal.maxAge) {
      const expiredSignal: Signal = {
        ...signal,
        tags: signal.tags.includes("expired") ? signal.tags : [...signal.tags, "expired"]
      };

      next = resolveSignal(expiredSignal, "discard", next);
      next.events.push({
        tick: next.tick,
        severity: signal.kind === "critical" ? "critical" : "warning",
        message: `${signal.label} expired before clean resolution.`
      });
      continue;
    }

    const processed = processSignalThroughModules(signal, next);
    next.events.push(...processed.events);

    if (processed.resolvedOutput) {
      next = resolveSignal(processed.signal, processed.resolvedOutput, next);
    } else {
      remainingSignals.push(processed.signal);
    }
  }

  next.activeSignals = remainingSignals;
  next.score = calculateScore(next);
  next.peakLoad = Math.max(next.peakLoad, next.score.load);

  const failureReason = getFailureReason(next);

  if (failureReason) {
    next.status = "failed";
    next.failureReason = failureReason;
    next.events.push({
      tick: next.tick,
      severity: "critical",
      message: `Run failed: ${failureReason.replaceAll("_", " ")}.`
    });

    return {
      ...next,
      events: trimEvents(next.events)
    };
  }

  next.stableTicks = meetsStableThreshold(next.score) ? next.stableTicks + 1 : 0;

  if (next.tick >= next.maxTicks) {
    if (next.stableTicks >= 30) {
      next.status = "stable";
      next.events.push({
        tick: next.tick,
        severity: "info",
        message: "Run calibrated. Board held stable through the final wave."
      });
    } else {
      next.status = "failed";
      next.failureReason = "overload";
      next.events.push({
        tick: next.tick,
        severity: "critical",
        message: "Run failed: board did not hold a stable operating window."
      });
    }
  }

  return {
    ...next,
    events: trimEvents(next.events)
  };
}
