/**
 * Game Room Extension for Trystero
 * Integrates WASM game logic with P2P room functionality
 */

import {
  initGameEngine,
  createGameInstance,
  processGameAction,
  getGameState,
  updateGame,
  addPlayer,
  removePlayer,
  destroyGameInstance,
  onGameEvent,
  isInitialized
} from './game-engine.js'

// Game room configuration defaults
export const defaultGameConfig = {
  tickRate: 60, // Game updates per second
  syncInterval: 100, // State sync interval in ms
  maxPlayers: 8,
  autoStart: false,
  requireHost: true,
  interpolation: true,
  prediction: true
}

/**
 * Create a game-enabled room with WASM game logic
 * @param {Object} room - Base Trystero room instance
 * @param {string|ArrayBuffer|WebAssembly.Module} wasmSource - WASM module source
 * @param {Object} gameConfig - Game configuration options
 * @returns {Promise<Object>} - Enhanced room with game functionality
 */
export const createGameRoom = async (room, wasmSource, gameConfig = {}) => {
  const config = {...defaultGameConfig, ...gameConfig}
  
  // Ensure consistent map seed for all players in the room
  if (!config.mapSeed) {
    // Use room ID as seed to ensure all players get the same map
    config.mapSeed = room.roomId
  }
  
  // Initialize WASM if not already done
  if (!isInitialized() && wasmSource) {
    await initGameEngine(wasmSource)
  }

  // Create game instance for this room - all players will share this instance
  const gameId = createGameInstance(room.roomId, config)
  
  // Game state management
  let isHost = false
  let gameLoop = null
  let syncTimer = null
  let lastUpdateTime = Date.now()
  const playerStates = new Map()
  const actionQueue = []
  
  // Create game-specific actions using the room's makeAction method
  const [sendGameAction, receiveGameAction] = room.makeAction('gameAction')
  const [sendStateSync, receiveStateSync] = room.makeAction('stateSync')
  const [sendPlayerJoin, receivePlayerJoin] = room.makeAction('playerJoin')
  const [sendPlayerLeave, receivePlayerLeave] = room.makeAction('playerLeave')
  const [sendHostTransfer, receiveHostTransfer] = room.makeAction('hostTransfer')
  
  // Enhanced room object
  const gameRoom = {
    ...room,
    gameId,
    config,
    
    /**
     * Start the game
     * @param {Object} initialState - Optional initial game state
     */
    startGame: (initialState = null) => {
      if (gameLoop) return
      
      // Start game update loop
      lastUpdateTime = Date.now()
      gameLoop = setInterval(() => {
        const now = Date.now()
        const deltaTime = now - lastUpdateTime
        lastUpdateTime = now
        
        // Process queued actions
        while (actionQueue.length > 0) {
          const {peerId, action, timestamp} = actionQueue.shift()
          
          // Apply latency compensation if prediction is enabled
          if (config.prediction) {
            const latency = now - timestamp
            action.latencyCompensation = latency
          }
          
          const result = processGameAction(gameId, peerId, action)
          
          // Broadcast state changes if host
          if (isHost && result?.broadcast) {
            sendStateSync(result.state)
          }
        }
        
        // Update game state
        const state = updateGame(gameId, deltaTime)
        
        // Trigger update callbacks
        if (gameRoom.onGameUpdate) {
          gameRoom.onGameUpdate(state, deltaTime)
        }
      }, 1000 / config.tickRate)
      
      // Start state synchronization if host
      if (isHost) {
        syncTimer = setInterval(() => {
          const state = getGameState(gameId)
          sendStateSync({
            state,
            timestamp: Date.now(),
            tick: state?.tick || 0
          })
        }, config.syncInterval)
      }
      
      // Notify game started
      if (gameRoom.onGameStart) {
        gameRoom.onGameStart(initialState)
      }
    },
    
    /**
     * Stop the game
     */
    stopGame: () => {
      if (gameLoop) {
        clearInterval(gameLoop)
        gameLoop = null
      }
      
      if (syncTimer) {
        clearInterval(syncTimer)
        syncTimer = null
      }
      
      // Notify game stopped
      if (gameRoom.onGameStop) {
        gameRoom.onGameStop()
      }
    },
    
    /**
     * Send game action to peers
     * @param {Object} action - Game action data
     */
    sendAction: (action) => {
      const timestamp = Date.now()
      
      // Process locally first (optimistic updates)
      if (config.prediction) {
        const result = processGameAction(gameId, room.selfId, action)
        if (gameRoom.onLocalAction) {
          gameRoom.onLocalAction(action, result)
        }
      }
      
      // Send to peers
      sendGameAction({
        action,
        timestamp,
        playerId: room.selfId
      })
      
      // Queue for authoritative processing if not host
      if (!isHost) {
        actionQueue.push({
          peerId: room.selfId,
          action,
          timestamp
        })
      }
    },
    
    /**
     * Become the host
     */
    becomeHost: () => {
      if (isHost) return
      
      isHost = true
      
      // Start sync timer
      if (gameLoop && !syncTimer) {
        syncTimer = setInterval(() => {
          const state = getGameState(gameId)
          sendStateSync({
            state,
            timestamp: Date.now(),
            tick: state?.tick || 0
          })
        }, config.syncInterval)
      }
      
      // Notify host change
      sendHostTransfer(room.selfId)
      
      if (gameRoom.onHostChange) {
        gameRoom.onHostChange(room.selfId)
      }
    },
    
    /**
     * Get current game state
     * @returns {Object} - Current game state
     */
    getState: () => {
      return getGameState(gameId)
    },
    
    /**
     * Get player states
     * @returns {Map} - Map of player states
     */
    getPlayerStates: () => {
      return new Map(playerStates)
    },
    
    /**
     * Destroy game room and cleanup
     */
    destroy: () => {
      gameRoom.stopGame()
      destroyGameInstance(gameId)
      
      // Call original room leave if exists
      if (room.leave) {
        room.leave()
      }
    },
    
    // Event handlers (to be set by user)
    onGameUpdate: null,
    onGameStart: null,
    onGameStop: null,
    onLocalAction: null,
    onRemoteAction: null,
    onStateSync: null,
    onHostChange: null,
    onPlayerGameJoin: null,
    onPlayerGameLeave: null
  }
  
  // Handle incoming game actions
  receiveGameAction((data, peerId) => {
    const {action, timestamp, playerId} = data
    
    // Queue action for processing
    actionQueue.push({
      peerId: playerId || peerId,
      action,
      timestamp
    })
    
    // Notify remote action received
    if (gameRoom.onRemoteAction) {
      gameRoom.onRemoteAction(action, playerId || peerId)
    }
  })
  
  // Handle state synchronization
  receiveStateSync((data, peerId) => {
    if (isHost) return // Host doesn't receive sync
    
    const {state, timestamp, tick} = data
    
    // Apply state with interpolation if enabled
    if (config.interpolation) {
      const latency = Date.now() - timestamp
      // Interpolate state based on latency
      // This is simplified - real implementation would be more complex
      if (gameRoom.onStateSync) {
        gameRoom.onStateSync(state, latency, tick)
      }
    } else {
      // Direct state application
      if (gameRoom.onStateSync) {
        gameRoom.onStateSync(state, 0, tick)
      }
    }
  })
  
  // Handle player join
  receivePlayerJoin((data, peerId) => {
    const {playerId, playerData} = data
    
    // Add player to the same game instance
    if (addPlayer(gameId, playerId || peerId, playerData)) {
      playerStates.set(playerId || peerId, {
        ...playerData,
        joinedAt: Date.now()
      })
      
      // If we're the host, immediately send the full game state to the new player
      if (isHost) {
        const state = getGameState(gameId)
        // Send state directly to the new player
        sendStateSync({
          state,
          timestamp: Date.now(),
          tick: state?.tick || 0,
          fullSync: true // Flag to indicate this is a full state sync for new player
        })
      }
      
      if (gameRoom.onPlayerGameJoin) {
        gameRoom.onPlayerGameJoin(playerId || peerId, playerData)
      }
    }
  })
  
  // Handle player leave
  receivePlayerLeave((playerId, peerId) => {
    const id = playerId || peerId
    
    // Remove player from game
    if (removePlayer(gameId, id)) {
      playerStates.delete(id)
      
      if (gameRoom.onPlayerGameLeave) {
        gameRoom.onPlayerGameLeave(id)
      }
    }
  })
  
  // Handle host transfer
  receiveHostTransfer((newHostId) => {
    if (newHostId === room.selfId) {
      gameRoom.becomeHost()
    } else {
      isHost = false
      if (syncTimer) {
        clearInterval(syncTimer)
        syncTimer = null
      }
      
      if (gameRoom.onHostChange) {
        gameRoom.onHostChange(newHostId)
      }
    }
  })
  
  // Hook into room peer events
  const originalOnPeerJoin = room.onPeerJoin
  room.onPeerJoin = (peerId) => {
    // Send player join notification with current game state
    sendPlayerJoin({
      playerId: room.selfId,
      playerData: {
        // Add any player-specific data here
      }
    })
    
    // Add peer as player to the same game instance
    addPlayer(gameId, peerId, {})
    playerStates.set(peerId, {joinedAt: Date.now()})
    
    // If we're the host, send the current game state to the new player
    if (isHost) {
      const state = getGameState(gameId)
      sendStateSync({
        state,
        timestamp: Date.now(),
        tick: state?.tick || 0
      })
    }
    
    // Determine host (first player becomes host)
    if (!isHost && playerStates.size === 1) {
      gameRoom.becomeHost()
    }
    
    // Call original handler
    if (originalOnPeerJoin) {
      originalOnPeerJoin(peerId)
    }
  }
  
  const originalOnPeerLeave = room.onPeerLeave
  room.onPeerLeave = (peerId) => {
    // Remove peer as player
    removePlayer(gameId, peerId)
    playerStates.delete(peerId)
    
    // Send leave notification
    sendPlayerLeave(peerId)
    
    // Transfer host if needed
    if (isHost && playerStates.size === 0) {
      isHost = false
    } else if (!isHost && config.requireHost && playerStates.size > 0) {
      // Select new host (first available player)
      const newHost = playerStates.keys().next().value
      if (newHost === room.selfId) {
        gameRoom.becomeHost()
      }
    }
    
    // Call original handler
    if (originalOnPeerLeave) {
      originalOnPeerLeave(peerId)
    }
  }
  
  // Register for WASM game events
  onGameEvent('network', (eventType, data) => {
    // Forward network events from WASM to peers
    sendGameAction({
      type: 'wasmEvent',
      eventType,
      data: Array.from(data)
    })
  })
  
  onGameEvent('save', (state) => {
    // Handle state persistence
    if (gameRoom.onStateSave) {
      gameRoom.onStateSave(state)
    }
  })
  
  // Auto-start game if configured
  if (config.autoStart) {
    gameRoom.startGame()
  }
  
  return gameRoom
}

/**
 * Create a game room with automatic WASM loading
 * @param {Object} room - Base Trystero room instance
 * @param {string} wasmUrl - URL to WASM module
 * @param {Object} gameConfig - Game configuration options
 * @returns {Promise<Object>} - Enhanced room with game functionality
 */
export const createGameRoomFromUrl = async (room, wasmUrl, gameConfig = {}) => {
  const response = await fetch(wasmUrl)
  const wasmBuffer = await response.arrayBuffer()
  return createGameRoom(room, wasmBuffer, gameConfig)
}

export default {
  createGameRoom,
  createGameRoomFromUrl,
  defaultGameConfig
}