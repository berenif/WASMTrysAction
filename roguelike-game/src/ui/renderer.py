"""Main rendering system for the game."""

import pygame
from typing import List, Dict, Optional


class Renderer:
    """Handles all game rendering."""
    
    def __init__(self, screen: pygame.Surface, settings):
        """Initialize renderer."""
        self.screen = screen
        self.settings = settings
        self.font = pygame.font.Font(None, settings.UI_FONT_SIZE)
        self.large_font = pygame.font.Font(None, settings.UI_FONT_SIZE * 2)
    
    def render_exploration(self, game_state):
        """Render exploration view."""
        # Draw rooms
        for room in game_state.rooms:
            if room.discovered:
                self.draw_room(room, game_state)
        
        # Draw fog of war
        self.draw_fog_of_war(game_state)
        
        # Draw player
        self.draw_player(game_state.player)
        
        # Draw current room info
        if game_state.current_room_index < len(game_state.rooms):
            room = game_state.rooms[game_state.current_room_index]
            text = f"Room: {room.room_type.upper()}"
            self.draw_text(text, 10, 10, self.settings.WHITE)
    
    def render_combat(self, game_state, telegraph_timers):
        """Render combat view."""
        # Draw room
        if game_state.current_room_index < len(game_state.rooms):
            room = game_state.rooms[game_state.current_room_index]
            self.draw_room(room, game_state)
        
        # Draw player
        self.draw_player(game_state.player)
        
        # Draw enemies with telegraphs
        for i, enemy in enumerate(game_state.enemies):
            self.draw_enemy(enemy)
            
            # Draw telegraph if active
            if i in telegraph_timers and telegraph_timers[i] > 0:
                self.draw_telegraph(enemy)
        
        # Combat UI
        text = "COMBAT - Press SPACE to dodge!"
        self.draw_text(text, 10, 10, self.settings.RED)
    
    def render_choices(self, choices: List[Dict], selected_index: int):
        """Render choice interface."""
        # Draw choice panel
        panel_height = 400
        panel_y = (self.settings.SCREEN_HEIGHT - panel_height) // 2
        
        # Background
        panel_rect = pygame.Rect(100, panel_y, self.settings.SCREEN_WIDTH - 200, panel_height)
        pygame.draw.rect(self.screen, self.settings.DARK_GRAY, panel_rect)
        pygame.draw.rect(self.screen, self.settings.WHITE, panel_rect, 2)
        
        # Title
        title = "Choose Your Upgrade"
        title_surface = self.large_font.render(title, True, self.settings.WHITE)
        title_rect = title_surface.get_rect(centerx=self.settings.SCREEN_WIDTH // 2, y=panel_y + 20)
        self.screen.blit(title_surface, title_rect)
        
        # Render choices
        choice_y = panel_y + 80
        for i, choice in enumerate(choices):
            color = self.settings.WHITE if i == selected_index else self.settings.GRAY
            
            # Choice box
            choice_rect = pygame.Rect(150, choice_y + i * 100, self.settings.SCREEN_WIDTH - 300, 80)
            if i == selected_index:
                pygame.draw.rect(self.screen, self.settings.WHITE, choice_rect, 2)
            
            # Choice text
            name = choice.get('name', 'Unknown')
            effect = f"{choice.get('effect', '')}: +{choice.get('value', 0)}"
            
            self.draw_text(name, choice_rect.x + 10, choice_rect.y + 10, color)
            self.draw_text(effect, choice_rect.x + 10, choice_rect.y + 40, color)
    
    def render_powerup_feedback(self, game_state):
        """Render power-up application feedback."""
        # Simple feedback text
        text = "Power-up Applied!"
        text_surface = self.large_font.render(text, True, self.settings.GREEN)
        text_rect = text_surface.get_rect(center=(self.settings.SCREEN_WIDTH // 2, self.settings.SCREEN_HEIGHT // 2))
        self.screen.blit(text_surface, text_rect)
    
    def render_risk_reward(self, opportunity: Dict):
        """Render risk/reward interface."""
        # Draw opportunity panel
        panel_height = 300
        panel_y = (self.settings.SCREEN_HEIGHT - panel_height) // 2
        
        panel_rect = pygame.Rect(100, panel_y, self.settings.SCREEN_WIDTH - 200, panel_height)
        pygame.draw.rect(self.screen, self.settings.DARK_GRAY, panel_rect)
        pygame.draw.rect(self.screen, self.settings.RED, panel_rect, 3)
        
        # Title
        title = opportunity['name']
        title_surface = self.large_font.render(title, True, self.settings.WHITE)
        title_rect = title_surface.get_rect(centerx=self.settings.SCREEN_WIDTH // 2, y=panel_y + 20)
        self.screen.blit(title_surface, title_rect)
        
        # Description
        desc = opportunity['description']
        self.draw_text(desc, panel_rect.x + 20, panel_y + 80, self.settings.WHITE)
        
        # Risk
        risk_text = f"RISK: {opportunity['risk']}"
        self.draw_text(risk_text, panel_rect.x + 20, panel_y + 120, self.settings.RED)
        
        # Reward
        reward_text = f"REWARD: {opportunity['reward']}"
        self.draw_text(reward_text, panel_rect.x + 20, panel_y + 160, self.settings.GREEN)
        
        # Instructions
        inst = "Press Y to accept, N to decline"
        self.draw_text(inst, panel_rect.x + 20, panel_y + 220, self.settings.GRAY)
    
    def render_escalation_info(self, game_state):
        """Render escalation information."""
        text = f"Floor {game_state.current_floor} - {game_state.current_biome.name}"
        text_surface = self.large_font.render(text, True, self.settings.WHITE)
        text_rect = text_surface.get_rect(center=(self.settings.SCREEN_WIDTH // 2, self.settings.SCREEN_HEIGHT // 2))
        self.screen.blit(text_surface, text_rect)
    
    def render_shop(self, game_state, selected_index: int):
        """Render shop interface."""
        # Shop background
        shop_rect = pygame.Rect(50, 50, self.settings.SCREEN_WIDTH - 100, self.settings.SCREEN_HEIGHT - 200)
        pygame.draw.rect(self.screen, self.settings.DARK_GRAY, shop_rect)
        pygame.draw.rect(self.screen, self.settings.WHITE, shop_rect, 2)
        
        # Title
        title = f"SHOP - Gold: {game_state.player.gold}"
        title_surface = self.large_font.render(title, True, self.settings.WHITE)
        title_rect = title_surface.get_rect(centerx=self.settings.SCREEN_WIDTH // 2, y=70)
        self.screen.blit(title_surface, title_rect)
        
        # Items
        item_y = 150
        for i, item in enumerate(game_state.shop_items):
            color = self.settings.WHITE if i == selected_index else self.settings.GRAY
            
            # Highlight selected
            if i == selected_index:
                select_rect = pygame.Rect(70, item_y + i * 60 - 5, self.settings.SCREEN_WIDTH - 140, 50)
                pygame.draw.rect(self.screen, self.settings.WHITE, select_rect, 1)
            
            # Item info
            item_text = f"{item['name']} - {item['cost']} gold"
            self.draw_text(item_text, 80, item_y + i * 60, color)
            
            # Effect description
            effect_text = f"  {item['effect']}: {item['value']}"
            self.draw_text(effect_text, 80, item_y + i * 60 + 25, self.settings.GRAY)
        
        # Instructions
        inst = "ENTER to buy, ESC to leave"
        self.draw_text(inst, shop_rect.x + 20, shop_rect.bottom - 40, self.settings.GRAY)
    
    def render_reset_screen(self, game_state, show_stats: bool):
        """Render death/reset screen."""
        # Dark overlay
        overlay = pygame.Surface((self.settings.SCREEN_WIDTH, self.settings.SCREEN_HEIGHT))
        overlay.set_alpha(200)
        overlay.fill(self.settings.BLACK)
        self.screen.blit(overlay, (0, 0))
        
        # Death message
        if game_state.player.hp <= 0:
            title = "DEFEATED"
            color = self.settings.RED
        else:
            title = "VICTORY"
            color = self.settings.GREEN
        
        title_surface = self.large_font.render(title, True, color)
        title_rect = title_surface.get_rect(center=(self.settings.SCREEN_WIDTH // 2, 100))
        self.screen.blit(title_surface, title_rect)
        
        if show_stats:
            # Show run stats
            stats_y = 200
            stats = [
                f"Floor Reached: {game_state.current_floor}",
                f"Enemies Killed: {game_state.enemies_killed}",
                f"Rooms Explored: {game_state.rooms_explored}",
                f"Gold Earned: {game_state.player.gold}"
            ]
            
            for stat in stats:
                stat_surface = self.font.render(stat, True, self.settings.WHITE)
                stat_rect = stat_surface.get_rect(centerx=self.settings.SCREEN_WIDTH // 2, y=stats_y)
                self.screen.blit(stat_surface, stat_rect)
                stats_y += 30
        
        # Restart prompt
        prompt = "Press R to restart, Q to quit"
        prompt_surface = self.font.render(prompt, True, self.settings.WHITE)
        prompt_rect = prompt_surface.get_rect(center=(self.settings.SCREEN_WIDTH // 2, self.settings.SCREEN_HEIGHT - 100))
        self.screen.blit(prompt_surface, prompt_rect)
    
    # Helper methods
    def draw_room(self, room, game_state):
        """Draw a single room."""
        # Scale to screen coordinates
        tile_size = self.settings.TILE_SIZE
        x = room.x * tile_size
        y = room.y * tile_size
        w = room.width * tile_size
        h = room.height * tile_size
        
        # Room color based on type
        colors = {
            "start": self.settings.GREEN,
            "standard": self.settings.GRAY,
            "treasure": (255, 215, 0),  # Gold
            "shop": self.settings.BLUE,
            "boss": self.settings.RED
        }
        color = colors.get(room.room_type, self.settings.GRAY)
        
        # Draw room
        room_rect = pygame.Rect(x, y, w, h)
        if room.cleared:
            pygame.draw.rect(self.screen, self.settings.DARK_GRAY, room_rect)
        else:
            pygame.draw.rect(self.screen, color, room_rect, 2)
        
        # Draw room type indicator
        if room.room_type != "standard":
            type_text = room.room_type[0].upper()
            text_surface = self.font.render(type_text, True, color)
            text_rect = text_surface.get_rect(center=(x + w // 2, y + h // 2))
            self.screen.blit(text_surface, text_rect)
    
    def draw_fog_of_war(self, game_state):
        """Draw fog of war overlay."""
        # Simple fog - darken undiscovered areas
        for room in game_state.rooms:
            if not room.discovered:
                tile_size = self.settings.TILE_SIZE
                x = room.x * tile_size
                y = room.y * tile_size
                w = room.width * tile_size
                h = room.height * tile_size
                
                fog_surf = pygame.Surface((w, h))
                fog_surf.set_alpha(self.settings.FOG_ALPHA)
                fog_surf.fill(self.settings.BLACK)
                self.screen.blit(fog_surf, (x, y))
    
    def draw_player(self, player):
        """Draw the player character."""
        tile_size = self.settings.TILE_SIZE
        x = int(player.x * tile_size)
        y = int(player.y * tile_size)
        
        # Draw player as a circle
        color = self.settings.BLUE if player.is_dodging else self.settings.WHITE
        pygame.draw.circle(self.screen, color, (x, y), tile_size // 3)
        
        # Draw health bar
        bar_width = tile_size
        bar_height = 4
        bar_x = x - bar_width // 2
        bar_y = y - tile_size // 2 - 10
        
        # Background
        pygame.draw.rect(self.screen, self.settings.RED, (bar_x, bar_y, bar_width, bar_height))
        # Health
        health_width = int(bar_width * (player.hp / player.max_hp))
        pygame.draw.rect(self.screen, self.settings.GREEN, (bar_x, bar_y, health_width, bar_height))
    
    def draw_enemy(self, enemy):
        """Draw an enemy."""
        tile_size = self.settings.TILE_SIZE
        x = int(enemy.x * tile_size)
        y = int(enemy.y * tile_size)
        
        # Enemy color based on type
        colors = {
            "grunt": self.settings.RED,
            "ranger": (255, 128, 0),  # Orange
            "tank": (128, 0, 128),  # Purple
            "swarm": (255, 255, 0),  # Yellow
        }
        color = colors.get(enemy.enemy_type, self.settings.RED)
        
        # Draw enemy
        size = tile_size // 3
        if enemy.is_elite:
            size = int(size * 1.5)
            pygame.draw.circle(self.screen, self.settings.WHITE, (x, y), size + 2)  # Elite border
        
        pygame.draw.circle(self.screen, color, (x, y), size)
        
        # Health bar
        bar_width = tile_size
        bar_height = 3
        bar_x = x - bar_width // 2
        bar_y = y - tile_size // 2 - 10
        
        pygame.draw.rect(self.screen, self.settings.RED, (bar_x, bar_y, bar_width, bar_height))
        health_width = int(bar_width * (enemy.hp / enemy.max_hp))
        pygame.draw.rect(self.screen, self.settings.GREEN, (bar_x, bar_y, health_width, bar_height))
    
    def draw_telegraph(self, enemy):
        """Draw attack telegraph for enemy."""
        tile_size = self.settings.TILE_SIZE
        x = int(enemy.x * tile_size)
        y = int(enemy.y * tile_size)
        
        # Draw warning indicator
        pygame.draw.circle(self.screen, self.settings.RED, (x, y), tile_size // 2, 2)
        
        # Draw "!" above enemy
        text = "!"
        text_surface = self.large_font.render(text, True, self.settings.RED)
        text_rect = text_surface.get_rect(centerx=x, bottom=y - tile_size // 2 - 15)
        self.screen.blit(text_surface, text_rect)
    
    def draw_text(self, text: str, x: int, y: int, color):
        """Draw text at specified position."""
        text_surface = self.font.render(text, True, color)
        self.screen.blit(text_surface, (x, y))