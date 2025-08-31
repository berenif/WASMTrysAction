"""Central game state management."""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum, auto
import random


class Biome(Enum):
    """Different biomes in the game."""
    DUNGEON = auto()
    CAVERNS = auto()
    FACTORY = auto()
    TEMPLE = auto()
    VOID = auto()


@dataclass
class Player:
    """Player character state."""
    x: int = 0
    y: int = 0
    hp: int = 100
    max_hp: int = 100
    stamina: int = 100
    max_stamina: int = 100
    damage: int = 10
    speed: float = 4.0
    dodge_cooldown: float = 0.0
    is_dodging: bool = False
    
    # Currencies
    gold: int = 50
    souls: int = 0
    keys: int = 1
    
    # Stats
    crit_chance: float = 0.1
    crit_damage: float = 1.5
    armor: int = 0
    dodge_chance: float = 0.1
    
    # Abilities
    abilities: List[str] = field(default_factory=list)
    relics: List[str] = field(default_factory=list)
    curses: List[str] = field(default_factory=list)


@dataclass
class Enemy:
    """Enemy entity."""
    x: int
    y: int
    hp: int
    max_hp: int
    damage: int
    speed: float
    enemy_type: str
    is_elite: bool = False
    modifiers: List[str] = field(default_factory=list)


@dataclass
class Room:
    """Room in the dungeon."""
    x: int
    y: int
    width: int
    height: int
    room_type: str
    discovered: bool = False
    cleared: bool = False
    connections: List[int] = field(default_factory=list)
    enemies: List[Enemy] = field(default_factory=list)
    items: List[Dict] = field(default_factory=list)


class GameState:
    """Central game state container."""
    
    def __init__(self, settings):
        """Initialize game state."""
        self.settings = settings
        self.paused = False
        self.current_phase = None
        
        # Player state
        self.player = Player(
            hp=settings.PLAYER_BASE_HP,
            max_hp=settings.PLAYER_BASE_HP,
            damage=settings.PLAYER_BASE_DAMAGE,
            speed=settings.PLAYER_SPEED,
            gold=settings.STARTING_GOLD,
            souls=settings.STARTING_SOULS,
            keys=settings.STARTING_KEYS
        )
        
        # Dungeon state
        self.current_floor = 1
        self.current_biome = Biome.DUNGEON
        self.rooms: List[Room] = []
        self.current_room_index = 0
        self.fog_of_war: Dict[tuple, bool] = {}
        
        # Combat state
        self.in_combat = False
        self.enemies: List[Enemy] = []
        self.combat_log: List[str] = []
        
        # Choice state
        self.pending_choices: List[Dict] = []
        self.selected_choice: Optional[Dict] = None
        
        # Economy state
        self.shop_items: List[Dict] = []
        self.price_modifier = 1.0
        
        # Meta state
        self.run_time = 0.0
        self.enemies_killed = 0
        self.rooms_explored = 0
        self.items_collected = 0
        self.total_damage_dealt = 0
        self.total_damage_taken = 0
        
        # Initialize first floor
        self.generate_floor()
    
    def generate_floor(self):
        """Generate a new floor layout."""
        self.rooms = []
        num_rooms = self.settings.ROOMS_PER_FLOOR
        
        for i in range(num_rooms):
            room = self.create_room(i)
            self.rooms.append(room)
        
        # Connect rooms
        self.connect_rooms()
        
        # Place player in first room
        if self.rooms:
            first_room = self.rooms[0]
            self.player.x = first_room.x + first_room.width // 2
            self.player.y = first_room.y + first_room.height // 2
            first_room.discovered = True
    
    def create_room(self, index: int) -> Room:
        """Create a single room."""
        width = random.randint(self.settings.MIN_ROOM_SIZE, self.settings.MAX_ROOM_SIZE)
        height = random.randint(self.settings.MIN_ROOM_SIZE, self.settings.MAX_ROOM_SIZE)
        
        # Simple grid placement for now
        grid_cols = 5
        col = index % grid_cols
        row = index // grid_cols
        x = col * (self.settings.MAX_ROOM_SIZE + 2)
        y = row * (self.settings.MAX_ROOM_SIZE + 2)
        
        # Determine room type
        if index == 0:
            room_type = "start"
        elif index == len(range(self.settings.ROOMS_PER_FLOOR)) - 1:
            room_type = "boss"
        elif random.random() < 0.1:
            room_type = "shop"
        elif random.random() < 0.2:
            room_type = "treasure"
        else:
            room_type = "standard"
        
        room = Room(x, y, width, height, room_type)
        
        # Populate room with enemies (except start and shop)
        if room_type not in ["start", "shop"]:
            self.populate_room_enemies(room)
        
        return room
    
    def populate_room_enemies(self, room: Room):
        """Add enemies to a room."""
        # Enemy count based on floor and room type
        base_count = 2 if room.room_type == "standard" else 3
        enemy_count = base_count + int(self.current_floor * self.settings.ENEMY_DENSITY_INCREASE)
        
        for _ in range(enemy_count):
            enemy = self.create_enemy(room)
            room.enemies.append(enemy)
    
    def create_enemy(self, room: Room) -> Enemy:
        """Create an enemy."""
        # Random position within room
        x = room.x + random.randint(1, room.width - 1)
        y = room.y + random.randint(1, room.height - 1)
        
        # Scale stats based on floor
        hp_scale = self.settings.HP_SCALE_PER_FLOOR ** (self.current_floor - 1)
        damage_scale = self.settings.DAMAGE_SCALE_PER_FLOOR ** (self.current_floor - 1)
        
        # Enemy types based on biome
        if self.current_biome == Biome.DUNGEON:
            enemy_types = ["grunt", "ranger", "tank"]
        elif self.current_biome == Biome.CAVERNS:
            enemy_types = ["lurker", "spitter", "brute"]
        else:
            enemy_types = ["grunt", "ranger", "tank", "swarm"]
        
        enemy_type = random.choice(enemy_types)
        
        # Base stats by type
        stats = {
            "grunt": {"hp": 20, "damage": 5, "speed": 3.0},
            "ranger": {"hp": 15, "damage": 8, "speed": 2.5},
            "tank": {"hp": 40, "damage": 3, "speed": 1.5},
            "swarm": {"hp": 5, "damage": 2, "speed": 5.0},
            "lurker": {"hp": 25, "damage": 10, "speed": 4.0},
            "spitter": {"hp": 18, "damage": 6, "speed": 2.0},
            "brute": {"hp": 50, "damage": 12, "speed": 1.0},
        }
        
        base_stats = stats.get(enemy_type, stats["grunt"])
        
        # Apply scaling
        hp = int(base_stats["hp"] * hp_scale)
        damage = int(base_stats["damage"] * damage_scale)
        
        # Elite chance
        is_elite = random.random() < 0.1 * self.current_floor
        if is_elite:
            hp *= 2
            damage *= 1.5
        
        return Enemy(
            x=x, y=y,
            hp=hp, max_hp=hp,
            damage=damage,
            speed=base_stats["speed"],
            enemy_type=enemy_type,
            is_elite=is_elite
        )
    
    def connect_rooms(self):
        """Create connections between rooms."""
        # Simple connection: each room connects to the next
        for i in range(len(self.rooms) - 1):
            self.rooms[i].connections.append(i + 1)
            self.rooms[i + 1].connections.append(i)
        
        # Add some random connections for variety
        for _ in range(self.settings.ROOMS_PER_FLOOR // 3):
            room1 = random.randint(0, len(self.rooms) - 1)
            room2 = random.randint(0, len(self.rooms) - 1)
            if room1 != room2:
                if room2 not in self.rooms[room1].connections:
                    self.rooms[room1].connections.append(room2)
                    self.rooms[room2].connections.append(room1)
    
    def enemies_nearby(self) -> bool:
        """Check if there are enemies near the player."""
        if self.current_room_index < len(self.rooms):
            current_room = self.rooms[self.current_room_index]
            return len(current_room.enemies) > 0
        return False
    
    def has_pending_choices(self) -> bool:
        """Check if there are choices to make."""
        return len(self.pending_choices) > 0
    
    def shop_available(self) -> bool:
        """Check if a shop is available."""
        if self.current_room_index < len(self.rooms):
            current_room = self.rooms[self.current_room_index]
            return current_room.room_type == "shop" and not current_room.cleared
        return False
    
    def reset(self):
        """Reset the game state for a new run."""
        # Reset player
        self.player = Player(
            hp=self.settings.PLAYER_BASE_HP,
            max_hp=self.settings.PLAYER_BASE_HP,
            damage=self.settings.PLAYER_BASE_DAMAGE,
            speed=self.settings.PLAYER_SPEED,
            gold=self.settings.STARTING_GOLD,
            souls=self.settings.STARTING_SOULS,
            keys=self.settings.STARTING_KEYS
        )
        
        # Reset dungeon
        self.current_floor = 1
        self.current_biome = Biome.DUNGEON
        self.rooms = []
        self.current_room_index = 0
        self.fog_of_war = {}
        
        # Reset combat
        self.in_combat = False
        self.enemies = []
        self.combat_log = []
        
        # Reset choices
        self.pending_choices = []
        self.selected_choice = None
        
        # Reset economy
        self.shop_items = []
        self.price_modifier = 1.0
        
        # Reset stats
        self.run_time = 0.0
        self.enemies_killed = 0
        self.rooms_explored = 0
        self.items_collected = 0
        self.total_damage_dealt = 0
        self.total_damage_taken = 0
        
        # Generate new floor
        self.generate_floor()