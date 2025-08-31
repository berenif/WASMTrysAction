"""HUD (Heads-Up Display) for the game."""

import pygame


class HUD:
    """Manages the game's HUD elements."""
    
    def __init__(self, screen: pygame.Surface, settings):
        """Initialize HUD."""
        self.screen = screen
        self.settings = settings
        self.font = pygame.font.Font(None, settings.UI_FONT_SIZE)
        self.small_font = pygame.font.Font(None, settings.UI_FONT_SIZE - 4)
    
    def render(self, game_state):
        """Render all HUD elements."""
        # HUD background panel
        hud_rect = pygame.Rect(
            0, 
            self.settings.SCREEN_HEIGHT - self.settings.UI_PANEL_HEIGHT,
            self.settings.SCREEN_WIDTH,
            self.settings.UI_PANEL_HEIGHT
        )
        pygame.draw.rect(self.screen, self.settings.DARK_GRAY, hud_rect)
        pygame.draw.rect(self.screen, self.settings.WHITE, hud_rect, 2)
        
        # Player stats
        self.draw_player_stats(game_state.player, hud_rect)
        
        # Currencies
        self.draw_currencies(game_state.player, hud_rect)
        
        # Floor info
        self.draw_floor_info(game_state, hud_rect)
        
        # Abilities and relics
        self.draw_abilities_relics(game_state.player, hud_rect)
        
        # Current phase indicator
        if game_state.current_phase:
            self.draw_phase_indicator(game_state.current_phase, hud_rect)
    
    def draw_player_stats(self, player, hud_rect):
        """Draw player statistics."""
        x = hud_rect.x + 20
        y = hud_rect.y + 10
        
        # HP
        hp_text = f"HP: {player.hp}/{player.max_hp}"
        hp_color = self.settings.GREEN if player.hp > player.max_hp * 0.5 else self.settings.RED
        self.draw_text(hp_text, x, y, hp_color)
        
        # Stamina
        stamina_text = f"Stamina: {player.stamina}/{player.max_stamina}"
        self.draw_text(stamina_text, x, y + 25, self.settings.BLUE)
        
        # Combat stats
        damage_text = f"DMG: {player.damage}"
        self.draw_text(damage_text, x, y + 50, self.settings.WHITE)
        
        armor_text = f"ARM: {player.armor}"
        self.draw_text(armor_text, x + 80, y + 50, self.settings.WHITE)
        
        speed_text = f"SPD: {player.speed:.1f}"
        self.draw_text(speed_text, x + 160, y + 50, self.settings.WHITE)
        
        # Crit chance
        crit_text = f"Crit: {player.crit_chance * 100:.0f}%"
        self.draw_text(crit_text, x, y + 75, self.settings.WHITE)
        
        # Dodge cooldown
        if player.dodge_cooldown > 0:
            dodge_text = f"Dodge: {player.dodge_cooldown:.1f}s"
            self.draw_text(dodge_text, x + 100, y + 75, self.settings.GRAY)
        else:
            dodge_text = "Dodge: Ready"
            self.draw_text(dodge_text, x + 100, y + 75, self.settings.GREEN)
    
    def draw_currencies(self, player, hud_rect):
        """Draw player currencies."""
        x = hud_rect.x + 300
        y = hud_rect.y + 10
        
        # Gold
        gold_text = f"Gold: {player.gold}"
        self.draw_text(gold_text, x, y, (255, 215, 0))  # Gold color
        
        # Souls
        souls_text = f"Souls: {player.souls}"
        self.draw_text(souls_text, x, y + 25, (128, 0, 255))  # Purple
        
        # Keys
        keys_text = f"Keys: {player.keys}"
        self.draw_text(keys_text, x, y + 50, self.settings.WHITE)
    
    def draw_floor_info(self, game_state, hud_rect):
        """Draw current floor information."""
        x = hud_rect.x + 500
        y = hud_rect.y + 10
        
        # Floor number
        floor_text = f"Floor {game_state.current_floor}"
        self.draw_text(floor_text, x, y, self.settings.WHITE)
        
        # Biome
        biome_text = f"Biome: {game_state.current_biome.name}"
        self.draw_text(biome_text, x, y + 25, self.settings.WHITE)
        
        # Room progress
        rooms_cleared = sum(1 for r in game_state.rooms if r.cleared)
        total_rooms = len(game_state.rooms)
        progress_text = f"Rooms: {rooms_cleared}/{total_rooms}"
        self.draw_text(progress_text, x, y + 50, self.settings.WHITE)
    
    def draw_abilities_relics(self, player, hud_rect):
        """Draw player abilities and relics."""
        x = hud_rect.x + 700
        y = hud_rect.y + 10
        
        # Abilities
        if player.abilities:
            self.draw_text("Abilities:", x, y, self.settings.WHITE)
            for i, ability in enumerate(player.abilities[:3]):  # Show first 3
                self.draw_small_text(f"- {ability}", x + 10, y + 20 + i * 15, self.settings.GRAY)
        
        # Relics
        if player.relics:
            relic_y = y + 70
            self.draw_text("Relics:", x, relic_y, self.settings.WHITE)
            for i, relic in enumerate(player.relics[:2]):  # Show first 2
                # Truncate long relic names
                if len(relic) > 20:
                    relic = relic[:17] + "..."
                self.draw_small_text(f"- {relic}", x + 10, relic_y + 20 + i * 15, self.settings.GRAY)
        
        # Curses
        if player.curses:
            curse_x = x + 200
            self.draw_text("Curses:", curse_x, y, self.settings.RED)
            for i, curse in enumerate(player.curses[:2]):
                self.draw_small_text(f"- {curse}", curse_x + 10, y + 20 + i * 15, self.settings.RED)
    
    def draw_phase_indicator(self, phase, hud_rect):
        """Draw current game phase."""
        x = hud_rect.right - 200
        y = hud_rect.y + 10
        
        phase_text = f"Phase: {phase.name}"
        
        # Color based on phase
        phase_colors = {
            "EXPLORE": self.settings.GREEN,
            "FIGHT": self.settings.RED,
            "CHOOSE": self.settings.BLUE,
            "POWER_UP": (255, 215, 0),  # Gold
            "PUSH_LUCK": (255, 128, 0),  # Orange
            "ESCALATE": (128, 0, 255),  # Purple
            "CASH_OUT": self.settings.GREEN,
            "RESET": self.settings.GRAY
        }
        
        color = phase_colors.get(phase.name, self.settings.WHITE)
        self.draw_text(phase_text, x, y, color)
    
    def draw_text(self, text: str, x: int, y: int, color):
        """Draw text at specified position."""
        text_surface = self.font.render(text, True, color)
        self.screen.blit(text_surface, (x, y))
    
    def draw_small_text(self, text: str, x: int, y: int, color):
        """Draw small text at specified position."""
        text_surface = self.small_font.render(text, True, color)
        self.screen.blit(text_surface, (x, y))