export class Narrator {
    private synthesis: SpeechSynthesis;
    private voice: SpeechSynthesisVoice | null = null;
    private voicesLoaded: boolean = false;

    constructor() {
        if (typeof window !== "undefined") {
            this.synthesis = window.speechSynthesis;
            this.loadVoice();
            if (this.synthesis.onvoiceschanged !== undefined) {
                this.synthesis.onvoiceschanged = () => this.loadVoice();
            }
        } else {
            // Server-side fallback (mock)
            this.synthesis = { speak: () => { }, cancel: () => { }, getVoices: () => [] } as any;
        }
    }

    private loadVoice() {
        if (this.voicesLoaded) return;

        const voices = this.synthesis.getVoices();
        // Prefer Google Português or any PT-BR
        this.voice =
            voices.find(v => v.name.includes("Google") && v.lang.includes("pt-BR")) ||
            voices.find(v => v.lang.includes("pt-BR")) ||
            voices[0];

        if (voices.length > 0) this.voicesLoaded = true;
    }

    public speak(text: string) {
        if (!this.synthesis) return;

        // Cancel previous
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;

        utterance.rate = 1.1; // Slightly faster for excitement
        utterance.pitch = 1.0;
        utterance.lang = "pt-BR";

        this.synthesis.speak(utterance);
    }

    public cancel() {
        this.synthesis?.cancel();
    }
}

export const narrator = new Narrator();
