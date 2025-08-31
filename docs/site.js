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
