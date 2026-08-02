# Patchbay

Patchbay is a systems puzzle game about building calm judgment into noisy environments.

Core promise:

> Route the signal. Tune the system. Don't let the board lie to you.

## Current Status

Playable simulation prototype.

Patchbay currently includes:

- deterministic terminal simulation;
- starter, calibrated, over-filtering, alarm-cascade, and no-router variants;
- player-authored module plans;
- differentiated stability, trust, clarity, load, and routing outcomes;
- a browser game surface backed by the simulation engine.

## Validation

```bash
npm run sim
npm run sim:variants
npm run sim:player-plan
npm run release:ready
```

The calibrated board stabilizes Scenario 001, while intentionally incomplete or distorted boards fail through critical misses, misroutes, false alerts, discarded useful signals, or excess load.

## Build Rule

Engine first. UI second.

The terminal simulation remains the source of truth for gameplay behavior. Browser work must preserve the validated simulation outcomes.
