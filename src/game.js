/**
 * Trystero Game Module
 * Main export for WASM-powered game functionality
 */

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
} from './wasm/game-engine.js'

export {
  createGameRoom,
  createGameRoomFromUrl,
  defaultGameConfig
} from './wasm/game-room.js'

// Type exports are handled in the .d.ts file
// JavaScript modules don't need to export types