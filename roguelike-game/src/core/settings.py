"""Game settings and configuration."""

import pygame
from dataclasses import dataclass
from typing import Tuple


@dataclass
class Settings:
    """Central configuration for the game."""
    
    # Display settings
    SCREEN_WIDTH: int = 1280
    SCREEN_HEIGHT: int = 720
    FPS: int = 60
    TITLE: str = "Roguelike - Core Loop"
    
    # Colors (RGB)
    BLACK: Tuple[int, int, int] = (0, 0, 0)
    WHITE: Tuple[int, int, int] = (255, 255, 255)
    RED: Tuple[int, int, int] = (255, 0, 0)
    GREEN: Tuple[int, int, int] = (0, 255, 0)
    BLUE: Tuple[int, int, int] = (0, 0, 255)
    GRAY: Tuple[int, int, int] = (128, 128, 128)
    DARK_GRAY: Tuple[int, int, int] = (64, 64, 64)
    
    # Gameplay settings
    TILE_SIZE: int = 32
    PLAYER_SPEED: float = 4.0  # tiles per second
    DODGE_COOLDOWN: float = 2.0  # seconds
    DODGE_DURATION: float = 0.5  # seconds (i-frames)
    
    # Combat settings
    PLAYER_BASE_HP: int = 100
    PLAYER_BASE_DAMAGE: int = 10
    STAMINA_MAX: int = 100
    STAMINA_REGEN: float = 20.0  # per second
    
    # Exploration settings
    VISION_RANGE: int = 5  # tiles
    FOG_ALPHA: int = 128  # transparency for fog of war
    
    # Economy settings
    STARTING_GOLD: int = 50
    STARTING_SOULS: int = 0
    STARTING_KEYS: int = 1
    
    # Room generation
    MIN_ROOM_SIZE: int = 5
    MAX_ROOM_SIZE: int = 9
    ROOMS_PER_FLOOR: int = 10
    
    # Difficulty scaling
    HP_SCALE_PER_FLOOR: float = 1.15
    DAMAGE_SCALE_PER_FLOOR: float = 1.10
    ENEMY_DENSITY_INCREASE: float = 0.1
    
    # UI settings
    UI_PANEL_HEIGHT: int = 150
    UI_FONT_SIZE: int = 16
    UI_FONT_NAME: str = "Arial"
    
    # Input settings
    KEY_MOVE_UP: int = pygame.K_w
    KEY_MOVE_DOWN: int = pygame.K_s
    KEY_MOVE_LEFT: int = pygame.K_a
    KEY_MOVE_RIGHT: int = pygame.K_d
    KEY_DODGE: int = pygame.K_SPACE
    KEY_INTERACT: int = pygame.K_e
    KEY_INVENTORY: int = pygame.K_TAB
    KEY_PAUSE: int = pygame.K_ESCAPE
    
    # Meta progression
    SAVE_FILE: str = "savegame.dat"
    MAX_SAVE_SLOTS: int = 3
    
    def get_grid_size(self) -> Tuple[int, int]:
        """Calculate grid dimensions based on screen and tile size."""
        cols = self.SCREEN_WIDTH // self.TILE_SIZE
        rows = (self.SCREEN_HEIGHT - self.UI_PANEL_HEIGHT) // self.TILE_SIZE
        return cols, rows