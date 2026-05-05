# ENGINE_ACTIONS_NOTES.md

Status: v0.1 engine action layer

## Purpose

The UI should not own game logic.

The UI should call engine actions that mutate board state in controlled, testable ways.

## Added Actions

- `addModuleToLane`
- `removeModule`
- `updateModule`
- `listModules`

## Smoke Test

Run:

```bash
npm run sim:player-plan
```

This starts from the player-facing `starter` board, adds a basic routing plan through engine actions, and runs the scenario.

## Interpretation

- `starter` alone should fail.
- `starter` plus a reasonable module plan should stabilize.
- This proves the future UI can begin from an empty board and let player choices matter.
