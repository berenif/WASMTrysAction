/**
 * TypeScript definitions for WASM Game Engine
 */

export interface GameConfig {
  tickRate?: number
  syncInterval?: number
  maxPlayers?: number
  autoStart?: boolean
  requireHost?: boolean
  interpolation?: boolean
  prediction?: boolean
  [key: string]: any
}

export interface GameState {
  tick: number
  timestamp: number
  players: Record<string, PlayerState>
  entities?: any[]
  [key: string]: any
}

export interface PlayerState {
  id: string
  position?: { x: number; y: number; z?: number }
  rotation?: { x: number; y: number; z?: number }
  health?: number
  score?: number
  [key: string]: any
}

export interface GameAction {
  type: string
  playerId?: string
  timestamp?: number
  data?: any
  latencyCompensation?: number
}

export interface GameUpdateResult {
  state?: GameState
  broadcast?: boolean
  events?: GameEvent[]
}

export interface GameEvent {
  type: string
  data: any
  targets?: string[]
}

export type WasmSource = string | ArrayBuffer | Uint8Array | WebAssembly.Module

export interface WasmImports {
  env?: {
    memory?: WebAssembly.Memory
    [key: string]: any
  }
  [key: string]: any
}

export interface WasmExports {
  init?: () => void
  create_game_instance?: (roomIdPtr: number, configPtr: number) => number
  destroy_game_instance?: (gameId: number) => void
  process_action?: (gameId: number, peerIdPtr: number, actionPtr: number) => number
  get_game_state?: (gameId: number) => number
  update_game?: (gameId: number, deltaTime: number) => number
  add_player?: (gameId: number, playerIdPtr: number, dataPtr: number) => number
  remove_player?: (gameId: number, playerIdPtr: number) => number
  allocate_string?: (length: number) => number
  get_string_length?: (ptr: number) => number
  [key: string]: any
}

/**
 * Initialize the WASM game engine module
 */
export function initGameEngine(
  source: WasmSource,
  importObject?: WasmImports
): Promise<WasmExports>

/**
 * Create a new game instance
 */
export function createGameInstance(
  roomId: string,
  config?: GameConfig
): number

/**
 * Process game action from a peer
 */
export function processGameAction(
  gameId: number,
  peerId: string,
  action: GameAction
): GameUpdateResult | null

/**
 * Get current game state
 */
export function getGameState(gameId: number): GameState | null

/**
 * Update game with tick/frame
 */
export function updateGame(
  gameId: number,
  deltaTime: number
): GameState | null

/**
 * Add player to game
 */
export function addPlayer(
  gameId: number,
  playerId: string,
  playerData?: any
): boolean

/**
 * Remove player from game
 */
export function removePlayer(
  gameId: number,
  playerId: string
): boolean

/**
 * Destroy game instance and free resources
 */
export function destroyGameInstance(gameId: number): void

/**
 * Register callback for game events
 */
export function onGameEvent(
  event: 'network' | 'save' | string,
  callback: (eventType: number | string, data: Uint8Array | any) => void
): () => void

/**
 * Check if WASM game engine is initialized
 */
export function isInitialized(): boolean

/**
 * Get WASM module exports
 */
export function getExports(): WasmExports | null

declare const gameEngine: {
  initGameEngine: typeof initGameEngine
  createGameInstance: typeof createGameInstance
  processGameAction: typeof processGameAction
  getGameState: typeof getGameState
  updateGame: typeof updateGame
  addPlayer: typeof addPlayer
  removePlayer: typeof removePlayer
  destroyGameInstance: typeof destroyGameInstance
  onGameEvent: typeof onGameEvent
  isInitialized: typeof isInitialized
  getExports: typeof getExports
}

export default gameEngine