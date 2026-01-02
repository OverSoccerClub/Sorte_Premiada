// Professional narrator system for Brazilian Portuguese lottery draws
// Optimized for speech synthesis with proper pronunciation and timing

type VoicePreference = {
    name: string;
    lang: string;
    priority: number;
    isMale: boolean;
};

// Brazilian Portuguese MALE voice preferences in priority order
const VOICE_PREFERENCES: VoicePreference[] = [
    // Male voices (highest priority)
    { name: 'Microsoft Daniel', lang: 'pt-BR', priority: 1, isMale: true },
    { name: 'Daniel', lang: 'pt-BR', priority: 2, isMale: true },
    { name: 'Daniel', lang: 'pt', priority: 3, isMale: true },
    { name: 'Google português do Brasil', lang: 'pt-BR', priority: 4, isMale: false }, // Google is neutral/female
    // Fallbacks
    { name: 'Ricardo', lang: 'pt', priority: 5, isMale: true },
    { name: 'Jorge', lang: 'pt', priority: 6, isMale: true },
];

// Number pronunciation map for proper Brazilian Portuguese
const NUMBER_WORDS: Record<string, string> = {
    '0': 'zero',
    '1': 'um',
    '2': 'dois',
    '3': 'três',
    '4': 'quatro',
    '5': 'cinco',
    '6': 'seis',
    '7': 'sete',
    '8': 'oito',
    '9': 'nove',
};

export class Narrator {
    private voice: SpeechSynthesisVoice | null = null;
    private isSpeaking: boolean = false;
    private voiceReady: Promise<void>;

    constructor() {
        this.voiceReady = new Promise((resolve) => {
            if (typeof window !== 'undefined') {
                // Try to get voices immediately
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    this.selectBestVoice(voices);
                    resolve();
                } else {
                    // Wait for voices to load
                    window.speechSynthesis.onvoiceschanged = () => {
                        this.selectBestVoice(window.speechSynthesis.getVoices());
                        resolve();
                    };
                }
            } else {
                resolve();
            }
        });
    }

    private selectBestVoice(voices: SpeechSynthesisVoice[]) {
        // Filter Portuguese voices
        const ptVoices = voices.filter(v =>
            v.lang.startsWith('pt') || v.lang.includes('pt-BR') || v.lang.includes('pt_BR')
        );

        console.log('[Narrator] Available PT voices:', ptVoices.map(v => `${v.name} (${v.lang})`));

        // Priority 1: Look for male voices by name
        const maleNames = ['daniel', 'ricardo', 'jorge', 'paulo', 'carlos', 'antonio', 'pedro'];
        const maleVoice = ptVoices.find(v =>
            maleNames.some(name => v.name.toLowerCase().includes(name))
        );

        if (maleVoice) {
            this.voice = maleVoice;
            console.log('[Narrator] Selected MALE voice:', maleVoice.name, maleVoice.lang);
            return;
        }

        // Priority 2: Try preference list
        for (const pref of VOICE_PREFERENCES) {
            const match = ptVoices.find(v =>
                v.name.toLowerCase().includes(pref.name.toLowerCase())
            );
            if (match) {
                this.voice = match;
                console.log('[Narrator] Selected voice from preferences:', match.name, match.lang);
                return;
            }
        }

        // Fallback: any PT-BR voice, then any PT voice, then first available
        this.voice = ptVoices.find(v => v.lang.includes('BR'))
            || ptVoices[0]
            || voices[0];

        console.log('[Narrator] Fallback voice:', this.voice?.name);
    }

    /**
     * Convert a digit string to its Portuguese pronunciation
     */
    pronounceDigit(digit: string): string {
        return NUMBER_WORDS[digit] || digit;
    }

    /**
     * Convert a 4-digit milhar to spoken form with pauses
     */
    pronounceMillhar(milhar: string): string {
        const padded = milhar.padStart(4, '0');
        return padded.split('').map(d => NUMBER_WORDS[d] || d).join(', ');
    }

    /**
     * Preprocess text for better pronunciation
     */
    preprocessText(text: string): string {
        let processed = text;

        // Replace standalone single digits
        processed = processed.replace(/\b(\d)\b/g, (_, d) => NUMBER_WORDS[d] || d);

        // Replace "Fezinha 01" style patterns
        processed = processed.replace(/Fezinha\s*0?(\d)/gi, (_, n) =>
            `Fezinha zero ${NUMBER_WORDS[n] || n}`
        );

        // Replace 4-digit milhars
        processed = processed.replace(/milhar[:\s]+(\d{4})/gi, (_, num) =>
            `milhar: ${this.pronounceMillhar(num)}`
        );

        return processed;
    }

    /**
     * Speaks the text and returns a Promise that resolves when speech is complete.
     */
    async speakAsync(text: string): Promise<void> {
        await this.voiceReady;

        return new Promise((resolve) => {
            if (typeof window === 'undefined') {
                resolve();
                return;
            }

            // Cancel any pending speech
            window.speechSynthesis.cancel();

            const processedText = this.preprocessText(text);
            const utterance = new SpeechSynthesisUtterance(processedText);

            if (this.voice) utterance.voice = this.voice;

            // Natural speech settings - faster and dynamic
            utterance.pitch = 1.1;
            utterance.rate = 1.15;  // Faster speaking pace
            utterance.volume = 1.0;
            utterance.lang = 'pt-BR';

            utterance.onend = () => {
                this.isSpeaking = false;
                resolve();
            };

            utterance.onerror = (e) => {
                console.error('[Narrator] Speech error:', e);
                this.isSpeaking = false;
                resolve();
            };

            this.isSpeaking = true;
            window.speechSynthesis.speak(utterance);
        });
    }

    /**
     * Speak text with a guaranteed minimum pause after
     */
    async speakWithPause(text: string, pauseMs: number = 1000): Promise<void> {
        await this.speakAsync(text);
        await this.wait(pauseMs);
    }

    /**
     * Speak multiple sentences with pauses between each
     */
    async speakSequence(sentences: string[], pauseBetween: number = 800): Promise<void> {
        for (let i = 0; i < sentences.length; i++) {
            await this.speakAsync(sentences[i]);
            if (i < sentences.length - 1) {
                await this.wait(pauseBetween);
            }
        }
    }

    private wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Legacy sync method
     */
    speak(text: string): number {
        if (typeof window === 'undefined') return 0;

        window.speechSynthesis.cancel();

        const processedText = this.preprocessText(text);
        const utterance = new SpeechSynthesisUtterance(processedText);
        if (this.voice) utterance.voice = this.voice;
        utterance.pitch = 1.1;
        utterance.rate = 1.05;
        utterance.lang = 'pt-BR';

        window.speechSynthesis.speak(utterance);
        return (processedText.length * 70) + 500;
    }

    getIsSpeaking(): boolean {
        return this.isSpeaking;
    }

    stop(): void {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
            this.isSpeaking = false;
        }
    }
}

export const narrator = new Narrator();
