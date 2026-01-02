export class Narrator {
    private voice: SpeechSynthesisVoice | null = null;
    private isSpeaking: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.initVoice();
            window.speechSynthesis.onvoiceschanged = () => this.initVoice();
        }
    }

    private initVoice() {
        const voices = window.speechSynthesis.getVoices();
        // Prefer Portuguese voices - male preferred
        this.voice = voices.find(v =>
            v.lang.includes('pt') && (v.name.includes('Google') || v.name.includes('Daniel'))
        ) || voices.find(v => v.lang.includes('pt')) || voices[0];

        console.log('[Narrator] Selected voice:', this.voice?.name);
    }

    /**
     * Speaks the text and returns a Promise that resolves when speech is complete.
     * This ensures proper sequencing without overlap.
     */
    speakAsync(text: string): Promise<void> {
        return new Promise((resolve) => {
            if (typeof window === 'undefined') {
                resolve();
                return;
            }

            // Cancel any pending speech to avoid pile-up
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            if (this.voice) utterance.voice = this.voice;

            // More natural voice settings
            utterance.pitch = 1.0;
            utterance.rate = 0.9; // Slightly slower for drama
            utterance.volume = 1.0;

            utterance.onend = () => {
                this.isSpeaking = false;
                resolve();
            };

            utterance.onerror = (e) => {
                console.error('[Narrator] Speech error:', e);
                this.isSpeaking = false;
                resolve(); // Resolve anyway to not block the flow
            };

            this.isSpeaking = true;
            window.speechSynthesis.speak(utterance);
        });
    }

    /**
     * Legacy sync method - returns estimated duration (less accurate)
     */
    speak(text: string): number {
        if (typeof window === 'undefined') return 0;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;
        utterance.pitch = 1.0;
        utterance.rate = 0.9;

        window.speechSynthesis.speak(utterance);

        // Rough estimate: 80ms per character + base
        return (text.length * 80) + 1000;
    }

    getIsSpeaking(): boolean {
        return this.isSpeaking;
    }
}

export const narrator = new Narrator();
