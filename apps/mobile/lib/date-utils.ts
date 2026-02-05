/**
 * Utilitários de Data para Mobile (Brasil Timezone - UTC-3)
 * Utiliza Intl nativo para evitar dependências extras como dayjs/moment
 */

const BRAZIL_TZ = 'America/Sao_Paulo';

/**
 * Retorna a data atual formatada como string ISO (YYYY-MM-DD) no fuso do Brasil
 */
export const getBrazilToday = (): string => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: BRAZIL_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    // Format parts to ensure YYYY-MM-DD
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    return `${year}-${month}-${day}`;
};

/**
 * Retorna o objeto Date atual ajustado visualmente para o fuso do Brasil
 * (Útil para exibir em componentes que aceitam Date mas ignoram TZ)
 */
export const getBrazilNowDate = (): Date => {
    // Hack para criar um Date que "parece" estar no fuso certo quando impresso localmente
    // Ideal para componentes visuais simples
    return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TZ }));
};

/**
 * Formata uma data para exibição no padrão brasileiro
 * @param date Data (Date, string ou number)
 * @param options Opções de formatação Intl
 */
export const formatBrazilDate = (
    date: Date | string | number | undefined,
    options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }
): string => {
    if (!date) return '';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: BRAZIL_TZ,
        ...options
    }).format(dateObj);
};

/**
 * Retorna o início do dia no Brasil como objeto Date
 * @param date Data base (Date ou string YYYY-MM-DD)
 */
export const getBrazilStartOfDay = (date?: Date | string): Date => {
    let dateObj: Date;
    if (date instanceof Date) {
        dateObj = date;
    } else if (typeof date === 'string') {
        dateObj = new Date(date);
    } else {
        dateObj = new Date();
    }

    // Obter representação da data no Brasil: YYYY-MM-DD
    const brazilDateStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: BRAZIL_TZ
    }).format(dateObj);

    // Retorna meia-noite nesse dia no fuso BRT (-03:00)
    // Se passarmos apenas a data YYYY-MM-DD, o construtor Date(string) em alguns ambientes
    // assume UTC, o que no Brasil (-3) resulta nas 21:00 do dia anterior.
    // Explicitamos o fuso -03:00 para garantir consistência.
    return new Date(`${brazilDateStr}T00:00:00.000-03:00`);
};

/**
 * Retorna o fim do dia no Brasil como objeto Date
 * @param date Data base (Date ou string YYYY-MM-DD)
 */
export const getBrazilEndOfDay = (date?: Date | string): Date => {
    let dateObj: Date;
    if (date instanceof Date) {
        dateObj = date;
    } else if (typeof date === 'string') {
        dateObj = new Date(date);
    } else {
        dateObj = new Date();
    }

    const brazilDateStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: BRAZIL_TZ
    }).format(dateObj);

    return new Date(`${brazilDateStr}T23:59:59.999-03:00`);
};

/**
 * Verifica se uma data é "hoje" no Brasil
 */
export const isBrazilToday = (date: Date | string): boolean => {
    if (!date) return false;
    const d = new Date(date);
    if (isNaN(d.getTime())) return false;

    const today = getBrazilToday(); // YYYY-MM-DD

    const formatter = new Intl.DateTimeFormat('en-CA', { // YYYY-MM-DD
        timeZone: BRAZIL_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    return formatter.format(d) === today;
};
