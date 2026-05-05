# PATCHBAY_MVP_BUILD_SPEC.md

Status: v0.1 Build Spec  
Game: Patchbay  
Scope: First playable vertical slice  
Primary Scenario: Scenario 001 — Inbox Flood

---

## 1. Game Thesis

Patchbay is a systems puzzle game about building calm judgment into noisy environments.

The player does not manually solve every signal. The player designs the board that decides how signals should move, pause, escalate, archive, or disappear.

Core promise:

> Route the signal. Tune the system. Don't let the board lie to you.

---

## 2. MVP Objective

Build one playable scenario where the player routes incoming signals through a simple module board into correct outputs while managing clarity, stability, trust, and load.

The MVP should prove:

1. The simulation engine works without the UI.
2. Signals can move through modules.
3. Modules create meaningful tradeoffs.
4. Outputs can be scored.
5. The player can win or fail.
6. The UI can visualize the current board state.
7. A post-run report can diagnose the player's operating style.

---

## 3. Non-Goals for v0.1

Do not build the following yet:

- Campaign
- Advisors
- Save system
- Account system
- Multiplayer
- Procedural generation
- AI-generated scenarios
- Drag-and-drop polish
- Sound design
- Complex animations
- Full narrative layer
- Multiple scenarios
- Persistent player profile

The first build should be small, playable, and testable.

---

## 4. Recommended Repo Structure

```txt
patchbay/
  app/
    page.tsx

  scripts/
    sim.ts

  src/
    game/
      types.ts
      signals.ts
      modules.ts
      board.ts
      scoring.ts
      simulation.ts
      scenarios.ts
      report.ts

    ui/
      GameScreen.tsx
      ModulePalette.tsx
      SignalBoard.tsx
      ScorePanel.tsx
      EventLog.tsx
      InspectorPanel.tsx
      RunReport.tsx

  docs/
    PATCHBAY_MVP_BUILD_SPEC.md
```

Engine first. UI second.

The simulation should be runnable with:

```bash
npm run sim
```

---

## 5. Core Game Loop

The player loop:

```txt
Build -> Observe -> Diagnose -> Adjust -> Stabilize
```

Gameplay flow:

1. Scenario starts.
2. Signals enter the board over time.
3. Player places modules into lanes.
4. Signals move through modules.
5. Modules transform, delay, suppress, route, or amplify signals.
6. Signals eventually reach outputs.
7. Outputs are scored.
8. The system updates clarity, stability, trust, and load.
9. The player wins by keeping the system stable.
10. The player fails if overload, missed criticals, or false alarm cascades become too severe.

---

## 6. Core Types

```ts
export type SignalKind =
  | "noise"
  | "useful"
  | "critical"
  | "volatile";

export type SignalOutput =
  | "alert"
  | "archive"
  | "review"
  | "discard";

export type ModuleKind =
  | "filter"
  | "gate"
  | "router"
  | "buffer"
  | "amplifier";

export type RunStatus =
  | "idle"
  | "running"
  | "stable"
  | "failed";

export type FailureReason =
  | "overload"
  | "critical_miss"
  | "noise_saturation"
  | "false_alarm_cascade"
  | "analysis_lock"
  | "misroute";
```

---

## 7. Signal Model

Each signal has visible traits and hidden truth.

### Visible Traits

```ts
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
};
```

### Hidden Truth

```ts
export type SignalTruth = {
  signalId: string;
  idealOutput: SignalOutput;
  harmIfMissed: number;
  harmIfOverreacted: number;
};
```

Hidden truth is used for scoring. The player should not directly see it.

---

## 8. Outputs

The v0.1 board uses four outputs.

| Output | Purpose |
|---|---|
| Alert | Critical signal that needs attention |
| Archive | Useful signal worth preserving |
| Review | Volatile or ambiguous signal needing judgment |
| Discard | True noise |

Do not include `Act` in v0.1. Add it later once basic routing is fun.

---

## 9. Module Model

```ts
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
```

---

## 10. Module Behavior

### Filter

Purpose: suppress low-strength noise.

Behavior:

```txt
If signal.strength < strengthThreshold:
  discard signal
Else:
  pass signal forward
```

Tradeoff:

- Helps reduce noise.
- Can incorrectly discard weak useful or critical signal.

Failure pattern:

```txt
suppression_bias
```

---

### Gate

Purpose: prevent low-confidence signals from moving too quickly.

Behavior:

```txt
If signal.confidence >= confidenceThreshold:
  pass signal forward
Else if signal.urgency >= urgencyOverride:
  pass signal forward
Else:
  hold signal
```

Tradeoff:

- Helps avoid reckless escalation.
- Can create bottlenecks and analysis lock.

Failure pattern:

```txt
analysis_lock
```

---

### Router

Purpose: direct signals toward likely correct outputs.

Behavior:

```txt
If routingMode = by_kind:
  noise -> discard
  useful -> archive
  critical -> alert
  volatile -> review

If routingMode = by_urgency:
  high urgency -> alert
  medium urgency -> review
  low urgency -> archive or discard based on kind

If routingMode = by_confidence:
  high confidence + useful -> archive
  high confidence + critical -> alert
  low confidence + volatile -> review
  low confidence + noise -> discard
```

Tradeoff:

- Helps organize flow.
- Bad routing causes misclassification.

Failure pattern:

```txt
misroute
```

---

### Buffer

Purpose: temporarily hold signals to smooth load.

Behavior:

```txt
Hold up to capacity signals.
Release after holdTicks.
If full, increase load.
```

Tradeoff:

- Prevents overload spikes.
- Delays critical signals and may create backlog.

Failure pattern:

```txt
delay_critical
```

---

### Amplifier

Purpose: boost signal urgency and strength.

Behavior:

```txt
signal.urgency += urgencyBoost
signal.strength += strengthBoost
Clamp both to 100
```

Tradeoff:

- Helps important signals break through.
- Can turn false positives into false alarms.

Failure pattern:

```txt
false_alarm_cascade
```

---

## 11. Board Model

For v0.1, use a simple lane-based board.

```ts
export type BoardLane = {
  id: string;
  label: string;
  modules: BoardModule[];
};

export type BoardState = {
  tick: number;
  status: RunStatus;

  lanes: BoardLane[];
  activeSignals: Signal[];
  resolvedSignals: Signal[];

  score: ScoreState;
  events: GameEvent[];

  failureReason?: FailureReason;
};
```

Initial lanes:

```txt
Lane 1: Intake
Lane 2: Processing
Lane 3: Resolution
```

The UI can represent this simply as left-to-right movement.

---

## 12. Tick Lifecycle

Every simulation tick should follow this order:

```txt
1. Increment tick.
2. Spawn new signals based on scenario wave.
3. Age all active signals.
4. Move signals through board lanes.
5. Apply module effects.
6. Resolve signals that reach outputs.
7. Score resolved signals.
8. Update load, clarity, stability, and trust.
9. Log notable events.
10. Check win/failure conditions.
```

This lifecycle should live in `src/game/simulation.ts`.

---

## 13. Scoring Model

The MVP has four main meters.

```ts
export type ScoreState = {
  clarity: number;
  stability: number;
  trust: number;
  load: number;

  criticalMisses: number;
  falseAlerts: number;
  misroutes: number;
  discardedUseful: number;
};
```

### Clarity

Measures whether useful and critical signals reach the right outputs.

Positive:

```txt
critical -> alert
useful -> archive
volatile -> review
noise -> discard
```

Negative:

```txt
critical -> discard/archive
useful -> discard
noise -> alert/review/archive
volatile -> alert/discard
```

### Stability

Measures system health.

Reduced by:

- high load
- too many held signals
- too many unresolved signals
- repeated false alerts
- signals exceeding max age

### Trust

Measures whether the board acts appropriately relative to confidence.

Reduced by:

- low-confidence signals going to Alert
- high-confidence critical signals being delayed
- volatile signals being discarded
- noisy signals being amplified

### Load

Measures unresolved pressure.

Increased by:

- active queue growth
- full buffers
- held gate signals
- aging unresolved signals

Decreased by:

- correct resolution
- discarding true noise
- archiving useful signals
- alerting critical signals correctly

---

## 14. Win Condition

The player wins when the board holds a stable state for 30 consecutive ticks.

Required state:

```txt
clarity >= 75
stability >= 70
trust >= 65
load <= 30
criticalMisses <= 1
falseAlerts <= 4
```

Success status:

```txt
stable
```

Preferred success label:

```txt
Calibrated
```

---

## 15. Failure Conditions

The player fails if any of these occur:

```txt
load >= 100
criticalMisses >= 3
falseAlerts >= 8
misroutes >= 10
stability <= 20
trust <= 20
```

Failure labels:

| Failure | Trigger |
|---|---|
| Overload | load >= 100 |
| Critical Miss | criticalMisses >= 3 |
| False Alarm Cascade | falseAlerts >= 8 |
| Misroute | misroutes >= 10 |
| Analysis Lock | too many held signals for too long |
| Noise Saturation | too much noise reaches non-discard outputs |

---

## 16. Scenario 001 — Inbox Flood

### Premise

The board is receiving a messy inbox stream. The player must suppress junk, preserve useful items, surface critical items, and route suspicious/ambiguous items to review.

The win condition is not processing everything.

The win condition is correct flow under pressure.

---

## 17. Scenario Waves

Scenario 001 has three waves.

### Wave 1 — Noise Floor

Ticks:

```txt
1-25
```

Signal mix:

```txt
60% noise
25% useful
10% critical
5% volatile
```

Purpose:

```txt
Teach filtering and basic routing.
```

### Wave 2 — Workload Spike

Ticks:

```txt
26-55
```

Signal mix:

```txt
30% noise
35% useful
25% critical
10% volatile
```

Purpose:

```txt
Teach load management and critical preservation.
```

### Wave 3 — Ambiguous Risk

Ticks:

```txt
56-90
```

Signal mix:

```txt
25% noise
25% useful
20% critical
30% volatile
```

Purpose:

```txt
Teach review routing and trust calibration.
```

---

## 18. Example Signals

```ts
export const inboxFloodSignals = [
  {
    label: "Vendor invoice due today",
    kind: "critical",
    urgency: 88,
    confidence: 91,
    strength: 76,
    idealOutput: "alert"
  },
  {
    label: "Newsletter promo",
    kind: "noise",
    urgency: 12,
    confidence: 85,
    strength: 18,
    idealOutput: "discard"
  },
  {
    label: "Meeting notes attached",
    kind: "useful",
    urgency: 35,
    confidence: 78,
    strength: 52,
    idealOutput: "archive"
  },
  {
    label: "Suspicious payment request",
    kind: "volatile",
    urgency: 82,
    confidence: 46,
    strength: 69,
    idealOutput: "review"
  },
  {
    label: "Duplicate reminder",
    kind: "noise",
    urgency: 20,
    confidence: 88,
    strength: 24,
    idealOutput: "discard"
  },
  {
    label: "Contract renewal notice",
    kind: "critical",
    urgency: 77,
    confidence: 83,
    strength: 71,
    idealOutput: "alert"
  },
  {
    label: "Interesting research link",
    kind: "useful",
    urgency: 21,
    confidence: 64,
    strength: 44,
    idealOutput: "archive"
  },
  {
    label: "Unknown sender asking for wire change",
    kind: "volatile",
    urgency: 91,
    confidence: 39,
    strength: 81,
    idealOutput: "review"
  }
];
```

---

## 19. Event Log

The game should emit readable events.

```ts
export type GameEvent = {
  tick: number;
  severity: "info" | "warning" | "critical";
  message: string;
};
```

Example events:

```txt
Tick 008: Noise suppressed by Filter.
Tick 014: Critical signal reached Alert.
Tick 021: Useful signal was incorrectly discarded.
Tick 037: Buffer is near capacity.
Tick 048: Low-confidence volatile signal routed to Review.
Tick 063: False alert increased system load.
Tick 076: Analysis lock risk detected.
```

The event log is important because it teaches the player what happened.

---

## 20. Post-Run Report

At the end of a run, generate a report.

```ts
export type RunReport = {
  result: "calibrated" | "failed";
  finalScore: ScoreState;
  peakLoad: number;
  bestBehaviors: string[];
  riskPatterns: string[];
  operatingStyle: OperatingStyle[];
};
```

Operating styles:

```ts
export type OperatingStyle =
  | "clean_router"
  | "cautious_steward"
  | "fast_escalator"
  | "minimalist"
  | "overbuilder"
  | "suppressor"
  | "archivist"
  | "calibrator";
```

Example report:

```txt
RUN REPORT

Result: Calibrated

Final Clarity: 81
Final Stability: 76
Final Trust: 72
Peak Load: 42

Best behavior:
- Critical signals reached Alert quickly.
- Noise was mostly discarded.
- Volatile signals were routed to Review.

Risk pattern:
- Useful low-strength signals were sometimes filtered.
- Review capacity was nearly saturated.

Operating style detected:
- Cautious Steward
- Slight Suppressor
```

---

## 21. UI Layout

Use a simple single-screen layout.

```txt
PATCHBAY                              Tick 042  RUNNING

MODULES          SIGNAL BOARD                    SCORE
Filter           Input -> [ ] -> [ ] -> Alert    Clarity   78
Gate                     ↓                       Stability 81
Router                 [Gate] -> Review          Trust     69
Buffer                                            Load      24
Amplifier

EVENT LOG
Critical signal reached Alert
Noise suppressed by Filter
Volatile signal routed to Review
```

MVP UI should include:

- Module palette
- Board lanes
- Active signal list
- Output counts
- Score panel
- Event log
- Run controls
- Post-run report

Run controls:

```txt
Start
Pause
Step Tick
Reset
```

---

## 22. Component Responsibilities

### GameScreen

Owns high-level UI state and calls the simulation engine.

### ModulePalette

Displays available modules and lets player add them to the board.

### SignalBoard

Visualizes lanes, modules, active signals, and outputs.

### ScorePanel

Displays clarity, stability, trust, load, and failure counters.

### EventLog

Displays recent game events.

### InspectorPanel

Shows selected signal or module details.

### RunReport

Displays end-of-run diagnosis.

---

## 23. Engine Requirements

The engine must be pure TypeScript and independent from React.

Required exported functions:

```ts
createInitialBoard(scenarioId: string): BoardState

stepSimulation(board: BoardState): BoardState

applyModule(signal: Signal, module: BoardModule, board: BoardState): ModuleResult

resolveSignal(signal: Signal, output: SignalOutput, board: BoardState): BoardState

calculateScore(board: BoardState): ScoreState

generateRunReport(board: BoardState): RunReport
```

The engine should be testable from a terminal script.

---

## 24. Smoke Script

Create later:

```txt
scripts/sim.ts
```

Expected command:

```bash
npm run sim
```

Expected output shape:

```txt
Scenario: Inbox Flood
Ticks Simulated: 90
Result: STABLE

Final Scores:
Clarity: 81
Stability: 76
Trust: 72
Load: 24

Counters:
Critical Misses: 1
False Alerts: 3
Misroutes: 4
Discarded Useful: 2

Operating Style:
Cautious Steward
Slight Suppressor

Recent Events:
- Tick 074: Volatile signal routed to Review.
- Tick 078: Critical signal reached Alert.
- Tick 081: Noise suppressed by Filter.
```

This confirms the game works before UI polish.

---

## 25. First Playable Acceptance Criteria

v0.1 is complete when:

1. `npm run sim` produces a full scenario run.
2. The browser renders the board.
3. The player can start, pause, step, and reset.
4. Signals spawn over time.
5. Modules process signals.
6. Signals resolve into outputs.
7. Score changes during play.
8. The player can reach a stable win state.
9. The player can fail through overload or critical misses.
10. The post-run report appears after win/failure.

---

## 26. Design Guardrails

Follow these rules during implementation:

1. Engine first, UI second.
2. React visualizes state; it does not own game logic.
3. Every module must have a downside.
4. Every failure should teach the player something.
5. No mechanic should exist only because it sounds clever.
6. Keep scenario data separate from simulation logic.
7. Prefer readable mechanics over hidden complexity.
8. Do not expand scope until Scenario 001 is fun.
9. Avoid building the campaign until the core loop is proven.
10. The best board should not be the busiest board.

---

## 27. Internal North Star

Patchbay is not about productivity.

Patchbay is about judgment.

The player should slowly realize:

> A system is not neutral.  
> It routes what it values.  
> It hides what it does not understand.  
> It breaks when it confuses motion for clarity.

The game should reward calm, legible, resilient design.
