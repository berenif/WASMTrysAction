/**
 * Game Engine WASM Module Loader and Interface
 * Provides a bridge between the P2P network layer and WASM game logic
 */

import {selfId} from '../utils.js'

// WASM module instance and memory
let wasmModule = null
let wasmMemory = null
let wasmInstance = null

// Game state management
const gameStates = new Map()
const gameCallbacks = new Map()

/**
 * Initialize the WASM game engine module
 * @param {string|ArrayBuffer|WebAssembly.Module} source - WASM module source
 * @param {Object} importObject - Optional import object for WASM module
 * @returns {Promise<Object>} - Initialized WASM exports
 */
export const initGameEngine = async (source, importObject = {}) => {
  try {
    // Default memory configuration for game state
    wasmMemory = new WebAssembly.Memory({
      initial: 256, // 16MB initial memory
      maximum: 2048 // 128MB maximum memory
    })

    // Default import object with game engine bindings
    const defaultImports = {
      env: {
        memory: wasmMemory,
        // Logging functions
        log_debug: (ptr, len) => console.debug(readString(ptr, len)),
        log_info: (ptr, len) => console.info(readString(ptr, len)),
        log_error: (ptr, len) => console.error(readString(ptr, len)),
        
        // Time functions
        get_timestamp: () => Date.now(),
        
        // Random number generation
        random_f32: () => Math.random(),
        random_range: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        
        // Network callbacks
        send_game_event: (eventType, dataPtr, dataLen) => {
          const data = readBytes(dataPtr, dataLen)
          triggerNetworkEvent(eventType, data)
        },
        
        // State persistence
        save_state: (statePtr, stateLen) => {
          const state = readBytes(statePtr, stateLen)
          saveGameState(state)
        },
        
        // Math functions (if needed by game logic)
        sin: Math.sin,
        cos: Math.cos,
        sqrt: Math.sqrt,
        pow: Math.pow,
        atan2: Math.atan2
      },
      ...importObject
    }

    // Load WASM module based on input type
    if (source instanceof WebAssembly.Module) {
      wasmModule = source
    } else if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
      wasmModule = await WebAssembly.compile(source)
    } else if (typeof source === 'string') {
      // Assume it's a URL
      const response = await fetch(source)
      const buffer = await response.arrayBuffer()
      wasmModule = await WebAssembly.compile(buffer)
    } else {
      throw new Error('Invalid WASM source type')
    }

    // Instantiate the module
    wasmInstance = await WebAssembly.instantiate(wasmModule, defaultImports)
    
    // Initialize the game engine if init function exists
    if (wasmInstance.exports.init) {
      wasmInstance.exports.init()
    }

    return wasmInstance.exports
  } catch (error) {
    console.error('Failed to initialize WASM game engine:', error)
    throw error
  }
}

/**
 * Create a new game instance
 * @param {string} roomId - Room identifier
 * @param {Object} config - Game configuration
 * @returns {number} - Game instance ID
 */
export const createGameInstance = (roomId, config = {}) => {
  if (!wasmInstance) {
    throw new Error('WASM game engine not initialized')
  }

  const gameId = wasmInstance.exports.create_game_instance
    ? wasmInstance.exports.create_game_instance(
        writeString(roomId),
        writeObject(config)
      )
    : Date.now() // Fallback ID if function doesn't exist

  gameStates.set(gameId, {
    roomId,
    config,
    players: new Set(),
    state: 'waiting',
    createdAt: Date.now()
  })

  return gameId
}

/**
 * Process game action from a peer
 * @param {number} gameId - Game instance ID
 * @param {string} peerId - Peer identifier
 * @param {Object} action - Game action data
 * @returns {Object} - Game state update
 */
export const processGameAction = (gameId, peerId, action) => {
  if (!wasmInstance?.exports.process_action) {
    console.warn('WASM process_action not available')
    return null
  }

  const actionPtr = writeObject(action)
  const peerIdPtr = writeString(peerId)
  
  const resultPtr = wasmInstance.exports.process_action(
    gameId,
    peerIdPtr,
    actionPtr
  )

  if (resultPtr) {
    return readObject(resultPtr)
  }

  return null
}

/**
 * Get current game state
 * @param {number} gameId - Game instance ID
 * @returns {Object} - Current game state
 */
export const getGameState = (gameId) => {
  if (!wasmInstance?.exports.get_game_state) {
    return gameStates.get(gameId) || null
  }

  const statePtr = wasmInstance.exports.get_game_state(gameId)
  if (statePtr) {
    return readObject(statePtr)
  }

  return null
}

/**
 * Update game with tick/frame
 * @param {number} gameId - Game instance ID
 * @param {number} deltaTime - Time since last update in milliseconds
 * @returns {Object} - Updated game state
 */
export const updateGame = (gameId, deltaTime) => {
  if (!wasmInstance?.exports.update_game) {
    return null
  }

  const resultPtr = wasmInstance.exports.update_game(gameId, deltaTime)
  if (resultPtr) {
    return readObject(resultPtr)
  }

  return null
}

/**
 * Add player to game
 * @param {number} gameId - Game instance ID
 * @param {string} playerId - Player identifier
 * @param {Object} playerData - Player initialization data
 * @returns {boolean} - Success status
 */
export const addPlayer = (gameId, playerId, playerData = {}) => {
  const gameState = gameStates.get(gameId)
  if (!gameState) {
    return false
  }

  gameState.players.add(playerId)

  if (wasmInstance?.exports.add_player) {
    return wasmInstance.exports.add_player(
      gameId,
      writeString(playerId),
      writeObject(playerData)
    ) === 1
  }

  return true
}

/**
 * Remove player from game
 * @param {number} gameId - Game instance ID
 * @param {string} playerId - Player identifier
 * @returns {boolean} - Success status
 */
export const removePlayer = (gameId, playerId) => {
  const gameState = gameStates.get(gameId)
  if (!gameState) {
    return false
  }

  gameState.players.delete(playerId)

  if (wasmInstance?.exports.remove_player) {
    return wasmInstance.exports.remove_player(
      gameId,
      writeString(playerId)
    ) === 1
  }

  return true
}

/**
 * Destroy game instance and free resources
 * @param {number} gameId - Game instance ID
 */
export const destroyGameInstance = (gameId) => {
  if (wasmInstance?.exports.destroy_game_instance) {
    wasmInstance.exports.destroy_game_instance(gameId)
  }

  gameStates.delete(gameId)
  gameCallbacks.delete(gameId)
}

// Helper functions for memory management

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/**
 * Write string to WASM memory
 * @param {string} str - String to write
 * @returns {number} - Pointer to string in memory
 */
const writeString = (str) => {
  if (!wasmInstance?.exports.allocate_string) {
    return 0
  }

  const encoded = textEncoder.encode(str)
  const ptr = wasmInstance.exports.allocate_string(encoded.length)
  const memory = new Uint8Array(wasmMemory.buffer, ptr, encoded.length)
  memory.set(encoded)
  return ptr
}

/**
 * Read string from WASM memory
 * @param {number} ptr - Pointer to string
 * @param {number} len - String length
 * @returns {string} - Decoded string
 */
const readString = (ptr, len) => {
  const memory = new Uint8Array(wasmMemory.buffer, ptr, len)
  return textDecoder.decode(memory)
}

/**
 * Write object to WASM memory as JSON
 * @param {Object} obj - Object to write
 * @returns {number} - Pointer to JSON string in memory
 */
const writeObject = (obj) => {
  return writeString(JSON.stringify(obj))
}

/**
 * Read object from WASM memory
 * @param {number} ptr - Pointer to JSON string
 * @returns {Object} - Parsed object
 */
const readObject = (ptr) => {
  if (!wasmInstance?.exports.get_string_length) {
    return null
  }

  const len = wasmInstance.exports.get_string_length(ptr)
  const str = readString(ptr, len)
  
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

/**
 * Read bytes from WASM memory
 * @param {number} ptr - Pointer to data
 * @param {number} len - Data length
 * @returns {Uint8Array} - Byte array
 */
const readBytes = (ptr, len) => {
  return new Uint8Array(wasmMemory.buffer, ptr, len)
}

/**
 * Trigger network event from WASM
 * @param {number} eventType - Event type code
 * @param {Uint8Array} data - Event data
 */
const triggerNetworkEvent = (eventType, data) => {
  // This will be connected to the room's action system
  const callbacks = gameCallbacks.get('network')
  if (callbacks) {
    callbacks.forEach(cb => cb(eventType, data))
  }
}

/**
 * Save game state (for persistence)
 * @param {Uint8Array} state - Serialized game state
 */
const saveGameState = (state) => {
  // This can be extended to save to localStorage, IndexedDB, etc.
  const callbacks = gameCallbacks.get('save')
  if (callbacks) {
    callbacks.forEach(cb => cb(state))
  }
}

/**
 * Register callback for game events
 * @param {string} event - Event type
 * @param {Function} callback - Callback function
 * @returns {Function} - Unregister function
 */
export const onGameEvent = (event, callback) => {
  if (!gameCallbacks.has(event)) {
    gameCallbacks.set(event, new Set())
  }
  
  gameCallbacks.get(event).add(callback)
  
  return () => {
    const callbacks = gameCallbacks.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }
}

/**
 * Check if WASM game engine is initialized
 * @returns {boolean} - Initialization status
 */
export const isInitialized = () => {
  return wasmInstance !== null
}

/**
 * Get WASM module exports
 * @returns {Object|null} - WASM exports or null if not initialized
 */
export const getExports = () => {
  return wasmInstance?.exports || null
}

export default {
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
}