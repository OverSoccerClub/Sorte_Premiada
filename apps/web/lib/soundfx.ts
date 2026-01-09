// Sound effects system for the lottery draw simulator
// Uses Web Audio API to generate sounds programmatically

class SoundEffects {
    private audioContext: AudioContext | null = null;
    private spinOscillator: OscillatorNode | null = null;
    private spinGain: GainNode | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            // Will initialize on first user interaction
        }
    }

    private getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    private spinInterval: ReturnType<typeof setInterval> | null = null;
    private spinTimeout: ReturnType<typeof setTimeout> | null = null;

    /**
     * Start spinning sound - realistic casino roulette wheel with ball bouncing
     */
    startSpinSound(): void {
        try {
            const ctx = this.getContext();

            // Stop any existing spin sound
            this.stopSpinSound();

            // Roulette wheel sound: ball bouncing on pockets with decreasing interval
            let interval = 80; // Start fast
            let volume = 0.12;

            const playTick = () => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                // Wooden tick sound
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600 + Math.random() * 100, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);

                gain.gain.setValueAtTime(volume, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.06);
            };

            // Play ticks with slight speed variation (like ball bouncing)
            const scheduleTick = () => {
                playTick();

                // Randomly vary the interval slightly for more realistic feel
                const variance = interval * 0.1;
                const nextInterval = interval + (Math.random() * variance - variance / 2);

                this.spinTimeout = setTimeout(scheduleTick, nextInterval);
            };

            scheduleTick();

        } catch (e) {
            console.warn('[SoundFX] Could not start spin sound:', e);
        }
    }

    /**
     * Stop the spinning sound
     */
    stopSpinSound(): void {
        try {
            if (this.spinTimeout) {
                clearTimeout(this.spinTimeout);
                this.spinTimeout = null;
            }
            if (this.spinInterval) {
                clearInterval(this.spinInterval);
                this.spinInterval = null;
            }
            if (this.spinOscillator) {
                this.spinOscillator.stop();
                this.spinOscillator.disconnect();
                this.spinOscillator = null;
            }
            if (this.spinGain) {
                this.spinGain.disconnect();
                this.spinGain = null;
            }
        } catch (e) {
            // Ignore errors when stopping
        }
    }

    /**
     * Play "plim" reveal sound
     */
    playRevealSound(): void {
        try {
            const ctx = this.getContext();

            // Create a pleasant "ding" sound
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            // Two harmonics for a richer "plim" sound
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(1200, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1800, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

            // Quick attack, medium decay
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start(ctx.currentTime);
            osc2.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.4);
            osc2.stop(ctx.currentTime + 0.4);

        } catch (e) {
            console.warn('[SoundFX] Could not play reveal sound:', e);
        }
    }

    /**
     * Play winner celebration sound (fanfare + applause effect)
     */
    playWinnerSound(): void {
        try {
            const ctx = this.getContext();

            // Create a celebratory fanfare
            const playNote = (freq: number, startTime: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

                gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
                gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + startTime + 0.05);
                gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + startTime + duration - 0.1);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + startTime);
                osc.stop(ctx.currentTime + startTime + duration);
            };

            // Victory fanfare melody
            playNote(523, 0, 0.15);      // C5
            playNote(659, 0.15, 0.15);   // E5
            playNote(784, 0.3, 0.15);    // G5
            playNote(1047, 0.45, 0.4);   // C6 (held)

            // Add "applause" noise effect
            const noise = ctx.createBufferSource();
            const noiseGain = ctx.createGain();
            const noiseFilter = ctx.createBiquadFilter();

            // Create noise buffer
            const bufferSize = ctx.sampleRate * 2; // 2 seconds
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.5;
            }

            noise.buffer = buffer;

            // Filter to make it sound more like applause
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(2000, ctx.currentTime);
            noiseFilter.Q.setValueAtTime(0.5, ctx.currentTime);

            // Fade in and out for applause effect
            noiseGain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
            noiseGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.6);
            noiseGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.5);
            noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            noise.start(ctx.currentTime + 0.3);
            noise.stop(ctx.currentTime + 2.5);

        } catch (e) {
            console.warn('[SoundFX] Could not play winner sound:', e);
        }
    }

    /**
     * Play a simple beep for countdown
     */
    playCountdownBeep(): void {
        try {
            const ctx = this.getContext();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);

        } catch (e) {
            console.warn('[SoundFX] Could not play countdown beep:', e);
        }
    }

    /**
     * Play "go" sound for countdown end
     */
    playGoSound(): void {
        try {
            const ctx = this.getContext();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, ctx.currentTime);
            osc.frequency.setValueAtTime(784, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.2);

            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);

        } catch (e) {
            console.warn('[SoundFX] Could not play go sound:', e);
        }
    }
}

export const soundFX = new SoundEffects();
