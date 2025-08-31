#!/usr/bin/env python3
"""Test script to verify game systems are working."""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")
    
    try:
        # Core imports
        from core.settings import Settings
        from core.game_state import GameState, Player, Enemy, Room, Biome
        from core.game import Game, GamePhase
        print("✓ Core modules imported successfully")
        
        # System imports
        from systems.base import BaseSystem
        from systems.exploration import ExplorationSystem
        from systems.combat import CombatSystem
        from systems.choice import ChoiceSystem
        from systems.powerup import PowerUpSystem
        from systems.risk_reward import RiskRewardSystem
        from systems.escalation import EscalationSystem
        from systems.economy import EconomySystem
        from systems.reset import ResetSystem
        print("✓ All system modules imported successfully")
        
        # UI imports
        from ui.renderer import Renderer
        from ui.hud import HUD
        print("✓ UI modules imported successfully")
        
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

def test_game_state():
    """Test game state initialization."""
    print("\nTesting game state...")
    
    try:
        from core.settings import Settings
        from core.game_state import GameState
        
        settings = Settings()
        state = GameState(settings)
        
        # Check initial state
        assert state.current_floor == 1
        assert state.player.hp == settings.PLAYER_BASE_HP
        assert len(state.rooms) == settings.ROOMS_PER_FLOOR
        print("✓ Game state initialized correctly")
        
        # Test room generation
        assert state.rooms[0].room_type == "start"
        print("✓ Rooms generated correctly")
        
        # Test player positioning
        assert state.player.x >= 0
        assert state.player.y >= 0
        print("✓ Player positioned correctly")
        
        return True
    except Exception as e:
        print(f"✗ Game state error: {e}")
        return False

def test_phase_transitions():
    """Test game phase transitions."""
    print("\nTesting phase transitions...")
    
    try:
        from core.game import GamePhase
        
        # Test all phases exist
        phases = [
            GamePhase.EXPLORE,
            GamePhase.FIGHT,
            GamePhase.CHOOSE,
            GamePhase.POWER_UP,
            GamePhase.PUSH_LUCK,
            GamePhase.ESCALATE,
            GamePhase.CASH_OUT,
            GamePhase.RESET
        ]
        
        assert len(phases) == 8
        print(f"✓ All {len(phases)} game phases defined")
        
        return True
    except Exception as e:
        print(f"✗ Phase error: {e}")
        return False

def main():
    """Run all tests."""
    print("=" * 50)
    print("Roguelike Game System Tests")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_game_state,
        test_phase_transitions
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\n" + "=" * 50)
    if all(results):
        print("✓ All tests passed!")
        print("\nThe game structure is ready. You can run the game with:")
        print("  python src/main.py")
        print("\nNote: The game requires pygame to be installed.")
        print("Install with: pip install -r requirements.txt")
    else:
        print("✗ Some tests failed. Please check the errors above.")
    print("=" * 50)

if __name__ == "__main__":
    main()