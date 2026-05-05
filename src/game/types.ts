export type SignalKind = "noise" | "useful" | "critical" | "volatile";

export type SignalOutput = "alert" | "archive" | "review" | "discard";

export type ModuleKind = "filter" | "gate" | "router" | "buffer" | "amplifier";

export type RunStatus = "idle" | "running" | "stable" | "failed";

export type BoardPreset = "starter" | "calibrated";

export type FailureReason =
  | "overload"
  | "critical_miss"
  | "noise_saturation"
  | "false_alarm_cascade"
  | "analysis_lock"
  | "misroute";

export type Signal = {
  id: string;
  label: string;
  kind: SignalKind;

  urgency: number;
  confidence: number;
  strength: number;

  age: number;
  maxAge: number;

  currentLane: string;
  resolvedOutput?: SignalOutput;

  heldTicks: number;
  bufferTicks: number;
  tags: string[];
};

export type SignalTruth = {
  signalId: string;
  idealOutput: SignalOutput;
  harmIfMissed: number;
  harmIfOverreacted: number;
};

export type ModuleBase = {
  id: string;
  kind: ModuleKind;
  lane: string;
  position: number;
  enabled: boolean;
};

export type FilterModule = ModuleBase & {
  kind: "filter";
  strengthThreshold: number;
};

export type GateModule = ModuleBase & {
  kind: "gate";
  confidenceThreshold: number;
  urgencyOverride: number;
};

export type RouterModule = ModuleBase & {
  kind: "router";
  routingMode: "by_kind" | "by_urgency" | "by_confidence";
};

export type BufferModule = ModuleBase & {
  kind: "buffer";
  capacity: number;
  holdTicks: number;
};

export type AmplifierModule = ModuleBase & {
  kind: "amplifier";
  urgencyBoost: number;
  strengthBoost: number;
};

export type BoardModule =
  | FilterModule
  | GateModule
  | RouterModule
  | BufferModule
  | AmplifierModule;

export type BoardLane = {
  id: string;
  label: string;
  modules: BoardModule[];
};

export type ScoreState = {
  clarity: number;
  stability: number;
  trust: number;
  load: number;

  criticalMisses: number;
  falseAlerts: number;
  misroutes: number;
  discardedUseful: number;
  heldSignals: number;
  expiredSignals: number;
  correctResolutions: number;
  totalResolved: number;
};

export type GameEvent = {
  tick: number;
  severity: "info" | "warning" | "critical";
  message: string;
};

export type OutputCounts = Record<SignalOutput, number>;

export type BoardState = {
  scenarioId: string;
  scenarioLabel: string;
  maxTicks: number;

  tick: number;
  status: RunStatus;

  lanes: BoardLane[];
  activeSignals: Signal[];
  resolvedSignals: Signal[];
  truths: Record<string, SignalTruth>;

  outputCounts: OutputCounts;
  score: ScoreState;
  events: GameEvent[];

  stableTicks: number;
  peakLoad: number;
  failureReason?: FailureReason;
};

export type ScenarioWave = {
  id: string;
  label: string;
  startTick: number;
  endTick: number;
  mix: Record<SignalKind, number>;
  purpose: string;
};

export type SignalTemplate = {
  label: string;
  kind: SignalKind;
  urgency: number;
  confidence: number;
  strength: number;
  idealOutput: SignalOutput;
  harmIfMissed: number;
  harmIfOverreacted: number;
};

export type ScenarioDefinition = {
  id: string;
  label: string;
  maxTicks: number;
  waves: ScenarioWave[];
  templates: SignalTemplate[];
};

export type ModuleResult = {
  signal: Signal;
  resolvedOutput?: SignalOutput;
  held: boolean;
  events: GameEvent[];
};

export type OperatingStyle =
  | "clean_router"
  | "cautious_steward"
  | "fast_escalator"
  | "minimalist"
  | "overbuilder"
  | "suppressor"
  | "archivist"
  | "calibrator";

export type RunReport = {
  result: "calibrated" | "failed";
  finalScore: ScoreState;
  peakLoad: number;
  bestBehaviors: string[];
  riskPatterns: string[];
  operatingStyle: OperatingStyle[];
};
