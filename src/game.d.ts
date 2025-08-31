export {
  initGameEngine,
  createGameInstance,
  processGameAction,
  getGameState,
  updateGame,
  addPlayer,
  removePlayer,
  destroyGameInstance,
  onGameEvent,
  isInitialized,
  getExports
} from './wasm/game-engine'

export {
  createGameRoom,
  createGameRoomFromUrl,
  defaultGameConfig
} from './wasm/game-room'

// Re-export types for TypeScript users
export type {
  GameConfig,
  GameState,
  PlayerState,
  GameAction,
  GameUpdateResult,
  GameEvent,
  WasmSource,
  WasmImports,
  WasmExports
} from './wasm/game-engine'

export type {
  GameRoom,
  GameRoomConfig
} from './wasm/game-room'