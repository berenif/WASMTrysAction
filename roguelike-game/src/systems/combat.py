"""Combat system - Phase 2 of the core loop."""

import pygame
from typing import List
import math
import random

from systems.base import BaseSystem


class CombatSystem(BaseSystem):
    """
    Handles combat phase:
    - Enemy AI and movement
    - Attack telegraphs
    - Damage calculation
    - I-frames and dodging
    """
    
    def __init__(self, game_state, settings):
        """Initialize combat system."""
        super().__init__(game_state, settings)
        self.combat_complete = False
        self.player_victory = False
        self.telegraph_timers = {}
        self.attack_cooldowns = {}
    
    def enter(self):
        """Enter combat phase."""
        self.active = True
        self.combat_complete = False
        self.player_victory = False
        print("Entering COMBAT phase")
        
        # Initialize combat with current room's enemies
        current_room = self.game_state.rooms[self.game_state.current_room_index]
        self.game_state.enemies = current_room.enemies.copy()
        self.game_state.in_combat = True
        
        # Initialize enemy timers
        for i, enemy in enumerate(self.game_state.enemies):
            self.telegraph_timers[i] = 0
            self.attack_cooldowns[i] = random.uniform(1.0, 2.0)
    
    def update(self, dt: float, events: List[pygame.event.Event]):
        """Update combat logic."""
        if not self.active or self.combat_complete:
            return
        
        # Update player dodge cooldown
        if self.game_state.player.dodge_cooldown > 0:
            self.game_state.player.dodge_cooldown -= dt
        
        # Update dodge duration
        if self.game_state.player.is_dodging:
            # Check if dodge should end (simplified for now)
            pass
        
        # Handle player input
        self.handle_player_combat(dt, events)
        
        # Update enemies
        self.update_enemies(dt)
        
        # Check combat end conditions
        self.check_combat_end()
    
    def handle_player_combat(self, dt: float, events: List[pygame.event.Event]):
        """Handle player combat actions."""
        keys = pygame.key.get_pressed()
        
        # Movement (same as exploration but in combat context)
        dx, dy = 0, 0
        if keys[self.settings.KEY_MOVE_UP]:
            dy -= 1
        if keys[self.settings.KEY_MOVE_DOWN]:
            dy += 1
        if keys[self.settings.KEY_MOVE_LEFT]:
            dx -= 1
        if keys[self.settings.KEY_MOVE_RIGHT]:
            dx += 1
        
        # Apply movement
        if dx != 0 or dy != 0:
            # Normalize diagonal
            if dx != 0 and dy != 0:
                dx *= 0.707
                dy *= 0.707
            
            speed = self.game_state.player.speed * dt
            new_x = self.game_state.player.x + dx * speed
            new_y = self.game_state.player.y + dy * speed
            
            # Simple bounds check
            room = self.game_state.rooms[self.game_state.current_room_index]
            if (room.x <= new_x < room.x + room.width and
                room.y <= new_y < room.y + room.height):
                self.game_state.player.x = new_x
                self.game_state.player.y = new_y
        
        # Dodge
        if keys[self.settings.KEY_DODGE]:
            if self.game_state.player.dodge_cooldown <= 0:
                self.perform_dodge()
        
        # Basic attack (click or auto-attack nearest)
        for event in events:
            if event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:  # Left click
                    self.player_attack()
    
    def perform_dodge(self):
        """Execute player dodge."""
        self.game_state.player.is_dodging = True
        self.game_state.player.dodge_cooldown = self.settings.DODGE_COOLDOWN
        print("Player dodged!")
        
        # TODO: Add i-frame timer
    
    def player_attack(self):
        """Player attacks nearest enemy."""
        if not self.game_state.enemies:
            return
        
        # Find nearest enemy
        px = self.game_state.player.x
        py = self.game_state.player.y
        
        nearest_enemy = None
        min_dist = float('inf')
        
        for enemy in self.game_state.enemies:
            dist = math.sqrt((enemy.x - px) ** 2 + (enemy.y - py) ** 2)
            if dist < min_dist and dist < 2.0:  # Attack range of 2 tiles
                min_dist = dist
                nearest_enemy = enemy
        
        if nearest_enemy:
            # Deal damage
            damage = self.game_state.player.damage
            
            # Apply crit
            if random.random() < self.game_state.player.crit_chance:
                damage = int(damage * self.game_state.player.crit_damage)
                print("Critical hit!")
            
            nearest_enemy.hp -= damage
            self.game_state.total_damage_dealt += damage
            print(f"Dealt {damage} damage to {nearest_enemy.enemy_type}")
    
    def update_enemies(self, dt: float):
        """Update enemy AI and attacks."""
        px = self.game_state.player.x
        py = self.game_state.player.y
        
        enemies_to_remove = []
        
        for i, enemy in enumerate(self.game_state.enemies):
            # Check if enemy is dead
            if enemy.hp <= 0:
                enemies_to_remove.append(i)
                self.game_state.enemies_killed += 1
                print(f"{enemy.enemy_type} defeated!")
                continue
            
            # Update attack cooldown
            if self.attack_cooldowns[i] > 0:
                self.attack_cooldowns[i] -= dt
            
            # Calculate distance to player
            dist = math.sqrt((enemy.x - px) ** 2 + (enemy.y - py) ** 2)
            
            if dist > 1.5:  # Move towards player
                # Simple pathfinding
                dx = px - enemy.x
                dy = py - enemy.y
                
                # Normalize
                length = math.sqrt(dx ** 2 + dy ** 2)
                if length > 0:
                    dx /= length
                    dy /= length
                
                # Move enemy
                enemy.x += dx * enemy.speed * dt
                enemy.y += dy * enemy.speed * dt
            
            elif self.attack_cooldowns[i] <= 0:  # In range and can attack
                # Start telegraph
                if self.telegraph_timers[i] == 0:
                    self.telegraph_timers[i] = 0.5  # 0.5 second telegraph
                    print(f"{enemy.enemy_type} is preparing to attack!")
                
                # Update telegraph
                self.telegraph_timers[i] -= dt
                
                # Execute attack
                if self.telegraph_timers[i] <= 0:
                    self.enemy_attack(enemy)
                    self.attack_cooldowns[i] = 2.0  # Reset cooldown
                    self.telegraph_timers[i] = 0
        
        # Remove dead enemies
        for i in reversed(enemies_to_remove):
            del self.game_state.enemies[i]
            del self.telegraph_timers[i]
            del self.attack_cooldowns[i]
    
    def enemy_attack(self, enemy):
        """Enemy attacks player."""
        # Check if player is dodging (i-frames)
        if self.game_state.player.is_dodging:
            print(f"Dodged {enemy.enemy_type}'s attack!")
            return
        
        # Calculate damage
        damage = enemy.damage
        
        # Apply armor
        damage = max(1, damage - self.game_state.player.armor)
        
        # Apply damage
        self.game_state.player.hp -= damage
        self.game_state.total_damage_taken += damage
        print(f"{enemy.enemy_type} dealt {damage} damage!")
        
        # Check player death
        if self.game_state.player.hp <= 0:
            self.combat_complete = True
            self.player_victory = False
            print("Player defeated!")
    
    def check_combat_end(self):
        """Check if combat should end."""
        if not self.game_state.enemies:
            # All enemies defeated
            self.combat_complete = True
            self.player_victory = True
            self.game_state.in_combat = False
            
            # Clear the room
            current_room = self.game_state.rooms[self.game_state.current_room_index]
            current_room.enemies = []
            current_room.cleared = True
            
            # Generate rewards
            self.generate_combat_rewards()
            
            print("Combat victory!")
    
    def generate_combat_rewards(self):
        """Generate rewards for combat victory."""
        # Gold reward
        gold_reward = random.randint(20, 50) * self.game_state.current_floor
        self.game_state.player.gold += gold_reward
        print(f"Gained {gold_reward} gold!")
        
        # Generate upgrade choices
        self.game_state.pending_choices.append({
            "type": "combat_reward",
            "options": [
                {"name": "Damage Up", "effect": "damage", "value": 3},
                {"name": "Health Up", "effect": "max_hp", "value": 20},
                {"name": "Speed Up", "effect": "speed", "value": 0.5}
            ]
        })
    
    def is_complete(self) -> bool:
        """Check if combat is complete."""
        return self.combat_complete
    
    def player_won(self) -> bool:
        """Check if player won the combat."""
        return self.player_victory
    
    def render(self, renderer):
        """Render combat view."""
        renderer.render_combat(self.game_state, self.telegraph_timers)