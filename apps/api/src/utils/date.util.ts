import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const BRAZIL_TZ = 'America/Sao_Paulo';

/**
 * Returns the current date/time in Brazil Timezone
 */
export function getBrazilTime(): dayjs.Dayjs {
    return dayjs().tz(BRAZIL_TZ);
}

/**
 * Parses a date string or object effectively as strictly Brazil Time, 
 * preserving the "face value" of the date even if the input was UTC or another zone.
 * 
 * Example: Input "2023-12-25T10:00:00Z" (which is treated as 10:00 UTC usually)
 * This function will return a Dayjs object that represents 10:00 IN BRAZIL (which is 13:00 UTC).
 * 
 * This is useful when the input string is meant to be "Wall Clock Time in Brazil" but comes in as ISO/UTC.
 */
export function toBrazilTime(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
    if (!date) return getBrazilTime();

    // If it's already a dayjs object, convert to target zone
    if (dayjs.isDayjs(date)) {
        return date.tz(BRAZIL_TZ);
    }

    // If string is simple ISO "YYYY-MM-DDTHH:mm:ss", parse it directly in the zone
    // dayjs.tz(string, zone) tries to parse strictly in that zone logic
    return dayjs.tz(date, BRAZIL_TZ);
}

/**
 * Converts a Brazil Time dayjs/date back to a native JS Date (which will be UTC based, but correct instant).
 */
export function toDate(date: dayjs.Dayjs): Date {
    return date.toDate();
}

/**
 * Helper to get strictly "Today" start in Brazil
 * Returns a native Date object effectively corresponding to YYYY-MM-DDT00:00:00.000-03:00
 */
export function getBrazilStartOfDay(date?: Date | string): Date {
    const d = date ? toBrazilTime(date) : getBrazilTime();
    return d.startOf('day').toDate();
}

/**
 * Helper to get strictly "Today" end in Brazil
 * Returns a native Date object effectively corresponding to YYYY-MM-DDT23:59:59.999-03:00
 */
export function getBrazilEndOfDay(date?: Date | string): Date {
    const d = date ? toBrazilTime(date) : getBrazilTime();
    return d.endOf('day').toDate();
}

export { dayjs };
