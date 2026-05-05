# UI_SHELL_NOTES.md

Status: v0.1 browser shell

## Purpose

The browser UI is intentionally thin.

It does not own game logic. It calls the engine actions and simulation functions.

## Current UI Capabilities

- Starts from the `starter` board.
- Adds modules through `addModuleToLane`.
- Can install the known basic plan.
- Can start, pause, step, run ten ticks, and reset.
- Renders lanes, modules, active signals, outputs, scores, counters, events, and run report.

## Current Non-Goals

- Drag-and-drop
- Module tuning controls
- Animations
- Sound
- Campaign
- Save/load
- Account system

## Validation

Run:

```bash
npm run verify
```

Then run the browser:

```bash
npm run dev
```

Open the local Next URL and verify:

1. Empty starter board can fail.
2. Basic plan can stabilize.
3. Scores and event log update as ticks advance.
