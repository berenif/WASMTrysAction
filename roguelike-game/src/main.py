#!/usr/bin/env python3
"""
Roguelike Game - Main Entry Point
Implements the 8-phase core gameplay loop
"""

import pygame
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from core.game import Game
from core.settings import Settings


def main():
    """Main entry point for the game."""
    pygame.init()
    
    # Load settings
    settings = Settings()
    
    # Create and run game
    game = Game(settings)
    game.run()
    
    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()