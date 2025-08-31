"""Exploration system - Phase 1 of the core loop."""

import pygame
from typing import List
import math

from systems.base import BaseSystem


class ExplorationSystem(BaseSystem):
    """
    Handles exploration phase:
    - Movement through rooms
    - Fog of war
    - Discovery events
    - Landmark navigation
    """
    
    def __init__(self, game_state, settings):
        """Initialize exploration system."""
        super().__init__(game_state, settings)
        self.movement_keys = {
            settings.KEY_MOVE_UP: (0, -1),
            settings.KEY_MOVE_DOWN: (0, 1),
            settings.KEY_MOVE_LEFT: (-1, 0),
            settings.KEY_MOVE_RIGHT: (1, 0)
        }
        self.transition_ready = False
    
    def enter(self):
        """Enter exploration phase."""
        self.active = True
        self.transition_ready = False
        print("Entering EXPLORATION phase")
        
        # Update fog of war around player
        self.update_fog_of_war()
    
    def update(self, dt: float, events: List[pygame.event.Event]):
        """Update exploration logic."""
        if not self.active:
            return
        
        # Handle player movement
        keys = pygame.key.get_pressed()
        dx, dy = 0, 0
        
        for key, (mx, my) in self.movement_keys.items():
            if keys[key]:
                dx += mx
                dy += my
        
        # Normalize diagonal movement
        if dx != 0 and dy != 0:
            dx *= 0.707
            dy *= 0.707
        
        # Apply movement
        if dx != 0 or dy != 0:
            speed = self.game_state.player.speed * dt
            new_x = self.game_state.player.x + dx * speed
            new_y = self.game_state.player.y + dy * speed
            
            # Check bounds and collisions
            if self.is_valid_position(new_x, new_y):
                self.game_state.player.x = new_x
                self.game_state.player.y = new_y
                self.update_fog_of_war()
                self.check_room_transition()
        
        # Handle interaction
        for event in events:
            if event.type == pygame.KEYDOWN:
                if event.key == self.settings.KEY_INTERACT:
                    self.interact()
    
    def is_valid_position(self, x: float, y: float) -> bool:
        """Check if position is valid for movement."""
        # Get current room
        if self.game_state.current_room_index >= len(self.game_state.rooms):
            return False
        
        room = self.game_state.rooms[self.game_state.current_room_index]
        
        # Check room bounds
        if x < room.x or x >= room.x + room.width:
            return False
        if y < room.y or y >= room.y + room.height:
            return False
        
        # Check for enemy collisions (can't walk through enemies)
        for enemy in room.enemies:
            if abs(x - enemy.x) < 0.5 and abs(y - enemy.y) < 0.5:
                return False
        
        return True
    
    def update_fog_of_war(self):
        """Update fog of war based on player position."""
        px = int(self.game_state.player.x)
        py = int(self.game_state.player.y)
        vision_range = self.settings.VISION_RANGE
        
        # Reveal tiles within vision range
        for x in range(px - vision_range, px + vision_range + 1):
            for y in range(py - vision_range, py + vision_range + 1):
                # Calculate distance
                dist = math.sqrt((x - px) ** 2 + (y - py) ** 2)
                if dist <= vision_range:
                    self.game_state.fog_of_war[(x, y)] = True
    
    def check_room_transition(self):
        """Check if player has moved to a new room."""
        px = int(self.game_state.player.x)
        py = int(self.game_state.player.y)
        
        # Find which room the player is in
        for i, room in enumerate(self.game_state.rooms):
            if (room.x <= px < room.x + room.width and 
                room.y <= py < room.y + room.height):
                if i != self.game_state.current_room_index:
                    # Moved to a new room
                    self.game_state.current_room_index = i
                    if not room.discovered:
                        room.discovered = True
                        self.game_state.rooms_explored += 1
                        print(f"Discovered {room.room_type} room!")
                        
                        # Trigger discovery event
                        self.trigger_discovery_event(room)
                    
                    # Check for enemies
                    if room.enemies:
                        self.transition_ready = True
                break
    
    def trigger_discovery_event(self, room):
        """Trigger special events when discovering a room."""
        if room.room_type == "treasure":
            # Add treasure choices
            self.game_state.pending_choices.append({
                "type": "treasure",
                "options": [
                    {"name": "Gold Cache", "effect": "gold", "value": 100},
                    {"name": "Health Potion", "effect": "heal", "value": 50},
                    {"name": "Mystery Box", "effect": "random", "value": 1}
                ]
            })
        elif room.room_type == "shop":
            # Populate shop
            self.populate_shop()
    
    def populate_shop(self):
        """Create shop inventory."""
        self.game_state.shop_items = [
            {"name": "Sword Upgrade", "cost": 50, "effect": "damage", "value": 5},
            {"name": "Armor Piece", "cost": 75, "effect": "armor", "value": 10},
            {"name": "Speed Boots", "cost": 100, "effect": "speed", "value": 0.5},
            {"name": "Health Elixir", "cost": 30, "effect": "heal", "value": 30}
        ]
    
    def interact(self):
        """Handle interaction with environment."""
        # Check for nearby interactables
        current_room = self.game_state.rooms[self.game_state.current_room_index]
        
        if current_room.room_type == "shop" and not current_room.cleared:
            self.transition_ready = True
        elif current_room.items:
            # Pick up items
            item = current_room.items.pop(0)
            print(f"Picked up {item.get('name', 'item')}!")
            self.game_state.items_collected += 1
    
    def should_transition(self) -> bool:
        """Check if ready to transition to next phase."""
        return self.transition_ready
    
    def render(self, renderer):
        """Render exploration view."""
        # Render current room and fog of war
        renderer.render_exploration(self.game_state)