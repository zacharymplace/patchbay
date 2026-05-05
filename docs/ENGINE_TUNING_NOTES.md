# ENGINE_TUNING_NOTES.md

Status: v0.1 engine tuning notes

## Current Engine Principle

Patchbay now separates the player-facing starting board from the calibrated smoke-test board.

## Board Presets

### starter

The player-facing board.

- No modules installed.
- Used by future UI as the initial playable state.
- Should fail if simulated without player intervention.

Purpose:

> Prove that player choices matter.

### calibrated

The smoke-test board.

- Includes Filter, Buffer, Gate, Amplifier, and Router.
- Used by `npm run sim`.
- Should complete Scenario 001 successfully.

Purpose:

> Prove that the engine can produce a stable, calibrated run.

## Pressure-Test Variants

Run:

```bash
npm run sim:variants
```

Expected broad outcomes:

- Starter player board: fails without player intervention.
- Calibrated smoke-test board: stabilizes.
- Over-filtering board: fails through suppression/misrouting.
- Alarm cascade board: fails or degrades through over-alerting/misrouting.
- No-router board: fails through misrouting.

## Design Interpretation

If every board wins, the game has no teeth.

If every board fails, the game has no learnable path.

The engine should support both stable and failed outcomes for readable reasons.
