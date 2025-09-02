/**
 * Camera Effects Module
 * Handles camera movement, screen shake, zoom, and other visual effects
 */

export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.zoom = 1.0;
        this.rotation = 0;
        
        // Target values for smooth transitions
        this.targetX = 0;
        this.targetY = 0;
        this.targetZoom = 1.0;
        this.targetRotation = 0;
        
        // Smoothing factors
        this.positionSmoothing = 0.1;
        this.zoomSmoothing = 0.1;
        this.rotationSmoothing = 0.1;
        
        // Screen shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        
        // Bounds
        this.bounds = null;
        
        // Effects
        this.effects = [];
    }
    
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
    }
    
    setZoom(zoom, smooth = true) {
        this.targetZoom = Math.max(0.1, Math.min(5, zoom));
        if (!smooth) {
            this.zoom = this.targetZoom;
        }
    }
    
    setRotation(rotation, smooth = true) {
        this.targetRotation = rotation;
        if (!smooth) {
            this.rotation = this.targetRotation;
        }
    }
    
    setBounds(minX, minY, maxX, maxY) {
        this.bounds = { minX, minY, maxX, maxY };
    }
    
    follow(target, offsetX = 0, offsetY = 0) {
        if (target && typeof target.x === 'number' && typeof target.y === 'number') {
            this.setTarget(
                target.x - this.width / 2 + offsetX,
                target.y - this.height / 2 + offsetY
            );
        }
    }
    
    shake(intensity = 10, duration = 500) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }
    
    update(deltaTime = 16) {
        // Smooth camera movement
        this.x += (this.targetX - this.x) * this.positionSmoothing;
        this.y += (this.targetY - this.y) * this.positionSmoothing;
        
        // Smooth zoom
        this.zoom += (this.targetZoom - this.zoom) * this.zoomSmoothing;
        
        // Smooth rotation
        this.rotation += (this.targetRotation - this.rotation) * this.rotationSmoothing;
        
        // Apply bounds if set
        if (this.bounds) {
            this.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX - this.width, this.x));
            this.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY - this.height, this.y));
        }
        
        // Update screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;
            const intensity = this.shakeIntensity * (this.shakeDuration / 500);
            this.shakeOffsetX = (Math.random() - 0.5) * intensity;
            this.shakeOffsetY = (Math.random() - 0.5) * intensity;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }
        
        // Update effects
        this.effects = this.effects.filter(effect => {
            effect.time += deltaTime;
            return effect.time < effect.duration;
        });
    }
    
    apply(ctx) {
        ctx.save();
        
        // Apply transformations
        ctx.translate(this.width / 2, this.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.rotate(this.rotation);
        ctx.translate(-this.width / 2, -this.height / 2);
        
        // Apply camera position and shake
        ctx.translate(
            -(this.x + this.shakeOffsetX),
            -(this.y + this.shakeOffsetY)
        );
    }
    
    restore(ctx) {
        ctx.restore();
    }
    
    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        const worldX = (screenX - this.width / 2) / this.zoom + this.x + this.width / 2;
        const worldY = (screenY - this.height / 2) / this.zoom + this.y + this.height / 2;
        return { x: worldX, y: worldY };
    }
    
    // Convert world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        const screenX = (worldX - this.x - this.width / 2) * this.zoom + this.width / 2;
        const screenY = (worldY - this.y - this.height / 2) * this.zoom + this.height / 2;
        return { x: screenX, y: screenY };
    }
    
    // Check if a point is visible on screen
    isVisible(x, y, margin = 0) {
        const screenPos = this.worldToScreen(x, y);
        return screenPos.x >= -margin && 
               screenPos.x <= this.width + margin &&
               screenPos.y >= -margin && 
               screenPos.y <= this.height + margin;
    }
    
    // Check if a rectangle is visible on screen
    isRectVisible(x, y, width, height, margin = 0) {
        const topLeft = this.worldToScreen(x, y);
        const bottomRight = this.worldToScreen(x + width, y + height);
        
        return !(bottomRight.x < -margin || 
                topLeft.x > this.width + margin ||
                bottomRight.y < -margin || 
                topLeft.y > this.height + margin);
    }
}

export class CameraEffects {
    constructor(camera) {
        this.camera = camera;
        this.flashAlpha = 0;
        this.flashColor = '#ffffff';
        this.fadeAlpha = 0;
        this.fadeColor = '#000000';
        this.chromaticAberration = 0;
        this.vignette = 0;
        this.scanlines = false;
        this.glitch = 0;
    }
    
    flash(color = '#ffffff', duration = 200) {
        this.flashColor = color;
        this.flashAlpha = 1;
        
        this.camera.effects.push({
            type: 'flash',
            time: 0,
            duration,
            update: (effect) => {
                this.flashAlpha = 1 - (effect.time / effect.duration);
            }
        });
    }
    
    fadeIn(color = '#000000', duration = 1000) {
        this.fadeColor = color;
        this.fadeAlpha = 1;
        
        this.camera.effects.push({
            type: 'fadeIn',
            time: 0,
            duration,
            update: (effect) => {
                this.fadeAlpha = 1 - (effect.time / effect.duration);
            }
        });
    }
    
    fadeOut(color = '#000000', duration = 1000) {
        this.fadeColor = color;
        this.fadeAlpha = 0;
        
        this.camera.effects.push({
            type: 'fadeOut',
            time: 0,
            duration,
            update: (effect) => {
                this.fadeAlpha = effect.time / effect.duration;
            }
        });
    }
    
    zoomPunch(intensity = 0.2, duration = 300) {
        const originalZoom = this.camera.zoom;
        const targetZoom = originalZoom * (1 + intensity);
        
        this.camera.effects.push({
            type: 'zoomPunch',
            time: 0,
            duration,
            update: (effect) => {
                const progress = effect.time / effect.duration;
                if (progress < 0.5) {
                    this.camera.zoom = originalZoom + (targetZoom - originalZoom) * (progress * 2);
                } else {
                    this.camera.zoom = targetZoom - (targetZoom - originalZoom) * ((progress - 0.5) * 2);
                }
            }
        });
    }
    
    enableChromaticAberration(intensity = 5) {
        this.chromaticAberration = intensity;
    }
    
    disableChromaticAberration() {
        this.chromaticAberration = 0;
    }
    
    enableVignette(intensity = 0.5) {
        this.vignette = Math.max(0, Math.min(1, intensity));
    }
    
    disableVignette() {
        this.vignette = 0;
    }
    
    enableScanlines() {
        this.scanlines = true;
    }
    
    disableScanlines() {
        this.scanlines = false;
    }
    
    glitchEffect(intensity = 1, duration = 100) {
        this.glitch = intensity;
        
        this.camera.effects.push({
            type: 'glitch',
            time: 0,
            duration,
            update: (effect) => {
                this.glitch = intensity * (1 - effect.time / effect.duration);
            }
        });
    }
    
    update(deltaTime) {
        // Update camera
        this.camera.update(deltaTime);
        
        // Update effects
        this.camera.effects.forEach(effect => {
            if (effect.update) {
                effect.update(effect);
            }
        });
    }
    
    render(ctx) {
        // Apply post-processing effects
        
        // Chromatic aberration (simplified version)
        if (this.chromaticAberration > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.1;
            ctx.filter = `hue-rotate(120deg)`;
            ctx.drawImage(ctx.canvas, this.chromaticAberration, 0);
            ctx.filter = `hue-rotate(-120deg)`;
            ctx.drawImage(ctx.canvas, -this.chromaticAberration, 0);
            ctx.restore();
        }
        
        // Vignette effect
        if (this.vignette > 0) {
            const gradient = ctx.createRadialGradient(
                this.camera.width / 2, this.camera.height / 2, 0,
                this.camera.width / 2, this.camera.height / 2, 
                Math.max(this.camera.width, this.camera.height) / 2
            );
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `rgba(0,0,0,${this.vignette})`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.camera.width, this.camera.height);
        }
        
        // Scanlines effect
        if (this.scanlines) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#000000';
            for (let y = 0; y < this.camera.height; y += 2) {
                ctx.fillRect(0, y, this.camera.width, 1);
            }
            ctx.restore();
        }
        
        // Glitch effect
        if (this.glitch > 0) {
            ctx.save();
            const sliceHeight = 10;
            for (let y = 0; y < this.camera.height; y += sliceHeight) {
                const offset = (Math.random() - 0.5) * this.glitch * 20;
                ctx.drawImage(
                    ctx.canvas,
                    0, y, this.camera.width, sliceHeight,
                    offset, y, this.camera.width, sliceHeight
                );
            }
            ctx.restore();
        }
        
        // Flash effect
        if (this.flashAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, this.camera.width, this.camera.height);
            ctx.restore();
        }
        
        // Fade effect
        if (this.fadeAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.fadeAlpha;
            ctx.fillStyle = this.fadeColor;
            ctx.fillRect(0, 0, this.camera.width, this.camera.height);
            ctx.restore();
        }
    }
}

// Export convenience function to create camera with effects
export function createCamera(width, height) {
    const camera = new Camera(width, height);
    const effects = new CameraEffects(camera);
    
    // Combine camera and effects into a single object
    return {
        camera,
        effects,
        update: (deltaTime) => effects.update(deltaTime),
        render: (ctx) => effects.render(ctx),
        apply: (ctx) => camera.apply(ctx),
        restore: (ctx) => camera.restore(ctx)
    };
}

export default { Camera, CameraEffects, createCamera };