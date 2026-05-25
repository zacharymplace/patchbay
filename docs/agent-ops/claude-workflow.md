# Claude Workflow

## Purpose

This document defines how Claude should be used inside Patchbay.

Claude is best used for narrow implementation, validation repair, simulation harness work, documentation parity, and small UI improvements that preserve engine ownership.

Product strategy, game feel, scoring semantics, and scenario tuning require explicit approval before edits.

## Good Claude Tasks

- Fix a failing check.
- Add validation around existing scenarios.
- Improve docs to match implemented behavior.
- Add a narrow UI affordance that reads existing state.
- Refactor duplicated display code without touching engine rules.
- Add a new scenario only when given exact expected behavior.
- Improve script ergonomics without changing simulation output.

## Bad Claude Tasks

- Rewrite the game engine broadly.
- Tune scoring without approval.
- Move game logic into React.
- Change scenario expectations casually.
- Add dependencies casually.
- Change board/action semantics without explicit instruction.
- Replace readable mechanics with opaque abstractions.

## Standard Prompt

Read CLAUDE.md, README.md, package.json, and relevant docs first.

Create or stay on a task branch.

Implement the smallest useful version of the requested change.

Do not change core loop, scoring semantics, board model, action resolution, scenario assumptions, engine/UI separation, or unrelated files.

Run:

    npm run agent:preflight
    npm run release:ready

Summarize:

- files changed
- validation results
- risks
- next recommended patch

Do not push unless explicitly asked.
