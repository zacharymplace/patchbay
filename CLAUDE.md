# Claude Operating Rules

## Project Purpose

Patchbay is an engine-first game prototype centered on readable systems, modular actions, board state, scenario simulation, and UI as a visualization layer.

Treat this repo as a product/game prototype with a protected simulation engine, not a generic Next.js sandbox.

## Default Work Mode

Claude should act as a repo-native implementation agent.

Expected loop:

1. Read CLAUDE.md, README.md, package.json, and relevant docs before editing.
2. Inspect relevant files before editing.
3. Create the smallest useful patch.
4. Avoid unrelated cleanup.
5. Run validation.
6. Summarize changed files, validation results, risks, and next steps.

## Do Not Change Without Explicit Approval

- Core game loop
- Scoring semantics
- Scenario assumptions
- Board model
- Action resolution behavior
- Simulation harness expectations
- Engine/UI separation
- Public route structure
- Generated or local runtime data

## Protected Files and Areas

Be especially careful with:

- src/game/types.ts
- src/game/simulation.ts
- src/game/scoring.ts
- src/game/actions.ts
- src/game/board.ts
- src/game/scenarios.ts
- src/game/modules.ts
- scripts/sim.ts
- scripts/sim-variants.ts
- scripts/sim-player-plan.ts
- src/ui/GameScreen.tsx
- app/page.tsx
- docs
- package.json
- next.config.ts

Changes to these areas should be small, justified, and validated.

## Validation Commands

Preferred validation:

    npm run verify

For fast type checking:

    npm run check

For agent preflight:

    npm run agent:preflight

For release readiness:

    npm run release:ready

## Commit Rules

- Use a branch for every change.
- Keep commits small.
- Do not push without explicit instruction.
- Do not rewrite Git history unless explicitly instructed.
- Do not mix unrelated fixes into the same patch.
- Leave the working tree clean after a completed task when possible.

## Product Judgment

When uncertain, prefer:

- engine clarity over UI cleverness
- readable mechanics over hidden complexity
- scenario proof over intuition
- additive harness coverage over broad rewrites
- UI as a visualization of state, not owner of game logic
- boring maintainable code over impressive complexity
