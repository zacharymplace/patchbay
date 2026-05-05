import type { BoardState, OperatingStyle, RunReport } from "./types";

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function generateRunReport(board: BoardState): RunReport {
  const score = board.score;
  const styles: OperatingStyle[] = [];
  const bestBehaviors: string[] = [];
  const riskPatterns: string[] = [];

  if (score.criticalMisses <= 1) {
    bestBehaviors.push("Critical signals generally reached Alert before expiring.");
  } else {
    riskPatterns.push("Critical signals were missed or delayed into the wrong output.");
  }

  if (board.outputCounts.discard > 0 && score.discardedUseful === 0) {
    bestBehaviors.push("Discard flow mostly removed true noise without losing useful signal.");
  }

  if (board.outputCounts.review > 0) {
    bestBehaviors.push("Ambiguous volatile signals were routed through Review.");
  }

  if (score.falseAlerts > 0) {
    riskPatterns.push("False alerts increased system pressure and reduced trust.");
    styles.push("fast_escalator");
  }

  if (score.discardedUseful > 0) {
    riskPatterns.push("Some useful or important signals were suppressed.");
    styles.push("suppressor");
  }

  if (score.heldSignals > 3) {
    riskPatterns.push("Held signals created backlog risk.");
    styles.push("cautious_steward");
  }

  const moduleCount = board.lanes.reduce((sum, lane) => sum + lane.modules.length, 0);

  if (moduleCount <= 5 && score.misroutes <= 3) {
    styles.push("clean_router");
  }

  if (moduleCount <= 4) {
    styles.push("minimalist");
  }

  if (moduleCount >= 8) {
    styles.push("overbuilder");
  }

  if (board.outputCounts.archive >= board.outputCounts.alert && board.outputCounts.archive > 0) {
    styles.push("archivist");
  }

  if (
    score.clarity >= 75 &&
    score.stability >= 70 &&
    score.trust >= 65 &&
    score.load <= 30
  ) {
    styles.push("calibrator");
  }

  if (bestBehaviors.length === 0) {
    bestBehaviors.push("The board completed a full run and produced a diagnosable trace.");
  }

  if (riskPatterns.length === 0) {
    riskPatterns.push("No major risk pattern detected in this run.");
  }

  return {
    result: board.status === "stable" ? "calibrated" : "failed",
    finalScore: score,
    peakLoad: board.peakLoad,
    bestBehaviors,
    riskPatterns,
    operatingStyle: unique(styles.length > 0 ? styles : ["calibrator"])
  };
}
