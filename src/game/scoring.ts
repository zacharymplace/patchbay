import type { BoardState, FailureReason, ScoreState, Signal } from "./types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function isCorrectResolution(signal: Signal, board: BoardState): boolean {
  return board.truths[signal.id]?.idealOutput === signal.resolvedOutput;
}

export function calculateScore(board: BoardState): ScoreState {
  const totalResolved = board.resolvedSignals.length;
  const correctResolutions = board.resolvedSignals.filter((signal) =>
    isCorrectResolution(signal, board)
  ).length;

  const criticalMisses = board.resolvedSignals.filter(
    (signal) => signal.kind === "critical" && signal.resolvedOutput !== "alert"
  ).length;

  const falseAlerts = board.resolvedSignals.filter((signal) => {
    const truth = board.truths[signal.id];
    return signal.resolvedOutput === "alert" && truth?.idealOutput !== "alert";
  }).length;

  const misroutes = totalResolved - correctResolutions;

  const discardedUseful = board.resolvedSignals.filter(
    (signal) =>
      signal.resolvedOutput === "discard" &&
      (signal.kind === "useful" || signal.kind === "critical" || signal.kind === "volatile")
  ).length;

  const heldSignals = board.activeSignals.filter(
    (signal) => signal.heldTicks > 0 || signal.bufferTicks > 0
  ).length;

  const expiredSignals = board.resolvedSignals.filter((signal) =>
    signal.tags.includes("expired")
  ).length;

  const noisyAlerts = board.resolvedSignals.filter(
    (signal) => signal.kind === "noise" && signal.resolvedOutput === "alert"
  ).length;

  const volatileWrong = board.resolvedSignals.filter(
    (signal) => signal.kind === "volatile" && signal.resolvedOutput !== "review"
  ).length;

  const correctRate = totalResolved === 0 ? 1 : correctResolutions / totalResolved;

  const load = clamp(
    board.activeSignals.length * 6 +
      heldSignals * 4 +
      falseAlerts * 5 +
      criticalMisses * 8 +
      expiredSignals * 6
  );

  const clarity = clamp(55 + correctRate * 45 - misroutes * 2 - criticalMisses * 10);

  const stability = clamp(
    100 - load * 0.5 - falseAlerts * 3 - criticalMisses * 8 - expiredSignals * 4
  );

  const trust = clamp(
    100 -
      falseAlerts * 8 -
      discardedUseful * 8 -
      volatileWrong * 6 -
      noisyAlerts * 10 -
      criticalMisses * 10
  );

  return {
    clarity: Math.round(clarity),
    stability: Math.round(stability),
    trust: Math.round(trust),
    load: Math.round(load),
    criticalMisses,
    falseAlerts,
    misroutes,
    discardedUseful,
    heldSignals,
    expiredSignals,
    correctResolutions,
    totalResolved
  };
}

export function meetsStableThreshold(score: ScoreState): boolean {
  return (
    score.clarity >= 75 &&
    score.stability >= 70 &&
    score.trust >= 65 &&
    score.load <= 30 &&
    score.criticalMisses <= 1 &&
    score.falseAlerts <= 4
  );
}

export function getFailureReason(board: BoardState): FailureReason | undefined {
  const score = board.score;

  if (score.load >= 100) return "overload";
  if (score.criticalMisses >= 3) return "critical_miss";
  if (score.falseAlerts >= 8) return "false_alarm_cascade";
  if (score.misroutes >= 10) return "misroute";
  if (score.stability <= 20) return "overload";
  if (score.trust <= 20) return "noise_saturation";

  const analysisLocked = board.activeSignals.filter(
    (signal) => signal.heldTicks >= 8 || signal.bufferTicks >= 8
  ).length;

  if (analysisLocked >= 5) return "analysis_lock";

  return undefined;
}
