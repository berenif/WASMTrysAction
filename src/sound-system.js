/**
 * Sound System Module
 * Handles all audio playback and sound effects for the game
 */

export class SoundSystem {
    constructor() {
        this.sounds = new Map();
        this.audioContext = null;
        this.masterVolume = 1.0;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.currentMusic = null;
        
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }
    
    async loadSound(name, url) {
        if (!this.audioContext) return;
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds.set(name, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound ${name}:`, error);
        }
    }
    
    playSound(name, options = {}) {
        if (!this.soundEnabled || !this.audioContext || !this.sounds.has(name)) return;
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.sounds.get(name);
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const volume = (options.volume || 1.0) * this.masterVolume;
        gainNode.gain.value = volume;
        
        source.loop = options.loop || false;
        source.playbackRate.value = options.pitch || 1.0;
        
        source.start(0);
        
        return source;
    }
    
    playMusic(name, options = {}) {
        if (!this.musicEnabled) return;
        
        // Stop current music if playing
        if (this.currentMusic) {
            this.currentMusic.stop();
        }
        
        options.loop = true;
        options.volume = options.volume || 0.5;
        this.currentMusic = this.playSound(name, options);
        
        return this.currentMusic;
    }
    
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        }
        return this.musicEnabled;
    }
    
    // Predefined sound effects
    async loadDefaultSounds() {
        // These would normally load actual sound files
        // For now, we'll create simple synthesized sounds
        const sounds = {
            'hit': { frequency: 200, duration: 0.1, type: 'square' },
            'pickup': { frequency: 800, duration: 0.2, type: 'sine' },
            'explosion': { frequency: 100, duration: 0.5, type: 'sawtooth' },
            'jump': { frequency: 400, duration: 0.15, type: 'triangle' },
            'shoot': { frequency: 600, duration: 0.05, type: 'square' }
        };
        
        for (const [name, params] of Object.entries(sounds)) {
            this.createSynthSound(name, params);
        }
    }
    
    createSynthSound(name, params) {
        if (!this.audioContext) return;
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = params.duration;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const envelope = 1 - (t / duration); // Simple linear decay
            
            let sample = 0;
            switch (params.type) {
                case 'sine':
                    sample = Math.sin(2 * Math.PI * params.frequency * t);
                    break;
                case 'square':
                    sample = Math.sin(2 * Math.PI * params.frequency * t) > 0 ? 1 : -1;
                    break;
                case 'sawtooth':
                    sample = 2 * ((params.frequency * t) % 1) - 1;
                    break;
                case 'triangle':
                    sample = 4 * Math.abs(((params.frequency * t) % 1) - 0.5) - 1;
                    break;
            }
            
            data[i] = sample * envelope * 0.3; // Apply envelope and reduce volume
        }
        
        this.sounds.set(name, buffer);
    }
}

// Export a singleton instance
export const soundSystem = new SoundSystem();
export default SoundSystem;