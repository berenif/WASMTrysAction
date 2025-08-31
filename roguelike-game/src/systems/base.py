"""Base system class for all game systems."""

from abc import ABC, abstractmethod
from typing import List
import pygame


class BaseSystem(ABC):
    """Abstract base class for game systems."""
    
    def __init__(self, game_state, settings):
        """Initialize the system."""
        self.game_state = game_state
        self.settings = settings
        self.active = False
    
    @abstractmethod
    def enter(self):
        """Called when entering this system's phase."""
        pass
    
    @abstractmethod
    def update(self, dt: float, events: List[pygame.event.Event]):
        """Update the system."""
        pass
    
    @abstractmethod
    def render(self, renderer):
        """Render the system."""
        pass
    
    def exit(self):
        """Called when exiting this system's phase."""
        self.active = False