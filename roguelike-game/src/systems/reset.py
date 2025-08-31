"""Reset system - Phase 8 of the core loop."""

import pygame
from typing import List

from systems.base import BaseSystem


class ResetSystem(BaseSystem):
    """
    Handles reset phase:
    - Death screen
    - Run statistics
    - Meta progression
    - Quick restart
    """
    
    def __init__(self, game_state, settings):
        """Initialize reset system."""
        super().__init__(game_state, settings)
        self.restart_ready = False
        self.stats_displayed = False
    
    def enter(self):
        """Enter reset phase."""
        self.active = True
        self.restart_ready = False
        self.stats_displayed = False
        print("Entering RESET phase")
        
        # Calculate and display run statistics
        self.calculate_run_stats()
        
        # Apply meta progression
        self.apply_meta_progression()
    
    def calculate_run_stats(self):
        """Calculate final run statistics."""
        stats = {
            "Floor Reached": self.game_state.current_floor,
            "Enemies Killed": self.game_state.enemies_killed,
            "Rooms Explored": self.game_state.rooms_explored,
            "Items Collected": self.game_state.items_collected,
            "Total Damage Dealt": self.game_state.total_damage_dealt,
            "Total Damage Taken": self.game_state.total_damage_taken,
            "Gold Earned": self.game_state.player.gold,
            "Relics Found": len(self.game_state.player.relics),
            "Abilities Gained": len(self.game_state.player.abilities)
        }
        
        print("\n=== RUN COMPLETE ===")
        for stat, value in stats.items():
            print(f"{stat}: {value}")
        print("==================\n")
        
        self.stats_displayed = True
        return stats
    
    def apply_meta_progression(self):
        """Apply permanent unlocks and progression."""
        # Calculate souls earned
        souls_earned = self.game_state.current_floor * 10
        souls_earned += self.game_state.enemies_killed
        
        # Bonus souls for reaching milestones
        if self.game_state.current_floor >= 5:
            souls_earned += 50
        if self.game_state.current_floor >= 10:
            souls_earned += 100
        
        print(f"Earned {souls_earned} souls for meta progression")
        
        # In a full implementation, these would be saved
        # and used to unlock new characters, items, etc.
    
    def update(self, dt: float, events: List[pygame.event.Event]):
        """Update reset logic."""
        if not self.active:
            return
        
        # Wait for player input to restart
        for event in events:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r:  # R to restart
                    self.restart_ready = True
                    print("Restarting run...")
                elif event.key == pygame.K_q:  # Q to quit
                    pygame.quit()
                    import sys
                    sys.exit()
    
    def ready_to_restart(self) -> bool:
        """Check if ready to start a new run."""
        return self.restart_ready
    
    def render(self, renderer):
        """Render death/victory screen."""
        renderer.render_reset_screen(self.game_state, self.stats_displayed)