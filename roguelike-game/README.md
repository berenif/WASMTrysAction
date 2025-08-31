# Roguelike Game - Core Loop Implementation

A modern roguelike game implementing the 8-phase core gameplay loop: Explore → Fight → Choose → Power-up → Push your luck → Escalate → Cash-out → Reset

## 🎮 Core Gameplay Loop

### 1. Explore
- **Goal**: Read the space fast, spot threats, sniff out rewards
- **Features**: Clear landmarks, light fog of war, tiny secrets that pay off often
- **Mechanics**: Room shapes and hazards, discovery events, safe peeks (doors/corners)

### 2. Fight
- **Goal**: Express skill under pressure
- **Features**: Snappy movement, readable telegraphs, reliable i-frames or guards
- **Mechanics**: Enemy mix forcing position, crowd control windows, breakable armor/posture

### 3. Choose
- **Goal**: Draft the run's identity in small bites
- **Features**: Three solid options with tradeoffs, hints of future combos
- **Mechanics**: Limited slots, exclusions to avoid non-choices, clear text and quick comparisons

### 4. Power-up
- **Goal**: Feel stronger now, not later
- **Features**: Immediate breakpoints, visible stat jumps, new verbs to play with
- **Mechanics**: Boons, relics, affixes, pets, cooldown tweaks (passive/active/economy picks)

### 5. Push Your Luck
- **Goal**: Opt into risk for better rewards
- **Features**: Elites, curses, timed chests, shrines (HP/gold costs)
- **Mechanics**: Predictable risk, juicy upside, clear escape hatches

### 6. Escalate
- **Goal**: New problems, not just bigger numbers
- **Features**: Biomes changing rules, enemy variants, fresh hazards
- **Mechanics**: Density pacing, elite modifiers, miniboss interrupts testing builds

### 7. Cash-out
- **Goal**: Spend smart, heal, or double-down
- **Features**: Tense shops, removals, reforges, forge taxes
- **Mechanics**: Two scarce currencies, one sink that hurts, one safety valve that soothes

### 8. Reset
- **Goal**: Fail fast, try again with different angle
- **Features**: Instant restart, seed variety, short early rooms
- **Mechanics**: Post-run recap, meta drip, teases of almost-unlocked content

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Pygame 2.5+

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/roguelike-game.git
cd roguelike-game

# Install dependencies
pip install -r requirements.txt

# Run the game
python src/main.py
```

## 📁 Project Structure
```
roguelike-game/
├── src/                 # Source code
│   ├── core/           # Core game loop
│   ├── systems/        # Game systems (combat, exploration, etc.)
│   ├── entities/       # Player, enemies, items
│   ├── ui/            # User interface
│   └── utils/         # Utilities
├── assets/             # Game assets
│   ├── sprites/       # Graphics
│   ├── sounds/        # Audio
│   └── data/          # Game data (JSON/YAML)
├── docs/              # Documentation
│   ├── GAME_DESIGN.md
│   └── DEVELOPMENT_PLAN.md
├── tests/             # Unit tests
└── requirements.txt   # Dependencies
```

## 📊 Development Status

Check [DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) for detailed progress tracking.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.