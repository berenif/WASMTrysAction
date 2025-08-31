# Game Design Document - Roguelike Core Loop

## Overview
This document outlines the detailed design for our roguelike game implementing the 8-phase core gameplay loop.

## Core Philosophy
The game focuses on **immediate feedback**, **meaningful choices**, and **escalating tension** through a carefully crafted loop that encourages "one more run" gameplay.

## Detailed Systems Design

### 1. EXPLORATION SYSTEM

#### Fog of War
- **Vision Range**: 5 tiles base, modifiable by items
- **Memory**: Previously seen areas remain as ghosted tiles
- **Secrets**: Hidden rooms revealed by proximity or special abilities
- **Landmarks**: Distinctive visual markers for navigation

#### Room Types
- **Standard**: 5x5 to 9x9, various shapes
- **Arena**: Large open spaces for combat
- **Treasure**: Small, heavily guarded
- **Shop**: Safe zones with merchants
- **Boss**: Multi-room encounters

#### Discovery Events
- **Lore Tablets**: World-building snippets
- **Hidden Caches**: Small resource rewards
- **Trap Rooms**: Risk/reward scenarios
- **NPC Encounters**: Dialogue choices with consequences

### 2. COMBAT SYSTEM

#### Player Mechanics
- **Movement Speed**: 4 tiles/second base
- **Dodge Roll**: 0.5s i-frames, 2s cooldown
- **Block/Parry**: Timing window of 0.3s
- **Stamina System**: 100 points, regenerates 20/s

#### Enemy Design
- **Grunt**: Basic melee, predictable patterns
- **Ranger**: Projectile attacks, forces movement
- **Tank**: High HP, area denial
- **Swarm**: Multiple weak enemies
- **Elite**: Enhanced versions with modifiers

#### Combat Flow
1. **Telegraph Phase**: 0.5-1s warning animations
2. **Attack Phase**: Active hitboxes
3. **Recovery Phase**: Enemy vulnerability window
4. **Positioning**: Environmental hazards and cover

### 3. CHOICE SYSTEM

#### Upgrade Categories
- **Offensive**: Damage, crit, attack speed
- **Defensive**: HP, armor, dodge chance
- **Utility**: Movement, vision, resource generation
- **Synergy**: Combo enablers, build definers

#### Choice Presentation
- Always present exactly 3 options
- Color-coded by rarity (Common/Rare/Epic/Legendary)
- Preview text shows immediate effects
- Icons indicate synergies with current build

#### Build Archetypes
- **Berserker**: High damage, low defense
- **Tank**: Damage mitigation, crowd control
- **Speedster**: Mobility and evasion
- **Spellblade**: Hybrid melee/magic
- **Summoner**: Pet-based gameplay

### 4. POWER-UP SYSTEM

#### Immediate Power-ups
- **Stat Boosts**: +10% damage, +20 HP, etc.
- **New Abilities**: Double jump, dash attack, shield bash
- **Passive Effects**: Life steal, thorns, regeneration

#### Relic System
- **Common Relics**: Minor stat improvements
- **Rare Relics**: Gameplay modifiers
- **Legendary Relics**: Build-defining effects
- **Cursed Relics**: Powerful with drawbacks

#### Breakpoints
- Damage thresholds that one-shot enemies
- Speed thresholds for extra actions
- Defense thresholds for immunity

### 5. RISK/REWARD MECHANICS

#### Elite Encounters
- **Modifiers**: Speed+, Damage+, Splitting, Regenerating
- **Rewards**: Guaranteed rare+ item, extra currency
- **Scaling**: Elite difficulty increases with floor

#### Curse System
- **Types**: Reduced healing, increased prices, fragile items
- **Stacking**: Multiple curses compound difficulty
- **Removal**: Special shrines or expensive shop items

#### Timed Events
- **Treasure Rooms**: 30s to grab loot
- **Escape Sequences**: Rising lava/poison
- **Speed Challenges**: Bonus for fast completion

### 6. ESCALATION SYSTEM

#### Biome Progression
1. **Dungeon**: Standard, balanced
2. **Caverns**: Limited vision, ambush focus
3. **Factory**: Environmental hazards, timing
4. **Temple**: Magic-heavy, puzzle elements
5. **Void**: All mechanics combined, highest difficulty

#### Difficulty Scaling
- **Enemy HP**: +15% per floor
- **Enemy Damage**: +10% per floor
- **Enemy Density**: Gradual increase
- **New Enemy Types**: Introduced per biome

#### Miniboss System
- Appears every 3 floors
- Tests specific build aspects
- Drops guaranteed upgrade
- Optional challenge for bonus rewards

### 7. ECONOMY SYSTEM

#### Currencies
- **Gold**: Primary, for shops and upgrades
- **Souls**: Rare, for permanent unlocks
- **Keys**: Limited, for special doors

#### Shop System
- **Item Shop**: 3-5 items per floor
- **Upgrade Shop**: Enhance existing items
- **Removal Service**: Delete unwanted upgrades
- **Healing Station**: HP restoration at cost

#### Economic Pressure
- Prices increase with progression
- Limited currency per floor
- Forced choices between power and sustain

### 8. META-PROGRESSION

#### Unlock System
- **Characters**: New starting classes
- **Items**: Expand item pool
- **Modes**: Challenge runs, daily seeds
- **Lore**: Story fragments and endings

#### Run Statistics
- **Time**: Total and per-floor
- **Damage Dealt/Taken**: Combat efficiency
- **Rooms Explored**: Completion percentage
- **Build Path**: Visual skill tree recap

#### Quick Restart
- **Instant Reset**: One button to new run
- **Seed System**: Share and replay runs
- **Fast Forward**: Skip seen cutscenes/tutorials

## Technical Specifications

### Performance Targets
- 60 FPS minimum
- Load time < 3 seconds
- Input latency < 16ms

### Control Scheme
- **WASD**: Movement
- **Mouse**: Aim/interact
- **Space**: Dodge roll
- **E**: Interact
- **Tab**: Inventory
- **Esc**: Pause menu

### Save System
- Auto-save between floors
- Multiple save slots
- Cloud sync support

## Balancing Guidelines

### Time Targets
- **Average Run**: 30-45 minutes
- **First Floor**: 3-5 minutes
- **Boss Fight**: 2-3 minutes
- **Shop Visit**: 30-60 seconds

### Difficulty Curve
- **Floors 1-3**: Tutorial and onboarding
- **Floors 4-6**: Core mechanics mastery
- **Floors 7-9**: Build optimization required
- **Floor 10+**: Elite player challenge

### Resource Distribution
- **Health Potions**: 1 per 2 floors average
- **Currency**: 100-200 gold per floor
- **Upgrades**: 2-3 choices per floor
- **Rare Items**: 10% chance per room