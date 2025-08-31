# Trystero Project - AI Agent Guide

## 🎯 Project Overview

**Trystero** is a serverless WebRTC library that enables instant peer-to-peer (P2P) connections between web app users without requiring a server. It provides automatic peer discovery through various decentralized networks while ensuring all data transmission remains encrypted and direct between peers.

### Key Features
- **Serverless P2P Communication**: No server required for data exchange
- **Multiple Connection Strategies**: BitTorrent, Nostr, MQTT, Supabase, Firebase, IPFS
- **WebRTC Abstractions**: Simplified API for complex WebRTC operations
- **End-to-End Encryption**: All peer data is encrypted
- **Cross-Platform**: Works in browsers and server-side (Node.js, Deno, Bun)

## 📁 Project Structure

```
/workspace/
├── src/                    # Core library source code
│   ├── index.js           # Main entry point (exports Nostr strategy by default)
│   ├── room.js            # Room management and peer connection logic
│   ├── peer.js            # WebRTC peer connection handling
│   ├── strategy.js        # Base strategy implementation
│   ├── crypto.js          # Encryption utilities
│   ├── utils.js           # Helper functions
│   │
│   ├── nostr.js/d.ts      # Nostr strategy implementation
│   ├── torrent.js/d.ts    # BitTorrent strategy
│   ├── firebase.js/d.ts   # Firebase strategy
│   ├── supabase.js/d.ts   # Supabase strategy
│   ├── mqtt.js/d.ts       # MQTT strategy
│   ├── ipfs.js/d.ts       # IPFS strategy
│   │
│   ├── game.js/d.ts       # Game module main export
│   └── wasm/              # WASM game engine
│       ├── game-engine.js/d.ts    # WASM loader and interface
│       ├── game-room.js/d.ts      # Game room integration
│       └── examples/              # Example WASM games
│           ├── simple-game.ts     # AssemblyScript game example
│           └── usage-example.js   # Integration examples
│
├── test/                   # Test files
│   ├── tests.js           # Main test suite
│   ├── *.spec.js          # Strategy-specific test runners
│   └── certs/             # SSL certificates for testing
│
├── scripts/                # Utility scripts
│   ├── get-bundle-sizes.js    # Bundle size analysis
│   ├── test-ice.js            # ICE server testing
│   ├── test-relays.js         # Relay server testing
│   ├── find-proxy.js          # Proxy discovery for testing
│   └── build-wasm.js          # WASM compilation script
│
├── docs/                   # Documentation website
│   ├── index.html         # Demo page
│   ├── site.js/css        # Demo application
│   └── images/            # Documentation assets
│
├── dist/                   # Build output (generated)
│   ├── trystero-*.min.js  # Strategy bundles
│   └── wasm/              # Compiled WASM modules
│
├── package.json           # Project dependencies and scripts
├── rollup.config.js       # Build configuration
├── eslint.config.js       # Linting rules
├── playwright.config.js   # E2E testing configuration
└── README.md              # Main documentation
```

## 🛠 Technology Stack

### Core Dependencies
- **@noble/secp256k1**: Cryptographic operations for Nostr
- **@supabase/supabase-js**: Supabase integration
- **@waku/sdk**: Waku protocol for decentralized messaging
- **firebase**: Firebase Realtime Database integration
- **libp2p**: IPFS networking
- **mqtt**: MQTT protocol support

### Development Tools
- **Build**: Rollup with plugins for bundling
- **Testing**: Playwright for E2E tests
- **Linting**: ESLint with modern config
- **Formatting**: Prettier
- **Package Manager**: npm

## 🔧 Development Workflow

### Essential Commands
```bash
# Install dependencies
npm install

# Build the project (creates bundles)
npm run build

# Run tests
npm test

# Test with proxy (for network testing)
npm run test-proxy

# Check bundle sizes
npm run get-bundle-sizes

# Test ICE servers
npm run test-ice

# Test relay servers
npm run test-relays
```

### Project Configuration Files
- **rollup.config.js**: Handles building strategy-specific bundles
- **playwright.config.js**: Configures browser testing
- **eslint.config.js**: Code quality rules
- **.prettierrc**: Code formatting rules

## 🏗 Architecture & Design Patterns

### Core Concepts

1. **Strategies**: Different network backends for peer discovery
   - Each strategy implements the same interface
   - Located in `src/{strategy}.js` with TypeScript definitions
   - All strategies inherit from base implementation in `strategy.js`

2. **Rooms**: Logical groupings of peers
   - Managed by `room.js`
   - Handle peer lifecycle, data transmission, and media streams
   - Provide action-based messaging system

3. **Actions**: Named communication channels
   - Created via `makeAction(namespace)`
   - Return [sender, receiver, progress] tuple
   - Support metadata and progress tracking

4. **Peer Connections**: WebRTC connection management
   - Handled by `peer.js`
   - Manages SDP exchange, ICE candidates, and data channels

5. **WASM Game Engine**: High-performance game logic execution
   - WebAssembly modules for deterministic game logic
   - Integrated with P2P networking layer
   - Support for real-time and turn-based games
   - Client-side prediction and interpolation

### Key Design Decisions
- **Modular Strategy System**: Easy to add new connection strategies
- **Promise-Based API**: Modern async/await support
- **Event-Driven Architecture**: Reactive peer and stream events
- **Automatic Serialization**: JSON/binary data handled transparently
- **Progressive Enhancement**: Chunking for large data transfers

## 📝 Code Style & Conventions

### JavaScript Style
- ES6 modules throughout
- Async/await for asynchronous operations
- Destructuring and spread operators preferred
- Functional programming patterns where appropriate
- Constants in UPPER_SNAKE_CASE
- Private methods prefixed with underscore

### File Organization
- One strategy per file
- TypeScript definitions alongside implementations
- Shared utilities in `utils.js`
- Cryptographic operations isolated in `crypto.js`

### Testing Approach
- Integration tests using real browsers (Playwright)
- Strategy-specific test files
- HTTPS testing with self-signed certificates
- Proxy testing for network resilience

## 🔑 Important Implementation Details

### Peer ID Generation
- Uses cryptographically secure random IDs
- Stored in `selfId` export
- Consistent across room joins in same session

### Data Channel Management
- Automatic chunking for large payloads
- Configurable chunk size (default 16KB)
- Progress events for transfers
- Binary and text data support

### Connection Lifecycle
1. Join room with strategy config
2. Exchange SDP offers/answers via strategy
3. Establish WebRTC connection
4. Open data channels for communication
5. Handle peer events (join/leave)

### Security Considerations
- Optional password-based room encryption
- WebRTC's built-in DTLS encryption
- No data touches signaling servers
- Peer verification through shared secrets

## ⚠️ Common Pitfalls & Solutions

### When Working on This Codebase

1. **Strategy Initialization**
   - Each strategy may require specific configuration
   - Firebase/Supabase need API keys
   - MQTT/IPFS may need custom servers

2. **Testing Challenges**
   - Requires HTTPS for WebRTC in browsers
   - Self-signed certificates in `test/certs/`
   - Proxy testing for TURN server validation

3. **Bundle Management**
   - Separate bundles for each strategy
   - Rollup config handles strategy-specific builds
   - Tree-shaking to minimize bundle size

4. **Cross-Browser Compatibility**
   - WebRTC API differences between browsers
   - Adapter patterns in peer.js
   - Feature detection for optional APIs

## 🚀 Making Changes

### Adding a New Strategy
1. Create `src/newstrategy.js` implementing base interface
2. Add TypeScript definitions in `src/newstrategy.d.ts`
3. Export from package.json exports field
4. Add to rollup.config.js for bundling
5. Create test file `test/newstrategy.spec.js`
6. Update README with strategy documentation

### Modifying Core Functionality
1. Changes to `room.js` affect all strategies
2. Update TypeScript definitions for API changes
3. Ensure backward compatibility or bump major version
4. Add tests for new functionality
5. Update README documentation

### Performance Optimization
- Monitor bundle sizes with `npm run get-bundle-sizes`
- Use lazy loading for strategy-specific code
- Minimize external dependencies
- Profile WebRTC performance in browsers

## 🎮 WASM Game Architecture

### Overview
The WASM game module extends Trystero with high-performance game logic capabilities, allowing developers to build multiplayer games with deterministic physics, complex game state management, and efficient networking.

### Architecture Components

#### 1. Game Engine Layer (`src/wasm/game-engine.js`)
- **WASM Module Loader**: Handles loading and initialization of WebAssembly modules
- **Memory Management**: Efficient memory allocation and string/object serialization
- **Game Instance Management**: Creates and manages multiple game instances
- **State Processing**: Processes game actions and maintains authoritative state
- **Event System**: Bridges WASM events with JavaScript callbacks

#### 2. Room Integration Layer (`src/wasm/game-room.js`)
- **Enhanced Room**: Extends base Trystero rooms with game capabilities
- **Network Synchronization**: Handles state sync between peers
- **Host Management**: Automatic host selection and transfer
- **Action Queue**: Manages game actions with latency compensation
- **Update Loop**: Configurable tick rate for game updates

#### 3. WASM Game Logic
- **AssemblyScript/Rust/C++**: Write game logic in compiled languages
- **Deterministic Execution**: Ensures consistent game state across peers
- **Efficient Processing**: Native performance for physics and calculations
- **Memory Safety**: Sandboxed execution environment

### Key Features

#### Client-Side Prediction
- Immediate response to player inputs
- Rollback and reconciliation with authoritative state
- Configurable prediction settings

#### State Interpolation
- Smooth visual updates between network syncs
- Latency compensation
- Configurable interpolation settings

#### Host Authority Model
- One peer acts as authoritative host
- Automatic host migration on disconnect
- Optional host-less mode for deterministic games

#### Game State Management
- Efficient binary serialization
- Delta compression for network updates
- State persistence and replay support

### Usage Patterns

#### Real-Time Games
```javascript
import {joinRoom} from 'trystero/nostr'
import {createGameRoom} from 'trystero/game'

const room = joinRoom({appId: 'my-game'}, 'room-id')
const gameRoom = await createGameRoom(room, wasmModule, {
  tickRate: 60,
  syncInterval: 100,
  interpolation: true,
  prediction: true
})
```

#### Turn-Based Games
```javascript
const gameRoom = await createGameRoom(room, wasmModule, {
  tickRate: 1,
  syncInterval: 1000,
  interpolation: false,
  prediction: false,
  requireHost: false
})
```

### Building WASM Games

#### 1. Write Game Logic (AssemblyScript Example)
```typescript
export function update_game(gameId: i32, deltaTime: f32): i32 {
  // Update physics, check collisions, process game rules
  return serializeState()
}
```

#### 2. Compile to WASM
```bash
npm run build-wasm
# Or manually: npx asc game.ts -o game.wasm --optimize
```

#### 3. Integrate with Trystero
```javascript
const gameRoom = await createGameRoomFromUrl(
  room,
  '/dist/wasm/game.wasm',
  config
)
```

### Performance Considerations
- WASM execution is near-native speed
- Minimize memory copies between WASM and JavaScript
- Use binary data for network transmission when possible
- Profile both WASM and JavaScript performance

### Security
- WASM runs in sandboxed environment
- No direct DOM or network access from WASM
- All I/O through controlled host functions
- Validate all inputs from peers

## 📚 External Resources

### Documentation
- [Main README](/workspace/README.md) - Comprehensive user guide
- [Demo Site](https://oxism.com/trystero) - Live examples
- [Awesome Trystero](https://github.com/jeremyckahn/awesome-trystero) - Community projects

### Related Technologies
- [WebRTC MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [libp2p Documentation](https://docs.libp2p.io/)
- [Nostr Protocol](https://github.com/nostr-protocol/nostr)
- [MQTT Protocol](https://mqtt.org/)

## 🐛 Debugging Tips

### Common Issues
1. **Connection Failures**
   - Check STUN/TURN server configuration
   - Verify strategy-specific setup (API keys, servers)
   - Test with `npm run test-ice`

2. **Data Transfer Problems**
   - Monitor chunk size for large payloads
   - Check serialization of complex data types
   - Verify peer connection state

3. **Strategy-Specific Issues**
   - BitTorrent: Tracker availability
   - Firebase/Supabase: API quotas
   - IPFS: Bootstrap node connectivity
   - MQTT: Broker configuration

### Debugging Tools
- Browser DevTools WebRTC internals (`chrome://webrtc-internals/`)
- Network tab for signaling traffic
- Console logging with debug flags
- Playwright test traces for E2E debugging

## 🎯 Quick Start for AI Agents

When working on tasks in this project:

1. **Understand the module system**: ES6 modules with multiple entry points
2. **Respect the architecture**: Strategies are pluggable, core is shared
3. **Test changes**: Run `npm test` after modifications
4. **Check types**: Ensure TypeScript definitions match implementations
5. **Follow conventions**: Maintain existing code style and patterns
6. **Document changes**: Update relevant documentation and comments
7. **Consider bundle size**: Use `npm run get-bundle-sizes` to monitor impact

## 💡 Pro Tips

- The default export uses Nostr strategy for ease of use
- Each strategy has trade-offs (see README strategy comparison)
- Room IDs should be unique but guessable by intended peers
- Password protection adds a layer of security to rooms
- Media streams require additional setup beyond data channels
- Server-side usage requires polyfills for WebRTC APIs

---

*This guide is designed to help AI agents quickly understand and contribute to the Trystero project. For user-facing documentation, refer to the main README.md file.*