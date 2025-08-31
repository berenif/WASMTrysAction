"""Power-up system - Phase 4 of the core loop."""

from systems.base import BaseSystem


class PowerUpSystem(BaseSystem):
    """
    Handles power-up phase:
    - Apply immediate stat boosts
    - Grant new abilities
    - Show visual feedback
    - Update build synergies
    """
    
    def __init__(self, game_state, settings):
        """Initialize power-up system."""
        super().__init__(game_state, settings)
        self.application_complete = False
    
    def enter(self):
        """Enter power-up phase."""
        self.active = True
        self.application_complete = False
        print("Entering POWER-UP phase")
        
        # Apply the selected choice
        if self.game_state.selected_choice:
            self.apply_powerup(self.game_state.selected_choice)
            self.game_state.selected_choice = None
    
    def apply_powerup(self, choice):
        """Apply the selected power-up."""
        effect = choice.get("effect")
        value = choice.get("value")
        name = choice.get("name", "Unknown")
        
        print(f"Applying power-up: {name}")
        
        # Apply different effect types
        if effect == "damage":
            self.game_state.player.damage += value
            print(f"Damage increased by {value}")
        
        elif effect == "max_hp":
            self.game_state.player.max_hp += value
            self.game_state.player.hp += value  # Also heal
            print(f"Max HP increased by {value}")
        
        elif effect == "speed":
            self.game_state.player.speed += value
            print(f"Speed increased by {value}")
        
        elif effect == "armor":
            self.game_state.player.armor += value
            print(f"Armor increased by {value}")
        
        elif effect == "crit_chance":
            self.game_state.player.crit_chance += value
            print(f"Crit chance increased by {value * 100}%")
        
        elif effect == "heal":
            heal_amount = min(value, self.game_state.player.max_hp - self.game_state.player.hp)
            self.game_state.player.hp += heal_amount
            print(f"Healed for {heal_amount} HP")
        
        elif effect == "gold":
            self.game_state.player.gold += value
            print(f"Gained {value} gold")
        
        elif effect == "ability":
            # Add new ability
            self.game_state.player.abilities.append(name)
            print(f"Gained ability: {name}")
        
        elif effect == "relic":
            # Add relic
            self.game_state.player.relics.append(name)
            print(f"Gained relic: {name}")
        
        elif effect == "random":
            # Random effect
            import random
            random_effects = ["damage", "max_hp", "speed", "gold"]
            random_effect = random.choice(random_effects)
            random_value = random.randint(5, 20)
            self.apply_powerup({"effect": random_effect, "value": random_value, "name": "Random Bonus"})
        
        # Mark as complete
        self.application_complete = True
    
    def update(self, dt: float, events):
        """Update power-up logic."""
        # Power-ups are instant, so this is mostly for animation/feedback
        pass
    
    def complete(self) -> bool:
        """Check if power-up application is complete."""
        return self.application_complete
    
    def render(self, renderer):
        """Render power-up feedback."""
        renderer.render_powerup_feedback(self.game_state)