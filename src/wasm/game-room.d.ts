/**
 * TypeScript definitions for Game Room Extension
 */

import type {Room} from '../index'
import type {GameConfig, GameState, GameAction, PlayerState, WasmSource} from './game-engine'

export interface GameRoom extends Room {
  gameId: number
  config: GameConfig
  
  /**
   * Start the game
   */
  startGame(initialState?: GameState | null): void
  
  /**
   * Stop the game
   */
  stopGame(): void
  
  /**
   * Send game action to peers
   */
  sendAction(action: GameAction): void
  
  /**
   * Become the host
   */
  becomeHost(): void
  
  /**
   * Get current game state
   */
  getState(): GameState | null
  
  /**
   * Get player states
   */
  getPlayerStates(): Map<string, PlayerState>
  
  /**
   * Destroy game room and cleanup
   */
  destroy(): void
  
  // Event handlers
  onGameUpdate?: (state: GameState, deltaTime: number) => void
  onGameStart?: (initialState: GameState | null) => void
  onGameStop?: () => void
  onLocalAction?: (action: GameAction, result: any) => void
  onRemoteAction?: (action: GameAction, playerId: string) => void
  onStateSync?: (state: GameState, latency: number, tick: number) => void
  onHostChange?: (hostId: string) => void
  onPlayerGameJoin?: (playerId: string, playerData: any) => void
  onPlayerGameLeave?: (playerId: string) => void
  onStateSave?: (state: Uint8Array) => void
}

export interface GameRoomConfig extends GameConfig {
  tickRate?: number
  syncInterval?: number
  maxPlayers?: number
  autoStart?: boolean
  requireHost?: boolean
  interpolation?: boolean
  prediction?: boolean
}

/**
 * Create a game-enabled room with WASM game logic
 */
export function createGameRoom(
  room: Room,
  wasmSource: WasmSource,
  gameConfig?: GameRoomConfig
): Promise<GameRoom>

/**
 * Create a game room with automatic WASM loading from URL
 */
export function createGameRoomFromUrl(
  room: Room,
  wasmUrl: string,
  gameConfig?: GameRoomConfig
): Promise<GameRoom>

export const defaultGameConfig: GameRoomConfig

declare const gameRoom: {
  createGameRoom: typeof createGameRoom
  createGameRoomFromUrl: typeof createGameRoomFromUrl
  defaultGameConfig: typeof defaultGameConfig
}

export default gameRoom