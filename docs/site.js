import {joinRoom, selfId} from './trystero-torrent.min.js'

const byId = document.getElementById.bind(document)
const canvas = byId('canvas')
const peerInfo = byId('peer-info')
const noPeersCopy = peerInfo.innerText
const config = {appId: 'trystero-demo1'}
const cursors = {}
const knightFrames = [
  'images/knight1.png',
  'images/knight2.png', 
  'images/knight3.png'
]
let currentFrame = 0
const animationSpeed = 500 // milliseconds per frame
const fruits = [
  '🍏',
  '🍎',
  '🍐',
  '🍊',
  '🍋',
  '🍌',
  '🍉',
  '🍇',
  '🍓',
  '🫐',
  '🍈',
  '🍒',
  '🍑',
  '🥭',
  '🍍',
  '🥥',
  '🥝'
]
const randomFruit = () => Math.floor(Math.random() * fruits.length)

let mouseX = 0
let mouseY = 0
let room
let sendMove
let sendClick
let keyboardLayout = 'QWERTY' // Will be detected automatically
let moveSpeed = 0.02 // Speed of keyboard movement
let isKeyboardMode = false
let keysPressed = new Set()

init(49)
document.documentElement.className = 'ready'
addCursor(selfId, true)
detectKeyboardLayout()
initKeyboardControls()

addEventListener('mousemove', ({clientX, clientY}) => {
  if (!isKeyboardMode) {
    mouseX = clientX / innerWidth
    mouseY = clientY / innerHeight
    moveCursor([mouseX, mouseY], selfId)
    if (room) {
      sendMove([mouseX, mouseY])
    }
  }
})

addEventListener('click', () => {
  if (!isKeyboardMode) {
    const payload = [randomFruit(), mouseX, mouseY]

    dropFruit(payload)
    if (room) {
      sendClick(payload)
    }
  }
})

addEventListener('touchstart', e => {
  const x = e.touches[0].clientX / innerWidth
  const y = e.touches[0].clientY / innerHeight
  const payload = [randomFruit(), x, y]

  dropFruit(payload)
  moveCursor([x, y], selfId)

  if (room) {
    sendMove([x, y])
    sendClick(payload)
  }
})

function init(n) {
  let getMove
  let getClick

  room = joinRoom(config, 'room' + n)
  ;[sendMove, getMove] = room.makeAction('mouseMove')
  ;[sendClick, getClick] = room.makeAction('click')

  byId('room-num').innerText = 'room #' + n
  room.onPeerJoin(addCursor)
  room.onPeerLeave(removeCursor)
  getMove(moveCursor)
  getClick(dropFruit)
}

function moveCursor([x, y], id) {
  const el = cursors[id]

  if (el && typeof x === 'number' && typeof y === 'number') {
    el.style.left = x * innerWidth + 'px'
    el.style.top = y * innerHeight + 'px'
  }
}

function addCursor(id, isSelf) {
  const el = document.createElement('div')
  const img = document.createElement('img')
  const txt = document.createElement('p')

  el.className = `cursor${isSelf ? ' self' : ''}`
  el.style.left = el.style.top = '-99px'
  
  // Start with first knight frame
  img.src = knightFrames[0]
  img.dataset.frameIndex = '0'
  
  // Set up animation for self cursor
  if (isSelf) {
    setInterval(() => {
      const frameIndex = (parseInt(img.dataset.frameIndex) + 1) % knightFrames.length
      img.src = knightFrames[frameIndex]
      img.dataset.frameIndex = frameIndex.toString()
    }, animationSpeed)
  } else {
    // For other cursors, use a random starting frame
    const startFrame = Math.floor(Math.random() * knightFrames.length)
    img.src = knightFrames[startFrame]
    img.dataset.frameIndex = startFrame.toString()
    
    // Animate other cursors too
    setInterval(() => {
      const frameIndex = (parseInt(img.dataset.frameIndex) + 1) % knightFrames.length
      img.src = knightFrames[frameIndex]
      img.dataset.frameIndex = frameIndex.toString()
    }, animationSpeed)
  }
  
  txt.innerText = isSelf ? 'you' : id.slice(0, 4)
  el.appendChild(img)
  el.appendChild(txt)
  canvas.appendChild(el)
  cursors[id] = el

  if (!isSelf) {
    sendMove([Math.random() * 0.93, Math.random() * 0.93], id)
    updatePeerInfo()
  }

  return el
}

function removeCursor(id) {
  if (cursors[id]) {
    canvas.removeChild(cursors[id])
  }
  updatePeerInfo()
}

function updatePeerInfo() {
  const count = Object.keys(room.getPeers()).length
  peerInfo.innerHTML = count
    ? `Right now <em>${count}</em> other peer${
        count === 1 ? ' is' : 's are'
      } connected with you. Click to send them some fruit.`
    : noPeersCopy
}

function dropFruit([fruitIndex, x, y]) {
  const fruit = fruits[fruitIndex]
  if (!fruit || typeof x !== 'number' || typeof y !== 'number') {
    return
  }

  const el = document.createElement('div')
  el.className = 'fruit'
  el.innerText = fruit
  el.style.left = x * innerWidth + 'px'
  el.style.top = y * innerHeight + 'px'
  canvas.appendChild(el)
  setTimeout(() => canvas.removeChild(el), 3000)
}

function detectKeyboardLayout() {
  // Detect keyboard layout based on common key codes
  // This is a simplified detection - could be enhanced with more sophisticated methods
  addEventListener('keydown', function detectLayout(e) {
    if (e.code === 'KeyW' || e.code === 'KeyZ') {
      // If pressing physical W key, check what character it produces
      if (e.key.toLowerCase() === 'z') {
        keyboardLayout = 'AZERTY'
        console.log('AZERTY keyboard detected')
      } else {
        keyboardLayout = 'QWERTY'
        console.log('QWERTY keyboard detected')
      }
      removeEventListener('keydown', detectLayout)
    }
  })
}

function initKeyboardControls() {
  let animationFrameId = null
  
  // Key mappings for both layouts
  const keyMappings = {
    QWERTY: {
      up: ['w', 'arrowup'],
      down: ['s', 'arrowdown'],
      left: ['a', 'arrowleft'],
      right: ['d', 'arrowright'],
      action: [' ', 'enter']
    },
    AZERTY: {
      up: ['z', 'arrowup'],
      down: ['s', 'arrowdown'],
      left: ['q', 'arrowleft'],
      right: ['d', 'arrowright'],
      action: [' ', 'enter']
    }
  }
  
  function updatePosition() {
    const keys = keyMappings[keyboardLayout]
    let dx = 0
    let dy = 0
    
    // Check movement keys
    keys.up.forEach(key => {
      if (keysPressed.has(key)) dy -= moveSpeed
    })
    keys.down.forEach(key => {
      if (keysPressed.has(key)) dy += moveSpeed
    })
    keys.left.forEach(key => {
      if (keysPressed.has(key)) dx -= moveSpeed
    })
    keys.right.forEach(key => {
      if (keysPressed.has(key)) dx += moveSpeed
    })
    
    if (dx !== 0 || dy !== 0) {
      // Update position with bounds checking
      mouseX = Math.max(0, Math.min(1, mouseX + dx))
      mouseY = Math.max(0, Math.min(1, mouseY + dy))
      
      moveCursor([mouseX, mouseY], selfId)
      if (room) {
        sendMove([mouseX, mouseY])
      }
    }
    
    if (keysPressed.size > 0) {
      animationFrameId = requestAnimationFrame(updatePosition)
    }
  }
  
  addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase()
    
    // Switch to keyboard mode on first WASD/ZQSD key press
    const keys = keyMappings[keyboardLayout]
    const allKeys = [...keys.up, ...keys.down, ...keys.left, ...keys.right, ...keys.action]
    
    if (allKeys.includes(key)) {
      e.preventDefault()
      
      if (!isKeyboardMode) {
        isKeyboardMode = true
        document.documentElement.classList.add('keyboard-mode')
        // Initialize cursor position to center if not visible
        if (mouseX === 0 && mouseY === 0) {
          mouseX = 0.5
          mouseY = 0.5
          moveCursor([mouseX, mouseY], selfId)
        }
      }
      
      // Handle action keys (space/enter for dropping fruit)
      if (keys.action.includes(key) && !keysPressed.has(key)) {
        const payload = [randomFruit(), mouseX, mouseY]
        dropFruit(payload)
        if (room) {
          sendClick(payload)
        }
      }
      
      if (!keysPressed.has(key)) {
        keysPressed.add(key)
        if (animationFrameId === null) {
          animationFrameId = requestAnimationFrame(updatePosition)
        }
      }
    }
  })
  
  addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase()
    keysPressed.delete(key)
    
    if (keysPressed.size === 0 && animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  })
  
  // Switch back to mouse mode on mouse movement
  addEventListener('mousemove', () => {
    if (isKeyboardMode) {
      isKeyboardMode = false
      document.documentElement.classList.remove('keyboard-mode')
    }
  })
  
  // Add visual indicator for controls
  const controlsIndicator = document.createElement('div')
  controlsIndicator.id = 'controls-indicator'
  controlsIndicator.innerHTML = `
    <div class="control-mode">
      <span class="mouse-mode">🖱️ Mouse Mode</span>
      <span class="keyboard-mode-text">⌨️ Keyboard Mode (${keyboardLayout === 'AZERTY' ? 'ZQSD' : 'WASD'})</span>
    </div>
    <div class="control-hint">
      Use ${keyboardLayout === 'AZERTY' ? 'ZQSD' : 'WASD'} or Arrow Keys to move • Space/Enter to drop fruit
    </div>
  `
  document.body.appendChild(controlsIndicator)
}

// WASM Game Mode with Collision Obstacles
let gameMode = false
let gameCanvas = null
let gameCtx = null
let gameState = {
  players: new Map(),
  obstacles: [],
  collectibles: [],
  tick: 0,
  myPlayer: null
}
let gameAnimationFrame = null
let gameFps = 0
let gameFrameCount = 0
let lastGameFpsTime = 0

// Initialize game mode toggle
const toggleBtn = byId('toggle-game-btn')
const gameInfo = byId('game-info')
const normalCanvas = byId('canvas')

if (toggleBtn) {
  toggleBtn.addEventListener('click', toggleGameMode)
}

function toggleGameMode() {
  gameMode = !gameMode
  
  if (gameMode) {
    // Switch to game mode
    normalCanvas.style.display = 'none'
    gameCanvas = byId('gameCanvas')
    gameCanvas.style.display = 'block'
    gameCanvas.style.margin = '20px auto'
    gameCanvas.style.display = 'block'
    gameInfo.style.display = 'block'
    gameCtx = gameCanvas.getContext('2d')
    
    toggleBtn.textContent = '🎨 Back to Cursor Mode'
    
    // Initialize game state
    initializeGameState()
    startGameLoop()
    
    // Set up game action channels
    if (room) {
      const [sendGameAction, getGameAction] = room.makeAction('gameAction')
      const [sendGameState, getGameState] = room.makeAction('gameState')
      
      getGameAction((action, peerId) => {
        processGameAction(peerId, action)
      })
      
      getGameState((state, peerId) => {
        if (state.obstacles) gameState.obstacles = state.obstacles
        if (state.collectibles) gameState.collectibles = state.collectibles
      })
    }
  } else {
    // Switch back to normal mode
    gameCanvas.style.display = 'none'
    normalCanvas.style.display = 'block'
    gameInfo.style.display = 'none'
    toggleBtn.textContent = '🎮 Try WASM Game Mode with Collision Obstacles'
    
    if (gameAnimationFrame) {
      cancelAnimationFrame(gameAnimationFrame)
      gameAnimationFrame = null
    }
  }
}

function initializeGameState() {
  // Initialize obstacles (walls that block movement)
  gameState.obstacles = [
    {x: 375, y: 100, width: 50, height: 200, type: 'wall', color: '#8B0000'},
    {x: 200, y: 250, width: 100, height: 30, type: 'platform', color: '#4B0082'},
    {x: 500, y: 250, width: 100, height: 30, type: 'platform', color: '#4B0082'},
    {x: 100, y: 150, width: 30, height: 150, type: 'wall', color: '#8B0000'},
    {x: 670, y: 150, width: 30, height: 150, type: 'wall', color: '#8B0000'}
  ]
  
  // Initialize collectibles
  gameState.collectibles = [
    {x: 150, y: 200, radius: 10, type: 'coin', color: '#FFD700'},
    {x: 650, y: 200, radius: 10, type: 'coin', color: '#FFD700'},
    {x: 400, y: 50, radius: 10, type: 'coin', color: '#FFD700'},
    {x: 250, y: 230, radius: 10, type: 'coin', color: '#FFD700'},
    {x: 550, y: 230, radius: 10, type: 'coin', color: '#FFD700'}
  ]
  
  // Initialize player
  if (!gameState.myPlayer) {
    gameState.myPlayer = {
      id: selfId,
      x: 50,
      y: 200,
      vx: 0,
      vy: 0,
      width: 30,
      height: 30,
      color: '#00FF00',
      score: 0,
      onGround: false
    }
    gameState.players.set(selfId, gameState.myPlayer)
  }
}

function startGameLoop() {
  const gameLoop = (currentTime) => {
    if (!gameMode) return
    
    // Update FPS
    gameFrameCount++
    if (currentTime - lastGameFpsTime >= 1000) {
      gameFps = gameFrameCount
      gameFrameCount = 0
      lastGameFpsTime = currentTime
      byId('game-fps').textContent = gameFps
    }
    
    // Update game physics
    updateGamePhysics()
    
    // Render game
    renderGame()
    
    gameAnimationFrame = requestAnimationFrame(gameLoop)
  }
  
  lastGameFpsTime = performance.now()
  gameLoop(lastGameFpsTime)
}

function updateGamePhysics() {
  gameState.tick++
  
  // Update player physics
  if (gameState.myPlayer) {
    const player = gameState.myPlayer
    
    // Apply gravity
    if (!player.onGround) {
      player.vy += 0.5 // Gravity
    }
    
    // Update position
    const newX = player.x + player.vx
    const newY = player.y + player.vy
    
    // Check collision with obstacles
    let canMoveX = true
    let canMoveY = true
    player.onGround = false
    
    for (const obstacle of gameState.obstacles) {
      // Check X collision
      if (willCollide(newX, player.y, player.width, player.height, obstacle)) {
        canMoveX = false
        player.vx = 0
      }
      
      // Check Y collision
      if (willCollide(player.x, newY, player.width, player.height, obstacle)) {
        canMoveY = false
        
        // Check if landing on top of obstacle
        if (player.vy > 0 && player.y < obstacle.y) {
          player.onGround = true
          player.y = obstacle.y - player.height
        }
        player.vy = 0
      }
      
      // Check if standing on obstacle
      if (willCollide(player.x, player.y + 1, player.width, player.height, obstacle)) {
        player.onGround = true
      }
    }
    
    // Check ground collision
    if (newY + player.height > gameCanvas.height) {
      canMoveY = false
      player.onGround = true
      player.y = gameCanvas.height - player.height
      player.vy = 0
    }
    
    // Apply movement if no collision
    if (canMoveX) player.x = newX
    if (canMoveY) player.y = newY
    
    // Keep player in bounds
    player.x = Math.max(0, Math.min(gameCanvas.width - player.width, player.x))
    
    // Check collectible collision
    gameState.collectibles = gameState.collectibles.filter(collectible => {
      const dx = (player.x + player.width/2) - collectible.x
      const dy = (player.y + player.height/2) - collectible.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < collectible.radius + Math.min(player.width, player.height)/2) {
        player.score += 10
        byId('game-score').textContent = player.score
        return false // Remove collectible
      }
      return true
    })
    
    // Apply friction
    player.vx *= 0.9
    if (Math.abs(player.vx) < 0.1) player.vx = 0
  }
}

function willCollide(x, y, width, height, obstacle) {
  return x < obstacle.x + obstacle.width &&
         x + width > obstacle.x &&
         y < obstacle.y + obstacle.height &&
         y + height > obstacle.y
}

function renderGame() {
  if (!gameCtx) return
  
  // Clear canvas
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
  
  // Draw background gradient
  const bgGradient = gameCtx.createLinearGradient(0, 0, 0, gameCanvas.height)
  bgGradient.addColorStop(0, '#1a1a2e')
  bgGradient.addColorStop(1, '#0f0f1e')
  gameCtx.fillStyle = bgGradient
  gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height)
  
  // Draw obstacles with collision indication
  gameState.obstacles.forEach(obstacle => {
    // Draw shadow
    gameCtx.fillStyle = 'rgba(0,0,0,0.3)'
    gameCtx.fillRect(obstacle.x + 3, obstacle.y + 3, obstacle.width, obstacle.height)
    
    // Draw obstacle
    gameCtx.fillStyle = obstacle.color
    gameCtx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
    
    // Draw border
    gameCtx.strokeStyle = '#000'
    gameCtx.lineWidth = 2
    gameCtx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
    
    // Draw warning stripes for walls
    if (obstacle.type === 'wall') {
      gameCtx.save()
      gameCtx.globalAlpha = 0.3
      gameCtx.fillStyle = '#FFD700'
      for (let i = 0; i < obstacle.width; i += 10) {
        gameCtx.fillRect(obstacle.x + i, obstacle.y, 5, obstacle.height)
      }
      gameCtx.restore()
    }
  })
  
  // Draw collectibles
  gameState.collectibles.forEach(collectible => {
    // Draw glow effect
    gameCtx.shadowColor = collectible.color
    gameCtx.shadowBlur = 15
    
    gameCtx.fillStyle = collectible.color
    gameCtx.beginPath()
    gameCtx.arc(collectible.x, collectible.y, collectible.radius, 0, Math.PI * 2)
    gameCtx.fill()
    
    gameCtx.fillStyle = '#FFF'
    gameCtx.beginPath()
    gameCtx.arc(collectible.x, collectible.y, collectible.radius * 0.5, 0, Math.PI * 2)
    gameCtx.fill()
    
    gameCtx.shadowColor = 'transparent'
    gameCtx.shadowBlur = 0
  })
  
  // Draw players
  gameState.players.forEach(player => {
    // Draw shadow
    gameCtx.fillStyle = 'rgba(0,0,0,0.3)'
    gameCtx.fillRect(player.x + 2, player.y + 2, player.width, player.height)
    
    // Draw player
    gameCtx.fillStyle = player.color
    gameCtx.fillRect(player.x, player.y, player.width, player.height)
    
    // Draw border
    gameCtx.strokeStyle = player.id === selfId ? '#FFD700' : '#000'
    gameCtx.lineWidth = player.id === selfId ? 3 : 2
    gameCtx.strokeRect(player.x, player.y, player.width, player.height)
    
    // Draw eyes
    gameCtx.fillStyle = '#FFF'
    gameCtx.beginPath()
    gameCtx.arc(player.x + 8, player.y + 10, 3, 0, Math.PI * 2)
    gameCtx.arc(player.x + 22, player.y + 10, 3, 0, Math.PI * 2)
    gameCtx.fill()
    
    gameCtx.fillStyle = '#000'
    gameCtx.beginPath()
    gameCtx.arc(player.x + 8, player.y + 10, 1.5, 0, Math.PI * 2)
    gameCtx.arc(player.x + 22, player.y + 10, 1.5, 0, Math.PI * 2)
    gameCtx.fill()
  })
  
  // Draw HUD
  gameCtx.fillStyle = 'rgba(0,0,0,0.5)'
  gameCtx.fillRect(5, 5, 200, 30)
  gameCtx.fillStyle = '#FFF'
  gameCtx.font = '14px Space Mono'
  gameCtx.textAlign = 'left'
  gameCtx.fillText(`Tick: ${gameState.tick} | Obstacles: ${gameState.obstacles.length}`, 15, 25)
}

function processGameAction(peerId, action) {
  let player = gameState.players.get(peerId)
  if (!player) {
    player = {
      id: peerId,
      x: 50,
      y: 200,
      vx: 0,
      vy: 0,
      width: 30,
      height: 30,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      score: 0,
      onGround: false
    }
    gameState.players.set(peerId, player)
  }
  
  switch(action.type) {
    case 'move':
      if (action.direction === 'left') player.vx = -5
      else if (action.direction === 'right') player.vx = 5
      break
    case 'jump':
      if (player.onGround) player.vy = -12
      break
    case 'stop':
      player.vx = 0
      break
  }
}

// Add keyboard controls for game mode
addEventListener('keydown', (e) => {
  if (!gameMode || !gameState.myPlayer) return
  
  let action = null
  
  switch(e.key.toLowerCase()) {
    case 'arrowleft':
    case 'a':
      gameState.myPlayer.vx = -5
      action = {type: 'move', direction: 'left'}
      e.preventDefault()
      break
    case 'arrowright':
    case 'd':
      gameState.myPlayer.vx = 5
      action = {type: 'move', direction: 'right'}
      e.preventDefault()
      break
    case ' ':
    case 'w':
    case 'arrowup':
      if (gameState.myPlayer.onGround) {
        gameState.myPlayer.vy = -12
        action = {type: 'jump'}
      }
      e.preventDefault()
      break
  }
  
  // Send action to other players
  if (action && room) {
    const [sendGameAction] = room.makeAction('gameAction')
    sendGameAction(action)
  }
})

addEventListener('keyup', (e) => {
  if (!gameMode || !gameState.myPlayer) return
  
  if (['arrowleft', 'arrowright', 'a', 'd'].includes(e.key.toLowerCase())) {
    gameState.myPlayer.vx = 0
    
    if (room) {
      const [sendGameAction] = room.makeAction('gameAction')
      sendGameAction({type: 'stop'})
    }
  }
})
