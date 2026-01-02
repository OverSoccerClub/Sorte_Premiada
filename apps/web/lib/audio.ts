// Professional narrator system for Brazilian Portuguese lottery draws
// Optimized for speech synthesis with proper pronunciation and timing

type VoicePreference = {
    name: string;
    lang: string;
    priority: number;
};

// Brazilian Portuguese voice preferences in priority order
const VOICE_PREFERENCES: VoicePreference[] = [
    { name: 'Google português do Brasil', lang: 'pt-BR', priority: 1 },
    { name: 'Microsoft Daniel', lang: 'pt-BR', priority: 2 },
    { name: 'Luciana', lang: 'pt-BR', priority: 3 },
    { name: 'Daniel', lang: 'pt', priority: 4 },
    { name: 'Google', lang: 'pt', priority: 5 },
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

// Full number pronunciation for complete milhares
const FULL_NUMBER_PRONUNCIATION: Record<string, string> = {
    '00': 'zero zero',
    '01': 'zero um',
    '02': 'zero dois',
    '03': 'zero três',
    '04': 'zero quatro',
    '05': 'zero cinco',
    '06': 'zero seis',
    '07': 'zero sete',
    '08': 'zero oito',
    '09': 'zero nove',
    '10': 'dez',
    '11': 'onze',
    '12': 'doze',
    '13': 'treze',
    '14': 'quatorze',
    '15': 'quinze',
    '16': 'dezesseis',
    '17': 'dezessete',
    '18': 'dezoito',
    '19': 'dezenove',
    '20': 'vinte',
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

        // Try to find voice by preference order
        for (const pref of VOICE_PREFERENCES) {
            const match = ptVoices.find(v =>
                v.name.toLowerCase().includes(pref.name.toLowerCase()) ||
                (v.lang.includes(pref.lang) && v.name.toLowerCase().includes('google'))
            );
            if (match) {
                this.voice = match;
                console.log('[Narrator] Selected voice:', match.name, match.lang);
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
     * e.g., "1234" -> "um... dois... três... quatro"
     */
    pronounceMillhar(milhar: string): string {
        const padded = milhar.padStart(4, '0');
        return padded.split('').map(d => NUMBER_WORDS[d] || d).join('... ');
    }

    /**
     * Preprocess text for better pronunciation
     * - Converts standalone digits to words
     * - Adds natural pauses for ellipsis
     * - Fixes common pronunciation issues
     */
    preprocessText(text: string): string {
        let processed = text;

        // Replace digit sequences that should be spoken as individual numbers
        // Pattern: standalone single digits or digit sequences
        processed = processed.replace(/\b(\d)\b/g, (_, d) => NUMBER_WORDS[d] || d);

        // Replace "Fezinha 01" style patterns
        processed = processed.replace(/Fezinha\s*0?(\d)/gi, (_, n) =>
            `Fezinha zero ${NUMBER_WORDS[n] || n}`
        );

        // Replace 4-digit milhars when spoken (e.g., "milhar 1234")
        processed = processed.replace(/milhar[:\s]+(\d{4})/gi, (_, num) =>
            `milhar: ${this.pronounceMillhar(num)}`
        );

        // Natural pauses - convert multiple dots to single pause marker
        processed = processed.replace(/\.{2,}/g, '...');

        return processed;
    }

    /**
     * Speaks the text and returns a Promise that resolves when speech is complete.
     * This ensures proper sequencing without overlap.
     */
    async speakAsync(text: string): Promise<void> {
        await this.voiceReady;

        return new Promise((resolve) => {
            if (typeof window === 'undefined') {
                resolve();
                return;
            }

            // Cancel any pending speech to avoid pile-up
            window.speechSynthesis.cancel();

            // Preprocess text for better pronunciation
            const processedText = this.preprocessText(text);

            const utterance = new SpeechSynthesisUtterance(processedText);
            if (this.voice) utterance.voice = this.voice;

            // Optimized settings for professional TV-style delivery
            utterance.pitch = 1.0;
            utterance.rate = 0.85; // Slower for dramatic effect and clarity
            utterance.volume = 1.0;
            utterance.lang = 'pt-BR';

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

    /**
     * Utility wait function
     */
    private wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Legacy sync method - returns estimated duration (less accurate)
     */
    speak(text: string): number {
        if (typeof window === 'undefined') return 0;

        window.speechSynthesis.cancel();

        const processedText = this.preprocessText(text);
        const utterance = new SpeechSynthesisUtterance(processedText);
        if (this.voice) utterance.voice = this.voice;
        utterance.pitch = 1.0;
        utterance.rate = 0.85;
        utterance.lang = 'pt-BR';

        window.speechSynthesis.speak(utterance);

        // Rough estimate: 100ms per character + base (slower rate)
        return (processedText.length * 100) + 1000;
    }

    getIsSpeaking(): boolean {
        return this.isSpeaking;
    }

    /**
     * Stop any current speech
     */
    stop(): void {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
            this.isSpeaking = false;
        }
    }
}

export const narrator = new Narrator();
