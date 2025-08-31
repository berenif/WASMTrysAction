/**
 * Example: Using WASM Game Module with Trystero
 * This demonstrates how to integrate WASM-powered game logic with P2P networking
 */

import {joinRoom} from 'trystero/nostr'
import {createGameRoom, createGameRoomFromUrl} from 'trystero/game'

// Example 1: Basic game room setup with pre-loaded WASM
async function setupBasicGame() {
  // Join a regular Trystero room
  const room = joinRoom({appId: 'my-game'}, 'game-room-123')
  
  // Load WASM module
  const wasmResponse = await fetch('/dist/wasm/simple-game.wasm')
  const wasmBuffer = await wasmResponse.arrayBuffer()
  
  // Create game-enabled room
  const gameRoom = await createGameRoom(room, wasmBuffer, {
    tickRate: 60,        // 60 FPS game logic
    syncInterval: 100,   // Sync state every 100ms
    maxPlayers: 4,
    autoStart: true,
    interpolation: true,
    prediction: true
  })
  
  // Set up game event handlers
  gameRoom.onGameStart = (initialState) => {
    console.log('Game started!', initialState)
  }
  
  gameRoom.onGameUpdate = (state, deltaTime) => {
    // Render game state
    renderGame(state)
  }
  
  gameRoom.onRemoteAction = (action, playerId) => {
    console.log(`Player ${playerId} performed action:`, action)
  }
  
  gameRoom.onStateSync = (state, latency, tick) => {
    // Handle state synchronization from host
    console.log(`State sync at tick ${tick} with ${latency}ms latency`)
  }
  
  gameRoom.onPlayerGameJoin = (playerId, playerData) => {
    console.log(`Player ${playerId} joined the game`)
  }
  
  gameRoom.onPlayerGameLeave = (playerId) => {
    console.log(`Player ${playerId} left the game`)
  }
  
  // Handle user input
  document.addEventListener('keydown', (e) => {
    let action = null
    
    switch(e.key) {
      case 'ArrowLeft':
        action = {type: 'move', direction: 'left'}
        break
      case 'ArrowRight':
        action = {type: 'move', direction: 'right'}
        break
      case ' ':
        action = {type: 'jump'}
        break
      case 'Enter':
        action = {type: 'attack'}
        break
    }
    
    if (action) {
      gameRoom.sendAction(action)
    }
  })
  
  return gameRoom
}

// Example 2: Loading WASM from URL
async function setupGameFromUrl() {
  const room = joinRoom({appId: 'my-game'}, 'game-room-456')
  
  // Load WASM directly from URL
  const gameRoom = await createGameRoomFromUrl(
    room,
    'https://example.com/games/my-game.wasm',
    {
      maxPlayers: 8,
      requireHost: true
    }
  )
  
  // Start game when ready
  gameRoom.startGame({
    map: 'level1',
    mode: 'deathmatch',
    timeLimit: 300
  })
  
  return gameRoom
}

// Example 3: Advanced game setup with custom WASM imports
async function setupAdvancedGame() {
  const room = joinRoom({appId: 'my-game'}, 'game-room-789')
  
  // Custom WASM imports for game-specific functionality
  const customImports = {
    game: {
      // Custom game API
      loadAsset: (assetId) => {
        return loadGameAsset(assetId)
      },
      playSound: (soundId, volume) => {
        playGameSound(soundId, volume)
      },
      vibrate: (duration) => {
        if (navigator.vibrate) {
          navigator.vibrate(duration)
        }
      }
    }
  }
  
  // Initialize with custom imports
  const {initGameEngine} = await import('trystero/game')
  const wasmModule = await WebAssembly.compileStreaming(
    fetch('/dist/wasm/advanced-game.wasm')
  )
  
  await initGameEngine(wasmModule, customImports)
  
  // Create game room
  const gameRoom = await createGameRoom(room, null, {
    tickRate: 120,  // High refresh rate for competitive gaming
    syncInterval: 50,
    interpolation: true,
    prediction: true
  })
  
  // Custom state persistence
  gameRoom.onStateSave = (state) => {
    // Save to IndexedDB or localStorage
    localStorage.setItem('gameState', btoa(String.fromCharCode(...state)))
  }
  
  return gameRoom
}

// Example 4: Turn-based game with WASM logic
async function setupTurnBasedGame() {
  const room = joinRoom({appId: 'chess-game'}, 'match-' + Date.now())
  
  const gameRoom = await createGameRoomFromUrl(
    room,
    '/dist/wasm/chess-engine.wasm',
    {
      tickRate: 1,        // Turn-based, low tick rate
      syncInterval: 1000, // Less frequent syncs
      maxPlayers: 2,
      requireHost: false, // Deterministic game logic
      interpolation: false,
      prediction: false
    }
  )
  
  gameRoom.onRemoteAction = (action, playerId) => {
    if (action.type === 'move') {
      // Validate move with WASM chess engine
      const state = gameRoom.getState()
      if (isValidMove(state, action.move)) {
        updateBoard(action.move)
      }
    }
  }
  
  return gameRoom
}

// Helper function to render game state
function renderGame(state) {
  const canvas = document.getElementById('gameCanvas')
  const ctx = canvas.getContext('2d')
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Render players
  if (state.players) {
    Object.values(state.players).forEach(player => {
      ctx.fillStyle = player.color || '#00ff00'
      ctx.fillRect(player.x - 10, player.y - 10, 20, 20)
      
      // Draw health bar
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(player.x - 10, player.y - 20, 20, 2)
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(player.x - 10, player.y - 20, (player.health / 100) * 20, 2)
      
      // Draw name
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(player.id.substr(0, 8), player.x, player.y - 25)
    })
  }
  
  // Render entities
  if (state.entities) {
    state.entities.forEach(entity => {
      if (entity.type === 'collectible') {
        ctx.fillStyle = '#ffff00'
        ctx.beginPath()
        ctx.arc(entity.x, entity.y, 10, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }
  
  // Render game info
  ctx.fillStyle = '#ffffff'
  ctx.font = '16px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(`Tick: ${state.tick || 0}`, 10, 20)
  ctx.fillText(`State: ${state.state || 'unknown'}`, 10, 40)
}

// Example 5: Spectator mode
async function setupSpectatorMode() {
  const room = joinRoom({appId: 'my-game'}, 'tournament-final')
  
  const gameRoom = await createGameRoom(room, null, {
    maxPlayers: 2,
    spectatorMode: true  // Custom config for spectator
  })
  
  // Don't add self as player, just watch
  gameRoom.onStateSync = (state) => {
    renderGame(state)
    updateSpectatorUI(state)
  }
  
  return gameRoom
}

// Export examples
export {
  setupBasicGame,
  setupGameFromUrl,
  setupAdvancedGame,
  setupTurnBasedGame,
  setupSpectatorMode
}