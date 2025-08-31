"""Main game class implementing the core loop."""

import pygame
from typing import Optional
from enum import Enum, auto

from core.settings import Settings
from core.game_state import GameState
from systems.exploration import ExplorationSystem
from systems.combat import CombatSystem
from systems.choice import ChoiceSystem
from systems.powerup import PowerUpSystem
from systems.risk_reward import RiskRewardSystem
from systems.escalation import EscalationSystem
from systems.economy import EconomySystem
from systems.reset import ResetSystem
from ui.renderer import Renderer
from ui.hud import HUD


class GamePhase(Enum):
    """The 8 phases of the core gameplay loop."""
    EXPLORE = auto()
    FIGHT = auto()
    CHOOSE = auto()
    POWER_UP = auto()
    PUSH_LUCK = auto()
    ESCALATE = auto()
    CASH_OUT = auto()
    RESET = auto()


class Game:
    """Main game class managing the core loop."""
    
    def __init__(self, settings: Settings):
        """Initialize the game with given settings."""
        self.settings = settings
        self.screen = pygame.display.set_mode(
            (settings.SCREEN_WIDTH, settings.SCREEN_HEIGHT)
        )
        pygame.display.set_caption(settings.TITLE)
        self.clock = pygame.time.Clock()
        self.running = True
        
        # Initialize game state
        self.state = GameState(settings)
        self.current_phase = GamePhase.EXPLORE
        
        # Initialize systems
        self.exploration = ExplorationSystem(self.state, settings)
        self.combat = CombatSystem(self.state, settings)
        self.choice = ChoiceSystem(self.state, settings)
        self.powerup = PowerUpSystem(self.state, settings)
        self.risk_reward = RiskRewardSystem(self.state, settings)
        self.escalation = EscalationSystem(self.state, settings)
        self.economy = EconomySystem(self.state, settings)
        self.reset = ResetSystem(self.state, settings)
        
        # Initialize UI
        self.renderer = Renderer(self.screen, settings)
        self.hud = HUD(self.screen, settings)
        
        # Phase management
        self.phase_handlers = {
            GamePhase.EXPLORE: self.handle_explore,
            GamePhase.FIGHT: self.handle_fight,
            GamePhase.CHOOSE: self.handle_choose,
            GamePhase.POWER_UP: self.handle_powerup,
            GamePhase.PUSH_LUCK: self.handle_push_luck,
            GamePhase.ESCALATE: self.handle_escalate,
            GamePhase.CASH_OUT: self.handle_cashout,
            GamePhase.RESET: self.handle_reset,
        }
    
    def run(self):
        """Main game loop."""
        while self.running:
            dt = self.clock.tick(self.settings.FPS) / 1000.0  # Delta time in seconds
            
            # Handle events
            events = pygame.event.get()
            for event in events:
                if event.type == pygame.QUIT:
                    self.running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == self.settings.KEY_PAUSE:
                        self.toggle_pause()
            
            # Update current phase
            if not self.state.paused:
                self.phase_handlers[self.current_phase](dt, events)
            
            # Render
            self.render()
            
            # Update display
            pygame.display.flip()
    
    def handle_explore(self, dt: float, events: list):
        """Handle exploration phase."""
        # Update exploration system
        self.exploration.update(dt, events)
        
        # Check for phase transition
        if self.exploration.should_transition():
            if self.state.enemies_nearby():
                self.transition_to(GamePhase.FIGHT)
            elif self.state.has_pending_choices():
                self.transition_to(GamePhase.CHOOSE)
            elif self.state.shop_available():
                self.transition_to(GamePhase.CASH_OUT)
    
    def handle_fight(self, dt: float, events: list):
        """Handle combat phase."""
        # Update combat system
        self.combat.update(dt, events)
        
        # Check for phase transition
        if self.combat.is_complete():
            if self.combat.player_won():
                # Combat victory leads to rewards
                self.transition_to(GamePhase.CHOOSE)
            else:
                # Player death leads to reset
                self.transition_to(GamePhase.RESET)
    
    def handle_choose(self, dt: float, events: list):
        """Handle choice phase."""
        # Update choice system
        self.choice.update(dt, events)
        
        # Check for phase transition
        if self.choice.choice_made():
            self.transition_to(GamePhase.POWER_UP)
    
    def handle_powerup(self, dt: float, events: list):
        """Handle power-up phase."""
        # Apply power-ups
        self.powerup.update(dt, events)
        
        # Power-ups are instant, move to next phase
        if self.powerup.complete():
            # Check for optional challenges
            if self.risk_reward.has_opportunities():
                self.transition_to(GamePhase.PUSH_LUCK)
            else:
                self.transition_to(GamePhase.EXPLORE)
    
    def handle_push_luck(self, dt: float, events: list):
        """Handle risk/reward phase."""
        # Update risk/reward system
        self.risk_reward.update(dt, events)
        
        # Check for phase transition
        if self.risk_reward.decision_made():
            if self.risk_reward.accepted_challenge():
                # Challenge accepted, prepare for harder content
                self.transition_to(GamePhase.ESCALATE)
            else:
                # Challenge declined, continue exploring
                self.transition_to(GamePhase.EXPLORE)
    
    def handle_escalate(self, dt: float, events: list):
        """Handle escalation phase."""
        # Update escalation system
        self.escalation.update(dt, events)
        
        # Escalation prepares next floor/biome
        if self.escalation.ready():
            self.transition_to(GamePhase.EXPLORE)
    
    def handle_cashout(self, dt: float, events: list):
        """Handle shop/economy phase."""
        # Update economy system
        self.economy.update(dt, events)
        
        # Check for phase transition
        if self.economy.transaction_complete():
            self.transition_to(GamePhase.EXPLORE)
    
    def handle_reset(self, dt: float, events: list):
        """Handle reset phase."""
        # Update reset system
        self.reset.update(dt, events)
        
        # Check for phase transition
        if self.reset.ready_to_restart():
            # Reset game state
            self.state.reset()
            self.transition_to(GamePhase.EXPLORE)
    
    def transition_to(self, phase: GamePhase):
        """Transition to a new game phase."""
        print(f"Transitioning from {self.current_phase.name} to {phase.name}")
        self.current_phase = phase
        
        # Notify systems of phase change
        self.state.current_phase = phase
        
        # Phase-specific initialization
        if phase == GamePhase.EXPLORE:
            self.exploration.enter()
        elif phase == GamePhase.FIGHT:
            self.combat.enter()
        elif phase == GamePhase.CHOOSE:
            self.choice.enter()
        elif phase == GamePhase.POWER_UP:
            self.powerup.enter()
        elif phase == GamePhase.PUSH_LUCK:
            self.risk_reward.enter()
        elif phase == GamePhase.ESCALATE:
            self.escalation.enter()
        elif phase == GamePhase.CASH_OUT:
            self.economy.enter()
        elif phase == GamePhase.RESET:
            self.reset.enter()
    
    def toggle_pause(self):
        """Toggle game pause state."""
        self.state.paused = not self.state.paused
    
    def render(self):
        """Render the game."""
        # Clear screen
        self.screen.fill(self.settings.BLACK)
        
        # Render based on current phase
        if self.current_phase == GamePhase.EXPLORE:
            self.exploration.render(self.renderer)
        elif self.current_phase == GamePhase.FIGHT:
            self.combat.render(self.renderer)
        elif self.current_phase == GamePhase.CHOOSE:
            self.choice.render(self.renderer)
        elif self.current_phase == GamePhase.POWER_UP:
            self.powerup.render(self.renderer)
        elif self.current_phase == GamePhase.PUSH_LUCK:
            self.risk_reward.render(self.renderer)
        elif self.current_phase == GamePhase.ESCALATE:
            self.escalation.render(self.renderer)
        elif self.current_phase == GamePhase.CASH_OUT:
            self.economy.render(self.renderer)
        elif self.current_phase == GamePhase.RESET:
            self.reset.render(self.renderer)
        
        # Render HUD on top
        self.hud.render(self.state)
        
        # Render pause overlay if needed
        if self.state.paused:
            self.render_pause_overlay()
    
    def render_pause_overlay(self):
        """Render pause screen overlay."""
        # Semi-transparent overlay
        overlay = pygame.Surface((self.settings.SCREEN_WIDTH, self.settings.SCREEN_HEIGHT))
        overlay.set_alpha(128)
        overlay.fill(self.settings.BLACK)
        self.screen.blit(overlay, (0, 0))
        
        # Pause text
        font = pygame.font.Font(None, 48)
        text = font.render("PAUSED", True, self.settings.WHITE)
        text_rect = text.get_rect(center=(self.settings.SCREEN_WIDTH // 2, self.settings.SCREEN_HEIGHT // 2))
        self.screen.blit(text, text_rect)