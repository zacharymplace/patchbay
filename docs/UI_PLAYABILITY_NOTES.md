# UI_PLAYABILITY_NOTES.md

Status: v0.1 playability pass

## Added

- Run to End
- Clear Modules
- Remove module
- Basic module tuning
- Install Missing Basic Plan, which avoids duplicate module stacking

## Current Tuning Model

- Filter: adjusts strength threshold.
- Gate: adjusts confidence threshold and urgency override.
- Buffer: adjusts capacity and hold ticks.
- Amplifier: adjusts urgency and strength boosts.
- Router: cycles routing mode.

## Design Boundary

These controls are intentionally primitive.

They exist to prove the browser UI can interact with engine-level module placement and tuning without owning simulation logic.
