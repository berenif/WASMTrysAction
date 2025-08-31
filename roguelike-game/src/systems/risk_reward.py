"""Risk/Reward system - Phase 5 of the core loop."""

import pygame
import random
from typing import List, Dict

from systems.base import BaseSystem


class RiskRewardSystem(BaseSystem):
    """
    Handles push-your-luck phase:
    - Elite encounters
    - Curse mechanics
    - Timed challenges
    - Optional risks
    """
    
    def __init__(self, game_state, settings):
        """Initialize risk/reward system."""
        super().__init__(game_state, settings)
        self.current_opportunity = None
        self.decision = None
        self.opportunities = []
    
    def enter(self):
        """Enter risk/reward phase."""
        self.active = True
        self.decision = None
        print("Entering PUSH YOUR LUCK phase")
        
        # Generate risk/reward opportunities
        self.generate_opportunities()
        
        if self.opportunities:
            self.current_opportunity = self.opportunities[0]
            print(f"Risk opportunity: {self.current_opportunity['name']}")
    
    def generate_opportunities(self):
        """Generate risk/reward opportunities based on current state."""
        self.opportunities = []
        
        # Elite fight opportunity
        if random.random() < 0.3:  # 30% chance
            self.opportunities.append({
                "name": "Elite Challenge",
                "type": "elite",
                "description": "Fight an elite enemy for better rewards",
                "risk": "Double damage, increased speed",
                "reward": "Guaranteed rare item + 200 gold"
            })
        
        # Curse for power
        if random.random() < 0.2:  # 20% chance
            self.opportunities.append({
                "name": "Devil's Bargain",
                "type": "curse",
                "description": "Accept a curse for immediate power",
                "risk": "Permanent -20% healing",
                "reward": "+10 damage permanently"
            })
        
        # Timed treasure room
        if random.random() < 0.25:  # 25% chance
            self.opportunities.append({
                "name": "Timed Vault",
                "type": "timed",
                "description": "30 seconds to grab treasure",
                "risk": "Take damage if time runs out",
                "reward": "Multiple treasure chests"
            })
        
        # Health gamble
        if self.game_state.player.hp > 50:
            self.opportunities.append({
                "name": "Blood Shrine",
                "type": "health",
                "description": "Sacrifice health for power",
                "risk": "Lose 30 HP",
                "reward": "Random legendary relic"
            })
    
    def update(self, dt: float, events: List[pygame.event.Event]):
        """Update risk/reward logic."""
        if not self.active or self.decision is not None:
            return
        
        for event in events:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_y:  # Accept risk
                    self.accept_risk()
                elif event.key == pygame.K_n:  # Decline risk
                    self.decline_risk()
    
    def accept_risk(self):
        """Player accepts the risk."""
        if not self.current_opportunity:
            return
        
        self.decision = "accepted"
        opp = self.current_opportunity
        print(f"Accepted {opp['name']}!")
        
        # Apply risk effects
        if opp["type"] == "elite":
            # Spawn elite enemy in next room
            self.spawn_elite_encounter()
        
        elif opp["type"] == "curse":
            # Add curse
            self.game_state.player.curses.append("Reduced Healing")
            # Apply immediate reward
            self.game_state.player.damage += 10
        
        elif opp["type"] == "timed":
            # Start timed challenge
            self.start_timed_challenge()
        
        elif opp["type"] == "health":
            # Pay health cost
            self.game_state.player.hp -= 30
            # Grant reward
            self.grant_legendary_relic()
    
    def decline_risk(self):
        """Player declines the risk."""
        self.decision = "declined"
        print("Risk declined, playing it safe.")
    
    def spawn_elite_encounter(self):
        """Create an elite enemy encounter."""
        # Find next uncle room and add elite
        for room in self.game_state.rooms:
            if not room.cleared and room.room_type == "standard":
                if room.enemies:
                    # Upgrade first enemy to elite
                    room.enemies[0].is_elite = True
                    room.enemies[0].hp *= 2
                    room.enemies[0].damage = int(room.enemies[0].damage * 1.5)
                    room.enemies[0].modifiers.append("Elite")
                break
    
    def start_timed_challenge(self):
        """Initialize a timed challenge."""
        # This would trigger a special timed room
        # For now, just give rewards
        self.game_state.player.gold += 150
        print("Completed timed challenge! +150 gold")
    
    def grant_legendary_relic(self):
        """Grant a legendary relic."""
        legendary_relics = [
            "Phoenix Feather (Revive once per run)",
            "Berserker's Rage (+50% damage at low HP)",
            "Time Warp (Slow time when dodging)",
            "Vampire Fangs (Lifesteal 20%)"
        ]
        relic = random.choice(legendary_relics)
        self.game_state.player.relics.append(relic)
        print(f"Gained legendary relic: {relic}")
    
    def has_opportunities(self) -> bool:
        """Check if there are risk/reward opportunities."""
        return len(self.opportunities) > 0
    
    def decision_made(self) -> bool:
        """Check if player made a decision."""
        return self.decision is not None
    
    def accepted_challenge(self) -> bool:
        """Check if player accepted the challenge."""
        return self.decision == "accepted"
    
    def render(self, renderer):
        """Render risk/reward interface."""
        if self.current_opportunity:
            renderer.render_risk_reward(self.current_opportunity)