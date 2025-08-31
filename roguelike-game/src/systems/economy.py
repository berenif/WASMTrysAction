"""Economy system - Phase 7 of the core loop."""

import pygame
from typing import List

from systems.base import BaseSystem


class EconomySystem(BaseSystem):
    """
    Handles cash-out phase:
    - Shop interface
    - Currency management  
    - Item purchases
    - Upgrade costs
    """
    
    def __init__(self, game_state, settings):
        """Initialize economy system."""
        super().__init__(game_state, settings)
        self.selected_item_index = 0
        self.transaction_done = False
    
    def enter(self):
        """Enter economy/shop phase."""
        self.active = True
        self.transaction_done = False
        self.selected_item_index = 0
        print("Entering CASH-OUT phase")
        
        # Ensure shop has items
        if not self.game_state.shop_items:
            self.generate_shop_items()
    
    def generate_shop_items(self):
        """Generate shop inventory."""
        import random
        
        base_items = [
            {"name": "Health Potion", "cost": 30, "effect": "heal", "value": 50},
            {"name": "Damage Boost", "cost": 75, "effect": "damage", "value": 5},
            {"name": "Armor Piece", "cost": 100, "effect": "armor", "value": 5},
            {"name": "Speed Boots", "cost": 120, "effect": "speed", "value": 0.5},
            {"name": "Lucky Charm", "cost": 150, "effect": "crit_chance", "value": 0.1},
            {"name": "Remove Curse", "cost": 200, "effect": "remove_curse", "value": 1},
            {"name": "Mystery Box", "cost": 50, "effect": "random", "value": 1},
            {"name": "Extra Key", "cost": 80, "effect": "key", "value": 1}
        ]
        
        # Select 4-6 random items
        num_items = random.randint(4, 6)
        self.game_state.shop_items = random.sample(base_items, min(num_items, len(base_items)))
        
        # Apply price modifier based on floor
        for item in self.game_state.shop_items:
            item["cost"] = int(item["cost"] * self.game_state.price_modifier)
    
    def update(self, dt: float, events: List[pygame.event.Event]):
        """Update shop logic."""
        if not self.active or self.transaction_done:
            return
        
        for event in events:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_UP:
                    self.selected_item_index = max(0, self.selected_item_index - 1)
                
                elif event.key == pygame.K_DOWN:
                    max_index = len(self.game_state.shop_items) - 1
                    self.selected_item_index = min(max_index, self.selected_item_index + 1)
                
                elif event.key == pygame.K_RETURN or event.key == pygame.K_SPACE:
                    self.purchase_item()
                
                elif event.key == pygame.K_ESCAPE:
                    # Leave shop
                    self.transaction_done = True
                    print("Left the shop")
    
    def purchase_item(self):
        """Attempt to purchase selected item."""
        if self.selected_item_index >= len(self.game_state.shop_items):
            return
        
        item = self.game_state.shop_items[self.selected_item_index]
        cost = item["cost"]
        
        # Check if player can afford it
        if self.game_state.player.gold >= cost:
            # Deduct cost
            self.game_state.player.gold -= cost
            
            # Apply item effect
            self.apply_item_effect(item)
            
            # Remove item from shop
            self.game_state.shop_items.pop(self.selected_item_index)
            
            print(f"Purchased {item['name']} for {cost} gold")
            
            # Adjust selection index if needed
            if self.selected_item_index >= len(self.game_state.shop_items):
                self.selected_item_index = max(0, len(self.game_state.shop_items) - 1)
            
            # Check if shop is empty
            if not self.game_state.shop_items:
                self.transaction_done = True
                print("Shop sold out!")
        else:
            print(f"Not enough gold! Need {cost}, have {self.game_state.player.gold}")
    
    def apply_item_effect(self, item):
        """Apply purchased item's effect."""
        effect = item["effect"]
        value = item["value"]
        
        if effect == "heal":
            heal_amount = min(value, self.game_state.player.max_hp - self.game_state.player.hp)
            self.game_state.player.hp += heal_amount
            print(f"Healed {heal_amount} HP")
        
        elif effect == "damage":
            self.game_state.player.damage += value
            print(f"Damage increased by {value}")
        
        elif effect == "armor":
            self.game_state.player.armor += value
            print(f"Armor increased by {value}")
        
        elif effect == "speed":
            self.game_state.player.speed += value
            print(f"Speed increased by {value}")
        
        elif effect == "crit_chance":
            self.game_state.player.crit_chance += value
            print(f"Crit chance increased by {value * 100}%")
        
        elif effect == "remove_curse":
            if self.game_state.player.curses:
                removed = self.game_state.player.curses.pop()
                print(f"Removed curse: {removed}")
            else:
                print("No curses to remove!")
        
        elif effect == "key":
            self.game_state.player.keys += value
            print(f"Gained {value} key(s)")
        
        elif effect == "random":
            # Random positive effect
            import random
            random_effects = [
                ("heal", 30),
                ("damage", 3),
                ("armor", 3),
                ("gold", 50)
            ]
            rand_effect, rand_value = random.choice(random_effects)
            self.apply_item_effect({"effect": rand_effect, "value": rand_value})
        
        elif effect == "gold":
            self.game_state.player.gold += value
            print(f"Gained {value} gold")
    
    def transaction_complete(self) -> bool:
        """Check if shopping is done."""
        return self.transaction_done
    
    def render(self, renderer):
        """Render shop interface."""
        renderer.render_shop(self.game_state, self.selected_item_index)