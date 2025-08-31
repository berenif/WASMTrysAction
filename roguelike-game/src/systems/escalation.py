"""Escalation system - Phase 6 of the core loop."""

import random
from systems.base import BaseSystem
from core.game_state import Biome


class EscalationSystem(BaseSystem):
    """
    Handles escalation phase:
    - Biome transitions
    - Difficulty scaling
    - New enemy types
    - Environmental hazards
    """
    
    def __init__(self, game_state, settings):
        """Initialize escalation system."""
        super().__init__(game_state, settings)
        self.escalation_ready = False
    
    def enter(self):
        """Enter escalation phase."""
        self.active = True
        self.escalation_ready = False
        print("Entering ESCALATION phase")
        
        # Check for floor/biome progression
        self.check_progression()
    
    def check_progression(self):
        """Check and apply progression changes."""
        # Check if all rooms cleared (boss defeated)
        all_cleared = all(room.cleared for room in self.game_state.rooms 
                         if room.room_type != "shop")
        
        if all_cleared:
            # Progress to next floor
            self.advance_floor()
        else:
            # Just apply minor escalation
            self.apply_minor_escalation()
        
        self.escalation_ready = True
    
    def advance_floor(self):
        """Advance to the next floor."""
        self.game_state.current_floor += 1
        print(f"Advancing to floor {self.game_state.current_floor}")
        
        # Check for biome change (every 3 floors)
        if self.game_state.current_floor % 3 == 1 and self.game_state.current_floor > 1:
            self.change_biome()
        
        # Generate new floor
        self.game_state.generate_floor()
        
        # Apply difficulty scaling
        self.apply_difficulty_scaling()
    
    def change_biome(self):
        """Transition to a new biome."""
        biome_progression = [
            Biome.DUNGEON,
            Biome.CAVERNS,
            Biome.FACTORY,
            Biome.TEMPLE,
            Biome.VOID
        ]
        
        current_index = biome_progression.index(self.game_state.current_biome)
        if current_index < len(biome_progression) - 1:
            self.game_state.current_biome = biome_progression[current_index + 1]
            print(f"Entered {self.game_state.current_biome.name} biome!")
            
            # Apply biome-specific modifiers
            self.apply_biome_modifiers()
    
    def apply_biome_modifiers(self):
        """Apply biome-specific gameplay modifiers."""
        biome = self.game_state.current_biome
        
        if biome == Biome.CAVERNS:
            # Reduced vision in caverns
            print("Vision reduced in the dark caverns...")
            # Would modify vision range here
        
        elif biome == Biome.FACTORY:
            # Environmental hazards
            print("Watch out for machinery hazards!")
            # Would add hazard tiles
        
        elif biome == Biome.TEMPLE:
            # Magic-heavy enemies
            print("Ancient magic fills the air...")
            # Would modify enemy types
        
        elif biome == Biome.VOID:
            # All mechanics combined
            print("Reality itself becomes unstable...")
            # Maximum difficulty
    
    def apply_difficulty_scaling(self):
        """Apply floor-based difficulty scaling."""
        floor = self.game_state.current_floor
        
        # Increase shop prices
        self.game_state.price_modifier = 1.0 + (floor - 1) * 0.15
        
        print(f"Difficulty increased for floor {floor}")
        print(f"Enemy HP multiplier: {self.settings.HP_SCALE_PER_FLOOR ** (floor - 1):.1f}x")
        print(f"Enemy damage multiplier: {self.settings.DAMAGE_SCALE_PER_FLOOR ** (floor - 1):.1f}x")
    
    def apply_minor_escalation(self):
        """Apply minor escalation within current floor."""
        # Add modifiers to remaining enemies
        for room in self.game_state.rooms:
            if not room.cleared and room.enemies:
                # Small chance to add modifiers
                for enemy in room.enemies:
                    if random.random() < 0.1:  # 10% chance
                        modifier = random.choice(["Fast", "Tough", "Regenerating"])
                        if modifier not in enemy.modifiers:
                            enemy.modifiers.append(modifier)
                            
                            # Apply modifier effects
                            if modifier == "Fast":
                                enemy.speed *= 1.3
                            elif modifier == "Tough":
                                enemy.hp = int(enemy.hp * 1.2)
                                enemy.max_hp = int(enemy.max_hp * 1.2)
                            # Regenerating would be handled in combat
    
    def update(self, dt: float, events):
        """Update escalation logic."""
        # Escalation is mostly instant
        pass
    
    def ready(self) -> bool:
        """Check if escalation is complete."""
        return self.escalation_ready
    
    def render(self, renderer):
        """Render escalation feedback."""
        renderer.render_escalation_info(self.game_state)