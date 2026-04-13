/**
 * SkyLab Humanizer Engine v2.0
 * 
 * Este módulo se encarga de transformar una respuesta cruda de LLM en una secuencia 
 * de fragmentos con tiempos de entrega realistas basados en WPM (Words Per Minute)
 * y patrones de escritura humana.
 */

export interface HumanizedFragment {
    text: string;
    delayMs: number;
    typingMs: number;
}

export interface HumanizerConfig {
    wordsPerMinute: number;
    maxCharsPerFragment: number;
    jitter: number; // 0 to 1, factor de aleatoriedad
}

const DEFAULT_CONFIG: HumanizerConfig = {
    wordsPerMinute: 50,
    maxCharsPerFragment: 250,
    jitter: 0.2
};

export class Humanizer {
    private config: HumanizerConfig;

    constructor(config?: Partial<HumanizerConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Calcula el tiempo de escritura basado en la longitud del texto y WPM.
     * Simula que un humano escribe a una velocidad constante con un poco de ruido.
     */
    private calculateTypingTime(text: string): number {
        const words = text.split(/\s+/).length;
        const baseMs = (words / this.config.wordsPerMinute) * 60 * 1000;
        
        // Añadir jitter (aleatoriedad)
        const jitterMs = baseMs * (Math.random() * 2 - 1) * this.config.jitter;
        return Math.max(800, Math.floor(baseMs + jitterMs)); // Mínimo 800ms para que se note
    }

    /**
     * Divide un texto largo en fragmentos lógicos.
     * Busca puntos, signos de exclamación/interrogación o saltos de línea.
     */
    split(text: string): string[] {
        if (!text) return [];
        
        // Regex para dividir por oraciones pero manteniendo el delimitador
        // Dividimos por: . , ! , ? seguido de espacio o fin de línea, o por saltos de línea dobles
        const parts = text.split(/(?<=[.!?])\s+|\n\n+/);
        
        const fragments: string[] = [];
        let currentFragment = "";

        for (const part of parts) {
            const trimmedPart = part.trim();
            if (!trimmedPart) continue;

            // Si añadir esta parte excede el máximo, guardamos el actual y empezamos uno nuevo
            if (currentFragment && (currentFragment.length + trimmedPart.length > this.config.maxCharsPerFragment)) {
                fragments.push(currentFragment.trim());
                currentFragment = trimmedPart;
            } else {
                currentFragment += (currentFragment ? " " : "") + trimmedPart;
            }
        }

        if (currentFragment) {
            fragments.push(currentFragment.trim());
        }

        return fragments;
    }

    /**
     * Genera la secuencia completa de entrega.
     */
    getSequence(text: string): HumanizedFragment[] {
        const textFragments = this.split(text);
        
        return textFragments.map((fragment, index) => {
            const typingTime = this.calculateTypingTime(fragment);
            
            // El delay antes de empezar a "escribir" el siguiente fragmento
            // El primer fragmento tiene un delay pequeño de "reacción"
            const delayMs = index === 0 ? 1000 : 1500 + (Math.random() * 1000);

            return {
                text: fragment,
                delayMs,
                typingMs: typingTime
            };
        });
    }
}
