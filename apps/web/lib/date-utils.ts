import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const BRAZIL_TZ = 'America/Sao_Paulo';

/**
 * Get current date/time in Brazil timezone
 */
export function getBrazilTime() {
    return dayjs().tz(BRAZIL_TZ);
}

/**
 * Convert a date to Brazil timezone
 */
export function toBrazilTime(date: string | Date | dayjs.Dayjs) {
    if (!date) return getBrazilTime();
    return dayjs(date).tz(BRAZIL_TZ);
}

/**
 * Format a date in Brazil timezone
 * @param date - Date to format
 * @param format - Format string (default: 'DD/MM/YYYY HH:mm')
 */
export function formatBrazilDate(date: string | Date | dayjs.Dayjs, format: string = 'DD/MM/YYYY HH:mm') {
    return toBrazilTime(date).format(format);
}

/**
 * Get start of day (00:00:00) in Brazil timezone
 * @param date - Optional date (defaults to today)
 * @returns ISO string representing start of day in Brazil timezone
 */
export function getBrazilStartOfDay(date?: string | Date | dayjs.Dayjs): string {
    const d = date ? toBrazilTime(date) : getBrazilTime();
    return d.startOf('day').toISOString();
}

/**
 * Get end of day (23:59:59.999) in Brazil timezone
 * @param date - Optional date (defaults to today)
 * @returns ISO string representing end of day in Brazil timezone
 */
export function getBrazilEndOfDay(date?: string | Date | dayjs.Dayjs): string {
    const d = date ? toBrazilTime(date) : getBrazilTime();
    return d.endOf('day').toISOString();
}

/**
 * Get current date in YYYY-MM-DD format (Brazil timezone)
 * Useful for initializing date inputs
 */
export function getBrazilToday(): string {
    return getBrazilTime().format('YYYY-MM-DD');
}

/**
 * Convert a YYYY-MM-DD string to start of day ISO string (Brazil timezone)
 * @param dateString - Date string in YYYY-MM-DD format
 */
export function dateStringToStartOfDay(dateString: string): string {
    return getBrazilStartOfDay(dateString);
}

/**
 * Convert a YYYY-MM-DD string to end of day ISO string (Brazil timezone)
 * @param dateString - Date string in YYYY-MM-DD format
 */
export function dateStringToEndOfDay(dateString: string): string {
    return getBrazilEndOfDay(dateString);
}

export { dayjs };
