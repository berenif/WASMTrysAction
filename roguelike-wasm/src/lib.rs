use wasm_bindgen::prelude::*;
use rand::Rng;
use std::collections::HashSet;

const MAP_WIDTH: usize = 60;
const MAP_HEIGHT: usize = 20;
const FOV_RADIUS: i32 = 8;

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum TileType {
    Wall,
    Floor,
    StairsDown,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum EntityType {
    Player,
    Monster,
    Gold,
    Potion,
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct Entity {
    pub entity_type: EntityType,
    pub x: i32,
    pub y: i32,
    pub health: i32,
    pub max_health: i32,
    pub attack: i32,
    pub symbol: char,
    pub is_alive: bool,
}

#[wasm_bindgen]
impl Entity {
    #[wasm_bindgen(constructor)]
    pub fn new(entity_type: EntityType, x: i32, y: i32) -> Entity {
        let (health, attack, symbol) = match entity_type {
            EntityType::Player => (100, 10, '@'),
            EntityType::Monster => (30, 5, 'M'),
            EntityType::Gold => (0, 0, '$'),
            EntityType::Potion => (0, 0, '!'),
        };
        
        Entity {
            entity_type,
            x,
            y,
            health,
            max_health: health,
            attack,
            symbol,
            is_alive: health >= 0,
        }
    }
    
    pub fn get_x(&self) -> i32 { self.x }
    pub fn get_y(&self) -> i32 { self.y }
    pub fn get_health(&self) -> i32 { self.health }
    pub fn get_max_health(&self) -> i32 { self.max_health }
    pub fn get_symbol(&self) -> String { self.symbol.to_string() }
    pub fn get_type(&self) -> EntityType { self.entity_type }
}

#[wasm_bindgen]
pub struct Game {
    map: Vec<Vec<TileType>>,
    visible_tiles: HashSet<(i32, i32)>,
    explored_tiles: HashSet<(i32, i32)>,
    entities: Vec<Entity>,
    player_index: usize,
    score: i32,
    floor: i32,
    messages: Vec<String>,
}

#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Game {
        let mut game = Game {
            map: vec![vec![TileType::Wall; MAP_WIDTH]; MAP_HEIGHT],
            visible_tiles: HashSet::new(),
            explored_tiles: HashSet::new(),
            entities: Vec::new(),
            player_index: 0,
            score: 0,
            floor: 1,
            messages: Vec::new(),
        };
        
        game.generate_map();
        game.add_message(format!("Welcome to floor {}!", game.floor));
        game.update_fov();
        game
    }
    
    fn generate_map(&mut self) {
        let mut rng = rand::thread_rng();
        
        // Simple room generation
        for _ in 0..10 {
            let room_w = rng.gen_range(4..10);
            let room_h = rng.gen_range(4..8);
            let room_x = rng.gen_range(1..MAP_WIDTH - room_w - 1);
            let room_y = rng.gen_range(1..MAP_HEIGHT - room_h - 1);
            
            for y in room_y..room_y + room_h {
                for x in room_x..room_x + room_w {
                    self.map[y][x] = TileType::Floor;
                }
            }
        }
        
        // Connect rooms with corridors
        for y in 1..MAP_HEIGHT - 1 {
            for x in 1..MAP_WIDTH - 1 {
                if rng.gen_bool(0.1) {
                    self.map[y][x] = TileType::Floor;
                }
            }
        }
        
        // Place player
        let px = rng.gen_range(5..MAP_WIDTH - 5) as i32;
        let py = rng.gen_range(5..MAP_HEIGHT - 5) as i32;
        self.map[py as usize][px as usize] = TileType::Floor;
        let player = Entity::new(EntityType::Player, px, py);
        self.entities.push(player);
        self.player_index = 0;
        
        // Place monsters and items
        for _ in 0..10 {
            let x = rng.gen_range(1..MAP_WIDTH - 1) as i32;
            let y = rng.gen_range(1..MAP_HEIGHT - 1) as i32;
            if self.map[y as usize][x as usize] == TileType::Floor && !self.is_blocked(x, y) {
                let entity_type = if rng.gen_bool(0.6) {
                    EntityType::Monster
                } else if rng.gen_bool(0.5) {
                    EntityType::Gold
                } else {
                    EntityType::Potion
                };
                self.entities.push(Entity::new(entity_type, x, y));
            }
        }
        
        // Place stairs
        let sx = rng.gen_range(1..MAP_WIDTH - 1);
        let sy = rng.gen_range(1..MAP_HEIGHT - 1);
        self.map[sy][sx] = TileType::StairsDown;
    }
    
    fn is_blocked(&self, x: i32, y: i32) -> bool {
        for entity in &self.entities {
            if entity.x == x && entity.y == y && entity.is_alive {
                return true;
            }
        }
        false
    }
    
    fn update_fov(&mut self) {
        self.visible_tiles.clear();
        let player = &self.entities[self.player_index];
        
        for dy in -FOV_RADIUS..=FOV_RADIUS {
            for dx in -FOV_RADIUS..=FOV_RADIUS {
                let x = player.x + dx;
                let y = player.y + dy;
                
                if x >= 0 && x < MAP_WIDTH as i32 && y >= 0 && y < MAP_HEIGHT as i32 {
                    let dist = ((dx * dx + dy * dy) as f32).sqrt();
                    if dist <= FOV_RADIUS as f32 {
                        self.visible_tiles.insert((x, y));
                        self.explored_tiles.insert((x, y));
                    }
                }
            }
        }
    }
    
    pub fn move_player(&mut self, dx: i32, dy: i32) -> bool {
        let new_x = self.entities[self.player_index].x + dx;
        let new_y = self.entities[self.player_index].y + dy;
        
        if new_x < 0 || new_x >= MAP_WIDTH as i32 || new_y < 0 || new_y >= MAP_HEIGHT as i32 {
            return false;
        }
        
        if self.map[new_y as usize][new_x as usize] == TileType::Wall {
            return false;
        }
        
        // Check for entities
        for i in 0..self.entities.len() {
            if i != self.player_index && self.entities[i].x == new_x && self.entities[i].y == new_y && self.entities[i].is_alive {
                match self.entities[i].entity_type {
                    EntityType::Monster => {
                        // Combat
                        self.entities[i].health -= self.entities[self.player_index].attack;
                        if self.entities[i].health <= 0 {
                            self.entities[i].is_alive = false;
                            self.score += 10;
                            self.add_message("Monster defeated!".to_string());
                        } else {
                            let damage = self.entities[i].attack;
                            self.entities[self.player_index].health -= damage;
                            self.add_message(format!("Monster hits you for {} damage!", damage));
                        }
                        return true;
                    },
                    EntityType::Gold => {
                        self.entities[i].is_alive = false;
                        self.score += 50;
                        self.add_message("Found gold! +50 score".to_string());
                    },
                    EntityType::Potion => {
                        self.entities[i].is_alive = false;
                        self.entities[self.player_index].health = 
                            (self.entities[self.player_index].health + 30)
                            .min(self.entities[self.player_index].max_health);
                        self.add_message("Healed 30 HP!".to_string());
                    },
                    _ => {}
                }
            }
        }
        
        self.entities[self.player_index].x = new_x;
        self.entities[self.player_index].y = new_y;
        
        if self.map[new_y as usize][new_x as usize] == TileType::StairsDown {
            self.next_floor();
        }
        
        self.update_fov();
        self.process_monsters();
        true
    }
    
    fn process_monsters(&mut self) {
        let px = self.entities[self.player_index].x;
        let py = self.entities[self.player_index].y;
        
        for i in 0..self.entities.len() {
            if i != self.player_index && self.entities[i].entity_type == EntityType::Monster && self.entities[i].is_alive {
                let dx = (px - self.entities[i].x).abs();
                let dy = (py - self.entities[i].y).abs();
                
                if dx <= 1 && dy <= 1 {
                    // Attack player
                    let damage = self.entities[i].attack;
                    self.entities[self.player_index].health -= damage;
                    self.add_message(format!("Monster attacks for {} damage!", damage));
                } else if dx + dy < 5 {
                    // Move towards player
                    let mx = if px > self.entities[i].x { 1 } else if px < self.entities[i].x { -1 } else { 0 };
                    let my = if py > self.entities[i].y { 1 } else if py < self.entities[i].y { -1 } else { 0 };
                    
                    let new_x = self.entities[i].x + mx;
                    let new_y = self.entities[i].y + my;
                    
                    if self.map[new_y as usize][new_x as usize] != TileType::Wall && !self.is_blocked(new_x, new_y) {
                        self.entities[i].x = new_x;
                        self.entities[i].y = new_y;
                    }
                }
            }
        }
    }
    
    fn next_floor(&mut self) {
        self.floor += 1;
        self.score += 100;
        self.add_message(format!("Descended to floor {}!", self.floor));
        
        let player = self.entities[self.player_index].clone();
        self.entities.clear();
        self.entities.push(player);
        self.player_index = 0;
        
        self.generate_map();
        self.update_fov();
    }
    
    fn add_message(&mut self, msg: String) {
        self.messages.push(msg);
        if self.messages.len() > 5 {
            self.messages.remove(0);
        }
    }
    
    pub fn get_tile(&self, x: usize, y: usize) -> TileType {
        if x < MAP_WIDTH && y < MAP_HEIGHT {
            self.map[y][x]
        } else {
            TileType::Wall
        }
    }
    
    pub fn is_visible(&self, x: i32, y: i32) -> bool {
        self.visible_tiles.contains(&(x, y))
    }
    
    pub fn is_explored(&self, x: i32, y: i32) -> bool {
        self.explored_tiles.contains(&(x, y))
    }
    
    pub fn get_entities_at(&self, x: i32, y: i32) -> Vec<Entity> {
        self.entities.iter()
            .filter(|e| e.x == x && e.y == y && e.is_alive)
            .cloned()
            .collect()
    }
    
    pub fn get_player(&self) -> Entity {
        self.entities[self.player_index].clone()
    }
    
    pub fn get_score(&self) -> i32 { self.score }
    pub fn get_floor(&self) -> i32 { self.floor }
    pub fn get_messages(&self) -> Vec<String> { self.messages.clone() }
    pub fn is_game_over(&self) -> bool { self.entities[self.player_index].health <= 0 }
    pub fn get_map_width(&self) -> usize { MAP_WIDTH }
    pub fn get_map_height(&self) -> usize { MAP_HEIGHT }
}
