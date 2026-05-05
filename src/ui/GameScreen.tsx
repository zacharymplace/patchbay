"use client";

import { useMemo, useState } from "react";
import { addModuleToLane, listModules } from "../game/actions";
import { createInitialBoard } from "../game/board";
import { generateRunReport } from "../game/report";
import { stepSimulation } from "../game/simulation";
import type { BoardState, RunStatus } from "../game/types";

function label(value: string): string {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function createStarterBoard(): BoardState {
  return createInitialBoard("inbox_flood", "starter");
}

function startBoard(board: BoardState): BoardState {
  if (board.status === "stable" || board.status === "failed") {
    return board;
  }

  return {
    ...board,
    status: "running"
  };
}

function pauseBoard(board: BoardState): BoardState {
  if (board.status !== "running") {
    return board;
  }

  return {
    ...board,
    status: "idle"
  };
}

export function GameScreen() {
  const [board, setBoard] = useState<BoardState>(() => createStarterBoard());

  const report = useMemo(() => {
    if (board.status !== "stable" && board.status !== "failed") {
      return undefined;
    }

    return generateRunReport(board);
  }, [board]);

  const modules = listModules(board);

  function addBasicModule(kind: "filter" | "buffer" | "gate" | "amplifier" | "router") {
    setBoard((current) => {
      if (kind === "filter") {
        return addModuleToLane(current, {
          kind,
          laneId: "intake",
          config: {
            strengthThreshold: 22
          }
        });
      }

      if (kind === "buffer") {
        return addModuleToLane(current, {
          kind,
          laneId: "processing",
          config: {
            capacity: 8,
            holdTicks: 1
          }
        });
      }

      if (kind === "gate") {
        return addModuleToLane(current, {
          kind,
          laneId: "processing",
          config: {
            confidenceThreshold: 45,
            urgencyOverride: 78
          }
        });
      }

      if (kind === "amplifier") {
        return addModuleToLane(current, {
          kind,
          laneId: "processing",
          config: {
            urgencyBoost: 3,
            strengthBoost: 2
          }
        });
      }

      return addModuleToLane(current, {
        kind,
        laneId: "resolution",
        config: {
          routingMode: "by_kind"
        }
      });
    });
  }

  function installBasicPlan() {
    setBoard((current) => {
      let next = current;

      next = addModuleToLane(next, {
        kind: "filter",
        laneId: "intake",
        config: { strengthThreshold: 22 }
      });

      next = addModuleToLane(next, {
        kind: "buffer",
        laneId: "processing",
        config: { capacity: 8, holdTicks: 1 }
      });

      next = addModuleToLane(next, {
        kind: "gate",
        laneId: "processing",
        config: { confidenceThreshold: 45, urgencyOverride: 78 }
      });

      next = addModuleToLane(next, {
        kind: "amplifier",
        laneId: "processing",
        config: { urgencyBoost: 3, strengthBoost: 2 }
      });

      next = addModuleToLane(next, {
        kind: "router",
        laneId: "resolution",
        config: { routingMode: "by_kind" }
      });

      return next;
    });
  }

  function runStep() {
    setBoard((current) => {
      const running = current.status === "running" ? current : startBoard(current);
      return stepSimulation(running);
    });
  }

  function runMany() {
    setBoard((current) => {
      let next = current.status === "running" ? current : startBoard(current);

      for (let index = 0; index < 10; index += 1) {
        if (next.status !== "running") {
          break;
        }

        next = stepSimulation(next);
      }

      return next;
    });
  }

  function setStatus(status: RunStatus) {
    setBoard((current) => {
      if (status === "running") {
        return startBoard(current);
      }

      if (status === "idle") {
        return pauseBoard(current);
      }

      return current;
    });
  }

  return (
    <main>
      <header className="header">
        <div>
          <p className="eyebrow">Scenario 001</p>
          <h1>Patchbay</h1>
          <p className="subtitle">
            Build a board that routes signal without confusing motion for clarity.
          </p>
        </div>
        <div className="status-pill">
          Tick {board.tick} · {board.status.toUpperCase()}
        </div>
      </header>

      <section className="grid">
        <aside className="panel stack">
          <div>
            <h2>Run Controls</h2>
            <div className="control-row">
              <button onClick={() => setStatus("running")} disabled={board.status === "running"}>
                Start
              </button>
              <button onClick={() => setStatus("idle")} disabled={board.status !== "running"}>
                Pause
              </button>
              <button onClick={runStep} disabled={board.status === "stable" || board.status === "failed"}>
                Step
              </button>
              <button onClick={runMany} disabled={board.status === "stable" || board.status === "failed"}>
                +10 Ticks
              </button>
              <button onClick={() => setBoard(createStarterBoard())}>Reset</button>
            </div>
          </div>

          <div>
            <h2>Modules</h2>
            <div className="stack">
              <button className="module-button" onClick={() => addBasicModule("filter")}>
                <strong>Filter</strong>
                <span>Suppress weak signal in Intake.</span>
              </button>
              <button className="module-button" onClick={() => addBasicModule("buffer")}>
                <strong>Buffer</strong>
                <span>Smooth load in Processing.</span>
              </button>
              <button className="module-button" onClick={() => addBasicModule("gate")}>
                <strong>Gate</strong>
                <span>Hold low-confidence signal.</span>
              </button>
              <button className="module-button" onClick={() => addBasicModule("amplifier")}>
                <strong>Amplifier</strong>
                <span>Boost urgency and strength.</span>
              </button>
              <button className="module-button" onClick={() => addBasicModule("router")}>
                <strong>Router</strong>
                <span>Resolve by signal kind.</span>
              </button>
              <button onClick={installBasicPlan}>Install Basic Plan</button>
            </div>
          </div>
        </aside>

        <section className="panel">
          <h2>Signal Board</h2>

          {board.lanes.map((lane) => (
            <div className="lane" key={lane.id}>
              <div className="lane-title">
                <strong>{lane.label}</strong>
                <span>{lane.modules.length} modules</span>
              </div>

              {lane.modules.length === 0 ? (
                <span className="module-chip">empty lane</span>
              ) : (
                lane.modules.map((module) => (
                  <span className="module-chip" key={module.id}>
                    {label(module.kind)}
                  </span>
                ))
              )}
            </div>
          ))}

          <div className="lane">
            <div className="lane-title">
              <strong>Active Signals</strong>
              <span>{board.activeSignals.length} live</span>
            </div>

            <div className="signal-list">
              {board.activeSignals.length === 0 ? (
                <span className="module-chip">no active signal</span>
              ) : (
                board.activeSignals.slice(-10).map((signal) => (
                  <div className="signal-card" key={signal.id}>
                    <strong>{signal.label}</strong>
                    <div className="signal-meta">
                      {label(signal.kind)} · urgency {signal.urgency} · confidence{" "}
                      {signal.confidence} · strength {signal.strength} · age {signal.age}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lane">
            <div className="lane-title">
              <strong>Outputs</strong>
              <span>{board.resolvedSignals.length} resolved</span>
            </div>
            <span className="output-chip">Alert {board.outputCounts.alert}</span>
            <span className="output-chip">Archive {board.outputCounts.archive}</span>
            <span className="output-chip">Review {board.outputCounts.review}</span>
            <span className="output-chip">Discard {board.outputCounts.discard}</span>
          </div>
        </section>

        <aside className="panel stack">
          <div>
            <h2>Score</h2>
            <div className="score-grid">
              <div className="score-item">
                <span>Clarity</span>
                <strong>{board.score.clarity}</strong>
              </div>
              <div className="score-item">
                <span>Stability</span>
                <strong>{board.score.stability}</strong>
              </div>
              <div className="score-item">
                <span>Trust</span>
                <strong>{board.score.trust}</strong>
              </div>
              <div className="score-item">
                <span>Load</span>
                <strong>{board.score.load}</strong>
              </div>
            </div>
          </div>

          <div>
            <h2>Counters</h2>
            <p className="subtitle">
              Misses {board.score.criticalMisses} · False alerts{" "}
              {board.score.falseAlerts} · Misroutes {board.score.misroutes}
            </p>
          </div>

          <div>
            <h2>Installed</h2>
            <p className="subtitle">{modules.length} total modules</p>
          </div>
        </aside>
      </section>

      <section className="grid" style={{ marginTop: 16 }}>
        <section className="panel" style={{ gridColumn: "span 2" }}>
          <h2>Event Log</h2>
          <div className="event-log">
            {board.events.slice(-16).map((event, index) => (
              <div className={`event ${event.severity}`} key={`${event.tick}-${index}`}>
                Tick {String(event.tick).padStart(3, "0")}: {event.message}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Run Report</h2>
          {report ? (
            <div className="stack">
              <p className="subtitle">
                Result: <strong>{label(report.result)}</strong>
              </p>
              <p className="subtitle">Peak load: {report.peakLoad}</p>
              <div>
                <h3>Operating Style</h3>
                <ul className="report-list">
                  {report.operatingStyle.map((style) => (
                    <li key={style}>{label(style)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Risk Patterns</h3>
                <ul className="report-list">
                  {report.riskPatterns.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="subtitle">
              Complete or fail a run to generate diagnosis.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
