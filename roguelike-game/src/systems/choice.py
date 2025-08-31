"""Choice system - Phase 3 of the core loop."""

import pygame
from typing import List, Dict

from systems.base import BaseSystem


class ChoiceSystem(BaseSystem):
    """
    Handles choice phase:
    - Present 3 options
    - Show tradeoffs
    - Preview synergies
    - Apply selection
    """
    
    def __init__(self, game_state, settings):
        """Initialize choice system."""
        super().__init__(game_state, settings)
        self.current_choices = []
        self.selected_index = 0
        self.choice_confirmed = False
    
    def enter(self):
        """Enter choice phase."""
        self.active = True
        self.choice_confirmed = False
        self.selected_index = 0
        print("Entering CHOICE phase")
        
        # Get pending choices
        if self.game_state.pending_choices:
            choice_data = self.game_state.pending_choices.pop(0)
            self.current_choices = choice_data.get("options", [])
            print(f"Presenting {len(self.current_choices)} choices")
    
    def update(self, dt: float, events: List[pygame.event.Event]):
        """Update choice logic."""
        if not self.active or self.choice_confirmed:
            return
        
        for event in events:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_UP:
                    self.selected_index = max(0, self.selected_index - 1)
                elif event.key == pygame.K_DOWN:
                    self.selected_index = min(len(self.current_choices) - 1, self.selected_index + 1)
                elif event.key == pygame.K_RETURN or event.key == pygame.K_SPACE:
                    self.confirm_choice()
                elif event.key >= pygame.K_1 and event.key <= pygame.K_3:
                    # Quick select with number keys
                    index = event.key - pygame.K_1
                    if index < len(self.current_choices):
                        self.selected_index = index
                        self.confirm_choice()
    
    def confirm_choice(self):
        """Confirm the selected choice."""
        if self.selected_index < len(self.current_choices):
            choice = self.current_choices[self.selected_index]
            self.game_state.selected_choice = choice
            self.choice_confirmed = True
            print(f"Selected: {choice.get('name', 'Unknown')}")
    
    def choice_made(self) -> bool:
        """Check if a choice has been made."""
        return self.choice_confirmed
    
    def render(self, renderer):
        """Render choice interface."""
        renderer.render_choices(self.current_choices, self.selected_index)