
const BRAZIL_TZ = 'America/Sao_Paulo';

function getBrazilStartOfDay(date) {
    let dateObj;
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

    return new Date(`${brazilDateStr}T00:00:00.000-03:00`);
}

function getBrazilEndOfDay(date) {
    let dateObj;
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
}

const todayStr = "2026-02-05";
console.log("Input String:", todayStr);
console.log("Start of Day:", getBrazilStartOfDay(todayStr).toISOString());
console.log("End of Day  :", getBrazilEndOfDay(todayStr).toISOString());

const now = new Date(); // Assume it's currently Feb 5 in most parts of the world
console.log("\nInput Date (Now):", now.toISOString());
console.log("Start of Day (Now):", getBrazilStartOfDay(now).toISOString());
console.log("End of Day (Now)  :", getBrazilEndOfDay(now).toISOString());
