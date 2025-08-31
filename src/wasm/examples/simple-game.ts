/**
 * Example AssemblyScript Game Implementation
 * This can be compiled to WASM for use with the game engine
 * 
 * To compile: npx asc simple-game.ts -o simple-game.wasm --optimize
 */

// Game instance storage
class GameInstance {
  id: i32
  roomId: string
  tick: i32
  players: Map<string, Player>
  entities: Array<Entity>
  obstacles: Array<Obstacle>
  config: GameConfig
  state: string
  
  constructor(id: i32, roomId: string, config: GameConfig) {
    this.id = id
    this.roomId = roomId
    this.tick = 0
    this.players = new Map()
    this.entities = new Array()
    this.obstacles = new Array()
    this.config = config
    this.state = 'waiting'
    
    // Initialize obstacle in the middle of the viewport
    this.initializeObstacles()
  }
  
  initializeObstacles(): void {
    // Add a wall obstacle in the middle of the viewport
    const centerX = this.config.worldWidth / 2
    const centerY = this.config.worldHeight / 2
    const wallWidth = 50
    const wallHeight = 200
    
    const obstacle = new Obstacle(
      nextEntityId++,
      centerX - wallWidth / 2,
      centerY - wallHeight / 2,
      wallWidth,
      wallHeight
    )
    
    this.obstacles.push(obstacle)
  }
}

class Player {
  id: string
  x: f32
  y: f32
  vx: f32
  vy: f32
  health: i32
  score: i32
  color: string
  
  constructor(id: string) {
    this.id = id
    this.x = Math.random() * 800
    this.y = Math.random() * 600
    this.vx = 0
    this.vy = 0
    this.health = 100
    this.score = 0
    this.color = '#' + Math.floor(Math.random() * 16777215).toString(16)
  }
}

class Entity {
  id: i32
  type: string
  x: f32
  y: f32
  data: string
  
  constructor(id: i32, type: string, x: f32, y: f32) {
    this.id = id
    this.type = type
    this.x = x
    this.y = y
    this.data = ''
  }
}

class Obstacle {
  id: i32
  x: f32
  y: f32
  width: f32
  height: f32
  type: string
  
  constructor(id: i32, x: f32, y: f32, width: f32, height: f32) {
    this.id = id
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.type = 'wall'
  }
}

class GameConfig {
  maxPlayers: i32
  worldWidth: f32
  worldHeight: f32
  gravity: f32
  friction: f32
  
  constructor() {
    this.maxPlayers = 8
    this.worldWidth = 800
    this.worldHeight = 600
    this.gravity = 0.5
    this.friction = 0.95
  }
}

// Global game instances storage
const games = new Map<i32, GameInstance>()
let nextGameId: i32 = 1
let nextEntityId: i32 = 1

// Memory allocation helpers
export function allocate_string(length: i32): i32 {
  return heap.alloc(length) as i32
}

export function get_string_length(ptr: i32): i32 {
  return String.UTF8.byteLength(ptr)
}

// Initialize the game engine
export function init(): void {
  // Initialization logic
  log_info('Game engine initialized')
}

// Create a new game instance
export function create_game_instance(roomIdPtr: i32, configPtr: i32): i32 {
  const roomId = String.UTF8.decode(roomIdPtr)
  const configJson = String.UTF8.decode(configPtr)
  
  // Parse config (simplified - in real implementation would parse JSON)
  const config = new GameConfig()
  
  const gameId = nextGameId++
  const game = new GameInstance(gameId, roomId, config)
  games.set(gameId, game)
  
  log_info('Created game instance: ' + gameId.toString())
  
  return gameId
}

// Destroy a game instance
export function destroy_game_instance(gameId: i32): void {
  if (games.has(gameId)) {
    games.delete(gameId)
    log_info('Destroyed game instance: ' + gameId.toString())
  }
}

// Process a game action
export function process_action(gameId: i32, peerIdPtr: i32, actionPtr: i32): i32 {
  const game = games.get(gameId)
  if (!game) return 0
  
  const peerId = String.UTF8.decode(peerIdPtr)
  const actionJson = String.UTF8.decode(actionPtr)
  
  // Parse action (simplified - would parse JSON in real implementation)
  // For this example, we'll handle simple movement actions
  const player = game.players.get(peerId)
  if (!player) return 0
  
  // Simple action parsing (in real implementation, parse JSON)
  if (actionJson.includes('move_left')) {
    player.vx = -5
  } else if (actionJson.includes('move_right')) {
    player.vx = 5
  } else if (actionJson.includes('jump')) {
    player.vy = -10
  } else if (actionJson.includes('stop')) {
    player.vx = 0
  }
  
  // Return updated state (simplified)
  const result = JSON.stringify({
    broadcast: true,
    state: serializeGameState(game)
  })
  
  const resultPtr = allocate_string(result.length)
  String.UTF8.encode(result, resultPtr)
  
  return resultPtr
}

// Get current game state
export function get_game_state(gameId: i32): i32 {
  const game = games.get(gameId)
  if (!game) return 0
  
  const state = serializeGameState(game)
  const statePtr = allocate_string(state.length)
  String.UTF8.encode(state, statePtr)
  
  return statePtr
}

// Update game logic
export function update_game(gameId: i32, deltaTime: f32): i32 {
  const game = games.get(gameId)
  if (!game) return 0
  
  game.tick++
  
  // Update all players
  const players = game.players.values()
  for (let i = 0; i < players.length; i++) {
    const player = players[i]
    
    // Store previous position for collision resolution
    const prevX = player.x
    const prevY = player.y
    
    // Apply physics
    player.vy += game.config.gravity
    player.vx *= game.config.friction
    
    // Update position
    player.x += player.vx * (deltaTime / 16.0)
    player.y += player.vy * (deltaTime / 16.0)
    
    // Check collision with obstacles
    const playerSize = 20 // Assume player has a radius of 20
    for (let j = 0; j < game.obstacles.length; j++) {
      const obstacle = game.obstacles[j]
      
      // AABB collision detection (player as circle vs obstacle as rectangle)
      const closestX = Math.max(obstacle.x, Math.min(player.x, obstacle.x + obstacle.width))
      const closestY = Math.max(obstacle.y, Math.min(player.y, obstacle.y + obstacle.height))
      
      const distanceX = player.x - closestX
      const distanceY = player.y - closestY
      const distanceSquared = distanceX * distanceX + distanceY * distanceY
      
      if (distanceSquared < playerSize * playerSize) {
        // Collision detected - resolve it
        // Determine which side the collision occurred from
        const dx = player.x - prevX
        const dy = player.y - prevY
        
        // Check horizontal collision
        if (prevX + playerSize <= obstacle.x || prevX - playerSize >= obstacle.x + obstacle.width) {
          // Horizontal collision - stop horizontal movement
          player.x = prevX
          player.vx = 0
        }
        
        // Check vertical collision
        if (prevY + playerSize <= obstacle.y || prevY - playerSize >= obstacle.y + obstacle.height) {
          // Vertical collision - stop vertical movement
          player.y = prevY
          player.vy = 0
          
          // If landing on top of obstacle, allow jumping
          if (prevY < obstacle.y) {
            player.y = obstacle.y - playerSize
          }
        }
      }
    }
    
    // Boundary collision
    if (player.x < 0) {
      player.x = 0
      player.vx = 0
    } else if (player.x > game.config.worldWidth) {
      player.x = game.config.worldWidth
      player.vx = 0
    }
    
    if (player.y > game.config.worldHeight) {
      player.y = game.config.worldHeight
      player.vy = 0
    }
  }
  
  // Update entities
  for (let i = 0; i < game.entities.length; i++) {
    const entity = game.entities[i]
    // Simple entity update logic
    if (entity.type === 'collectible') {
      entity.y += Math.sin(game.tick * 0.1) * 0.5
    }
  }
  
  // Check collisions
  checkCollisions(game)
  
  // Return updated state
  const state = serializeGameState(game)
  const statePtr = allocate_string(state.length)
  String.UTF8.encode(state, statePtr)
  
  return statePtr
}

// Add a player to the game
export function add_player(gameId: i32, playerIdPtr: i32, dataPtr: i32): i32 {
  const game = games.get(gameId)
  if (!game) return 0
  
  const playerId = String.UTF8.decode(playerIdPtr)
  
  if (game.players.size >= game.config.maxPlayers) {
    return 0
  }
  
  const player = new Player(playerId)
  game.players.set(playerId, player)
  
  // Change game state if enough players
  if (game.players.size >= 2 && game.state === 'waiting') {
    game.state = 'playing'
    
    // Spawn some collectibles
    for (let i = 0; i < 5; i++) {
      const entity = new Entity(
        nextEntityId++,
        'collectible',
        Math.random() * game.config.worldWidth,
        Math.random() * game.config.worldHeight * 0.5
      )
      game.entities.push(entity)
    }
  }
  
  log_info('Player joined: ' + playerId)
  
  return 1
}

// Remove a player from the game
export function remove_player(gameId: i32, playerIdPtr: i32): i32 {
  const game = games.get(gameId)
  if (!game) return 0
  
  const playerId = String.UTF8.decode(playerIdPtr)
  
  if (game.players.has(playerId)) {
    game.players.delete(playerId)
    log_info('Player left: ' + playerId)
    
    // Check if game should end
    if (game.players.size < 2 && game.state === 'playing') {
      game.state = 'waiting'
      game.entities = new Array()
    }
    
    return 1
  }
  
  return 0
}

// Helper function to serialize game state
function serializeGameState(game: GameInstance): string {
  const players: Array<string> = []
  const playerEntries = game.players.entries()
  
  for (let i = 0; i < playerEntries.length; i++) {
    const entry = playerEntries[i]
    const player = entry.value
    players.push(JSON.stringify({
      id: player.id,
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      health: player.health,
      score: player.score,
      color: player.color
    }))
  }
  
  const entities: Array<string> = []
  for (let i = 0; i < game.entities.length; i++) {
    const entity = game.entities[i]
    entities.push(JSON.stringify({
      id: entity.id,
      type: entity.type,
      x: entity.x,
      y: entity.y
    }))
  }
  
  const obstacles: Array<string> = []
  for (let i = 0; i < game.obstacles.length; i++) {
    const obstacle = game.obstacles[i]
    obstacles.push(JSON.stringify({
      id: obstacle.id,
      type: obstacle.type,
      x: obstacle.x,
      y: obstacle.y,
      width: obstacle.width,
      height: obstacle.height
    }))
  }
  
  return JSON.stringify({
    tick: game.tick,
    state: game.state,
    timestamp: Date.now(),
    players: '[' + players.join(',') + ']',
    entities: '[' + entities.join(',') + ']',
    obstacles: '[' + obstacles.join(',') + ']'
  })
}

// Check collisions between players and entities
function checkCollisions(game: GameInstance): void {
  const players = game.players.values()
  
  for (let i = 0; i < players.length; i++) {
    const player = players[i]
    
    // Check collision with collectibles
    for (let j = game.entities.length - 1; j >= 0; j--) {
      const entity = game.entities[j]
      
      if (entity.type === 'collectible') {
        const dx = player.x - entity.x
        const dy = player.y - entity.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 30) {
          // Player collected the item
          player.score += 10
          game.entities.splice(j, 1)
          
          // Spawn a new collectible
          const newEntity = new Entity(
            nextEntityId++,
            'collectible',
            Math.random() * game.config.worldWidth,
            Math.random() * game.config.worldHeight * 0.5
          )
          game.entities.push(newEntity)
          
          // Send event
          send_game_event(1, player.id + ' collected item')
        }
      }
    }
  }
}

// External functions (provided by host)
declare function log_info(message: string): void
declare function log_error(message: string): void
declare function send_game_event(eventType: i32, data: string): void
declare function get_timestamp(): i64
declare function random_f32(): f32