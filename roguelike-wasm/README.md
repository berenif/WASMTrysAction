# Roguelike WASM Game

A classic roguelike dungeon crawler game built with Rust and WebAssembly.

## Features

- **Procedurally Generated Dungeons**: Each floor is randomly generated with rooms and corridors
- **Turn-Based Combat**: Strategic combat system with monsters that react to your presence
- **Items & Loot**: Collect gold, potions, weapons, and armor
- **Field of View**: Dynamic lighting system with fog of war
- **Multiple Floors**: Descend deeper into the dungeon via stairs
- **Score System**: Track your progress and compete for high scores

## Game Elements

### Entities
- **@ (Player)**: That's you! Navigate the dungeon and survive
- **M (Monsters)**: Various enemies including Goblins, Orcs, and Trolls
- **$ (Gold)**: Increases your score by 50 points
- **! (Potions)**: Restore 30 HP when consumed
- **/ (Weapons)**: Increase your attack power
- **[ (Armor)**: Increase your defense

### Tiles
- **# (Walls)**: Impassable terrain
- **. (Floor)**: Walkable area
- **> (Stairs)**: Descend to the next floor

## Controls

### Movement
- **WASD** or **Arrow Keys**: Move in cardinal directions
- **Q/E/Z/C**: Move diagonally
- **Numpad**: Full 8-directional movement

### Combat
- Walk into a monster to attack it
- Monsters will chase and attack you when nearby

## Building from Source

### Prerequisites
- Rust (with wasm32-unknown-unknown target)
- wasm-pack

### Build Steps

1. Install Rust and wasm-pack:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
```

2. Build the WASM module:
```bash
cd roguelike-wasm
wasm-pack build --target web --out-dir ../docs/wasm
```

3. Serve the game:
```bash
cd ../docs
python3 -m http.server 8080
```

4. Open http://localhost:8080 in your browser

## Technical Details

### Architecture
- **Core Game Logic**: Written in Rust for performance and safety
- **WebAssembly Binding**: Using wasm-bindgen for JavaScript interop
- **Rendering**: HTML5 Canvas with tile-based graphics
- **State Management**: Game state fully managed in Rust

### Map Generation Algorithm
1. Generate random rooms of varying sizes
2. Ensure rooms don't overlap
3. Connect rooms with corridors
4. Populate with monsters and items
5. Place stairs in the last room

### Field of View
- Simple ray-casting algorithm
- 8-tile radius visibility
- Explored areas remain visible but dimmed

## Development

### Project Structure
```
roguelike-wasm/
├── src/
│   └── lib.rs        # Main game logic
├── Cargo.toml        # Rust dependencies
└── README.md         # This file

docs/
├── index.html        # Game UI
└── wasm/            # Built WASM modules
```

### Adding New Features

To add new entity types:
1. Add variant to `EntityType` enum
2. Define properties in `Entity::new()`
3. Handle interactions in `move_player()`
4. Add rendering in the JavaScript layer

To modify map generation:
1. Adjust constants at the top of lib.rs
2. Modify `generate_map()` function
3. Tweak room size and count parameters

## Performance

The game is optimized for web performance:
- Small WASM binary size (~50KB)
- Efficient tile-based rendering
- Minimal memory allocations
- Turn-based gameplay (no continuous updates)

## License

This project is part of the Trystero examples and follows the same MIT license.