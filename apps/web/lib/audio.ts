export class Narrator {
    private voice: SpeechSynthesisVoice | null = null;
    private pitch: number = 1.0;
    private rate: number = 0.9; // Slower rate by default for TV style

    constructor() {
        if (typeof window !== 'undefined') {
            this.initVoice();
            window.speechSynthesis.onvoiceschanged = () => this.initVoice();
        }
    }

    private initVoice() {
        const voices = window.speechSynthesis.getVoices();
        // Prefer Male voices for the new character as requested
        this.voice = voices.find(v =>
            (v.name.includes("Google Português") && !v.name.includes("Female")) ||
            v.name.includes("Daniel") ||
            (v.lang === 'pt-BR' && v.name.includes("Male"))
        ) || voices.find(v => v.lang === 'pt-BR') || voices[0];
    }

    /*
     * Speaks the text and returns an estimated duration in ms
     */
    speak(text: string): number {
        if (typeof window === 'undefined') return 0;

        // Cancel previous to ensure clean start if needed, 
        // OR let it queue. For "TV Show" strict pacing, cancelling might be safer to avoid backlog,
        // BUT user complained of overlapping. We will queue but manage the *flow* logic to wait.
        // Actually, let's Cancel to ensure we are in the "Now".
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;

        // Pacing adjustments
        utterance.pitch = 1.1; // Slightly higher for "Pixar/Cute" character? Or professional? User said "voice matching characteristics".
        // Pixar usually implies clear, slightly expressive/animated voice.
        utterance.rate = 0.85; // Clear and deliberate.

        window.speechSynthesis.speak(utterance);

        // Estimate duration: 
        // Average speaking rate ~150 words/minute => ~2.5 words/sec.
        // Average word length in PT ~5-6 chars. 
        // Rough calc: ~15 chars per second (very rough).
        // Let's be conservative: 10 chars per second (100ms per char) + base 500ms.
        const duration = (text.length * 90) + 800; // 90ms per char + 800ms buffer
        return duration;
    }
}

export const narrator = new Narrator();
