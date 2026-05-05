import type {
  BoardModule,
  BoardState,
  GameEvent,
  ModuleResult,
  Signal,
  SignalOutput
} from "./types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function event(tick: number, severity: GameEvent["severity"], message: string): GameEvent {
  return { tick, severity, message };
}

function tagSignal(signal: Signal, tag: string): Signal {
  if (signal.tags.includes(tag)) {
    return signal;
  }

  return {
    ...signal,
    tags: [...signal.tags, tag]
  };
}

function routeByKind(signal: Signal): SignalOutput {
  if (signal.kind === "noise") return "discard";
  if (signal.kind === "useful") return "archive";
  if (signal.kind === "critical") return "alert";
  return "review";
}

function routeByUrgency(signal: Signal): SignalOutput {
  if (signal.urgency >= 75) return "alert";
  if (signal.urgency >= 45) return "review";
  return signal.kind === "noise" ? "discard" : "archive";
}

function routeByConfidence(signal: Signal): SignalOutput {
  if (signal.confidence >= 70 && signal.kind === "critical") return "alert";
  if (signal.confidence >= 70 && signal.kind === "useful") return "archive";
  if (signal.confidence < 60 && signal.kind === "volatile") return "review";
  if (signal.confidence < 60 && signal.kind === "noise") return "discard";
  return routeByKind(signal);
}

export function applyModule(
  signal: Signal,
  module: BoardModule,
  board: BoardState
): ModuleResult {
  if (!module.enabled) {
    return {
      signal,
      held: false,
      events: []
    };
  }

  if (module.kind === "filter") {
    if (signal.strength < module.strengthThreshold) {
      return {
        signal: tagSignal(signal, "filtered"),
        resolvedOutput: "discard",
        held: false,
        events: [
          event(
            board.tick,
            signal.kind === "noise" ? "info" : "warning",
            `${signal.label} suppressed by Filter.`
          )
        ]
      };
    }

    return {
      signal,
      held: false,
      events: []
    };
  }

  if (module.kind === "gate") {
    const passes =
      signal.confidence >= module.confidenceThreshold ||
      signal.urgency >= module.urgencyOverride;

    if (passes) {
      return {
        signal: {
          ...signal,
          heldTicks: 0
        },
        held: false,
        events: []
      };
    }

    return {
      signal: {
        ...tagSignal(signal, "held_by_gate"),
        heldTicks: signal.heldTicks + 1
      },
      held: true,
      events: [
        event(
          board.tick,
          signal.heldTicks >= 4 ? "warning" : "info",
          `${signal.label} held by Gate for more confidence.`
        )
      ]
    };
  }

  if (module.kind === "buffer") {
    const activeBufferCount = board.activeSignals.filter((candidate) =>
      candidate.tags.includes("held_by_buffer")
    ).length;

    if (activeBufferCount >= module.capacity) {
      return {
        signal: tagSignal(signal, "buffer_full"),
        held: false,
        events: [
          event(
            board.tick,
            "warning",
            `Buffer is full; ${signal.label} passed forward under load.`
          )
        ]
      };
    }

    if (signal.bufferTicks < module.holdTicks) {
      return {
        signal: {
          ...tagSignal(signal, "held_by_buffer"),
          bufferTicks: signal.bufferTicks + 1
        },
        held: true,
        events: [
          event(board.tick, "info", `${signal.label} buffered to smooth load.`)
        ]
      };
    }

    return {
      signal: {
        ...signal,
        bufferTicks: 0,
        tags: signal.tags.filter((tag) => tag !== "held_by_buffer")
      },
      held: false,
      events: []
    };
  }

  if (module.kind === "amplifier") {
    const amplifiedSignal = tagSignal(
      {
        ...signal,
        urgency: clamp(signal.urgency + module.urgencyBoost),
        strength: clamp(signal.strength + module.strengthBoost)
      },
      "amplified"
    );

    return {
      signal: amplifiedSignal,
      held: false,
      events:
        signal.kind === "noise"
          ? [
              event(
                board.tick,
                "warning",
                `${signal.label} was amplified despite looking like noise.`
              )
            ]
          : []
    };
  }

  if (module.kind === "router") {
    const resolvedOutput =
      module.routingMode === "by_kind"
        ? routeByKind(signal)
        : module.routingMode === "by_urgency"
          ? routeByUrgency(signal)
          : routeByConfidence(signal);

    return {
      signal,
      resolvedOutput,
      held: false,
      events: [
        event(
          board.tick,
          "info",
          `${signal.label} routed to ${resolvedOutput.toUpperCase()}.`
        )
      ]
    };
  }

  return {
    signal,
    held: false,
    events: []
  };
}

export function getEnabledModules(board: BoardState): BoardModule[] {
  return board.lanes
    .flatMap((lane) => lane.modules)
    .filter((module) => module.enabled)
    .sort((left, right) => {
      if (left.lane === right.lane) {
        return left.position - right.position;
      }

      const laneOrder = ["intake", "processing", "resolution"];
      return laneOrder.indexOf(left.lane) - laneOrder.indexOf(right.lane);
    });
}
