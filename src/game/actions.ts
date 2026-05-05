import type {
  BoardModule,
  BoardState,
  FilterModule,
  GateModule,
  RouterModule,
  BufferModule,
  AmplifierModule,
  ModuleKind
} from "./types";

type ModuleConfigByKind = {
  filter: Omit<FilterModule, "id" | "kind" | "lane" | "position" | "enabled">;
  gate: Omit<GateModule, "id" | "kind" | "lane" | "position" | "enabled">;
  router: Omit<RouterModule, "id" | "kind" | "lane" | "position" | "enabled">;
  buffer: Omit<BufferModule, "id" | "kind" | "lane" | "position" | "enabled">;
  amplifier: Omit<AmplifierModule, "id" | "kind" | "lane" | "position" | "enabled">;
};

export type AddModuleInput<K extends ModuleKind = ModuleKind> = {
  kind: K;
  laneId: string;
  config: ModuleConfigByKind[K];
};

function nextModuleId(board: BoardState, kind: ModuleKind): string {
  const existing = board.lanes.flatMap((lane) => lane.modules).length;
  return `${kind}-${board.tick}-${existing + 1}`;
}

function createModule<K extends ModuleKind>(
  board: BoardState,
  input: AddModuleInput<K>,
  position: number
): BoardModule {
  const base = {
    id: nextModuleId(board, input.kind),
    kind: input.kind,
    lane: input.laneId,
    position,
    enabled: true
  };

  return {
    ...base,
    ...input.config
  } as BoardModule;
}

export function addModuleToLane<K extends ModuleKind>(
  board: BoardState,
  input: AddModuleInput<K>
): BoardState {
  const lane = board.lanes.find((candidate) => candidate.id === input.laneId);

  if (!lane) {
    throw new Error(`Unknown lane id: ${input.laneId}`);
  }

  const position =
    lane.modules.length === 0
      ? 1
      : Math.max(...lane.modules.map((module) => module.position)) + 1;

  const module = createModule(board, input, position);

  return {
    ...board,
    lanes: board.lanes.map((candidate) =>
      candidate.id === input.laneId
        ? {
            ...candidate,
            modules: [...candidate.modules, module]
          }
        : candidate
    ),
    events: [
      ...board.events,
      {
        tick: board.tick,
        severity: "info",
        message: `${input.kind} module added to ${lane.label}.`
      }
    ]
  };
}

export function removeModule(board: BoardState, moduleId: string): BoardState {
  let removedLabel: string | undefined;

  const lanes = board.lanes.map((lane) => {
    const target = lane.modules.find((module) => module.id === moduleId);

    if (target) {
      removedLabel = `${target.kind} from ${lane.label}`;
    }

    return {
      ...lane,
      modules: lane.modules.filter((module) => module.id !== moduleId)
    };
  });

  return {
    ...board,
    lanes,
    events: [
      ...board.events,
      {
        tick: board.tick,
        severity: removedLabel ? "info" : "warning",
        message: removedLabel
          ? `Removed ${removedLabel}.`
          : `Attempted to remove missing module ${moduleId}.`
      }
    ]
  };
}

export function updateModule(
  board: BoardState,
  moduleId: string,
  updater: (module: BoardModule) => BoardModule
): BoardState {
  let updated = false;

  return {
    ...board,
    lanes: board.lanes.map((lane) => ({
      ...lane,
      modules: lane.modules.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        updated = true;
        return updater(module);
      })
    })),
    events: [
      ...board.events,
      {
        tick: board.tick,
        severity: updated ? "info" : "warning",
        message: updated
          ? `Updated module ${moduleId}.`
          : `Attempted to update missing module ${moduleId}.`
      }
    ]
  };
}

export function listModules(board: BoardState): BoardModule[] {
  return board.lanes.flatMap((lane) => lane.modules);
}
