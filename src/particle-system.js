/**
 * Particle System Module
 * Handles particle effects for visual feedback in the game
 */

export class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 2;
        this.vy = options.vy || (Math.random() - 0.5) * 2;
        this.life = options.life || 1.0;
        this.decay = options.decay || 0.02;
        this.color = options.color || '#ffffff';
        this.size = options.size || 2;
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.98;
        this.alpha = 1.0;
    }
    
    update(deltaTime = 1) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += this.gravity * deltaTime;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= this.decay * deltaTime;
        this.alpha = Math.max(0, this.life);
        
        return this.life > 0;
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class ParticleEmitter {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.emissionRate = options.emissionRate || 10;
        this.maxParticles = options.maxParticles || 100;
        this.particleOptions = options.particleOptions || {};
        this.spread = options.spread || Math.PI * 2;
        this.speed = options.speed || 2;
        this.active = true;
        this.emissionTimer = 0;
    }
    
    emit(count = 1) {
        for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
            const angle = Math.random() * this.spread - this.spread / 2;
            const speed = this.speed * (0.5 + Math.random() * 0.5);
            
            const particle = new Particle(this.x, this.y, {
                ...this.particleOptions,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            });
            
            this.particles.push(particle);
        }
    }
    
    update(deltaTime = 1) {
        if (this.active) {
            this.emissionTimer += deltaTime;
            const emissionsNeeded = Math.floor(this.emissionTimer * this.emissionRate / 60);
            if (emissionsNeeded > 0) {
                this.emit(emissionsNeeded);
                this.emissionTimer = 0;
            }
        }
        
        this.particles = this.particles.filter(particle => particle.update(deltaTime));
    }
    
    render(ctx) {
        this.particles.forEach(particle => particle.render(ctx));
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    stop() {
        this.active = false;
    }
    
    start() {
        this.active = true;
    }
    
    clear() {
        this.particles = [];
    }
}

export class ParticleSystem {
    constructor() {
        this.emitters = new Map();
        this.effects = [];
    }
    
    createEmitter(name, x, y, options) {
        const emitter = new ParticleEmitter(x, y, options);
        this.emitters.set(name, emitter);
        return emitter;
    }
    
    removeEmitter(name) {
        if (this.emitters.has(name)) {
            this.emitters.get(name).clear();
            this.emitters.delete(name);
        }
    }
    
    getEmitter(name) {
        return this.emitters.get(name);
    }
    
    // Create predefined particle effects
    createExplosion(x, y, options = {}) {
        const defaults = {
            count: options.count || 30,
            color: options.color || '#ff6600',
            speed: options.speed || 5,
            life: options.life || 1.0,
            size: options.size || 3,
            gravity: options.gravity || 0.1
        };
        
        for (let i = 0; i < defaults.count; i++) {
            const angle = (Math.PI * 2 * i) / defaults.count;
            const speed = defaults.speed * (0.5 + Math.random() * 0.5);
            
            const particle = new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: defaults.color,
                life: defaults.life,
                size: defaults.size * (0.5 + Math.random()),
                gravity: defaults.gravity,
                decay: 0.03
            });
            
            this.effects.push(particle);
        }
    }
    
    createSpark(x, y, direction = 0, options = {}) {
        const defaults = {
            count: options.count || 10,
            color: options.color || '#ffff00',
            speed: options.speed || 3,
            spread: options.spread || Math.PI / 4
        };
        
        for (let i = 0; i < defaults.count; i++) {
            const angle = direction + (Math.random() - 0.5) * defaults.spread;
            const speed = defaults.speed * (0.5 + Math.random() * 0.5);
            
            const particle = new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: defaults.color,
                size: 1 + Math.random() * 2,
                life: 0.5 + Math.random() * 0.5,
                decay: 0.05
            });
            
            this.effects.push(particle);
        }
    }
    
    createSmoke(x, y, options = {}) {
        const defaults = {
            count: options.count || 15,
            color: options.color || '#888888',
            speed: options.speed || 0.5
        };
        
        for (let i = 0; i < defaults.count; i++) {
            const particle = new Particle(x, y, {
                vx: (Math.random() - 0.5) * defaults.speed,
                vy: -Math.random() * defaults.speed * 2,
                color: defaults.color,
                size: 5 + Math.random() * 5,
                life: 1.0,
                decay: 0.01,
                gravity: -0.05,
                friction: 0.99
            });
            
            this.effects.push(particle);
        }
    }
    
    createTrail(x, y, options = {}) {
        const particle = new Particle(x, y, {
            vx: options.vx || 0,
            vy: options.vy || 0,
            color: options.color || '#00ff00',
            size: options.size || 2,
            life: options.life || 0.5,
            decay: options.decay || 0.05
        });
        
        this.effects.push(particle);
    }
    
    update(deltaTime = 1) {
        // Update all emitters
        for (const emitter of this.emitters.values()) {
            emitter.update(deltaTime);
        }
        
        // Update standalone effects
        this.effects = this.effects.filter(particle => particle.update(deltaTime));
    }
    
    render(ctx) {
        // Render all emitters
        for (const emitter of this.emitters.values()) {
            emitter.render(ctx);
        }
        
        // Render standalone effects
        this.effects.forEach(particle => particle.render(ctx));
    }
    
    clear() {
        this.emitters.clear();
        this.effects = [];
    }
    
    getParticleCount() {
        let count = this.effects.length;
        for (const emitter of this.emitters.values()) {
            count += emitter.particles.length;
        }
        return count;
    }
}

// Export a singleton instance
export const particleSystem = new ParticleSystem();
export default ParticleSystem;