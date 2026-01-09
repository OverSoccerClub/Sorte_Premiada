
// Mock of the logic inside TicketsService

function getNextDrawDate(extractionTimes: string[], now: Date): Date {
    // Helper to parse time string "HH:MM"
    const parseTime = (timeStr: string, baseDate: Date) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date(baseDate);
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const CUTOFF_MINUTES = 10;

    // Sort times to ensure we check in order
    extractionTimes.sort();

    // Check for today's draws
    for (const timeStr of extractionTimes) {
        const drawDate = parseTime(timeStr, now);

        // Logic from Service
        const cutoffDate = new Date(drawDate.getTime() - (CUTOFF_MINUTES - 1) * 60000);

        // Debug
        // console.log(`Checking ${timeStr} (Draw: ${drawDate.toISOString()}) | Cutoff: ${cutoffDate.toISOString()} | Now: ${now.toISOString()}`);

        if (now < cutoffDate) {
            return drawDate;
        }
    }

    // If no slot found today, return first slot of tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return parseTime(extractionTimes[0], tomorrow);
}

const times = ['08:00', '11:00', '16:00'];

const testCases = [
    { nowStr: '2023-12-25T07:45:00', expectedTime: '08:00' },
    { nowStr: '2023-12-25T07:50:59', expectedTime: '08:00' },
    { nowStr: '2023-12-25T07:51:00', expectedTime: '11:00' }, // The boundary!
    { nowStr: '2023-12-25T10:50:00', expectedTime: '11:00' },
    { nowStr: '2023-12-25T10:51:00', expectedTime: '16:00' },
    { nowStr: '2023-12-25T15:51:00', expectedTime: '08:00' }, // Next day!
];

console.log("--- Starting Verification ---");
let passed = 0;
testCases.forEach((tc, idx) => {
    const now = new Date(tc.nowStr);
    const result = getNextDrawDate(times, now);
    const resultTime = result.getHours().toString().padStart(2, '0') + ':' + result.getMinutes().toString().padStart(2, '0');

    // Check if day is correct for next day case
    const isNextDay = result.getDate() !== now.getDate();
    const resultStr = `${resultTime}${isNextDay ? ' (Next Day)' : ''}`;

    const expectedHour = tc.expectedTime.split(':')[0];
    // Simple check: matches expected time string
    if (resultTime === tc.expectedTime) {
        // Special check for next day
        if (tc.expectedTime === '08:00' && tc.nowStr.includes('15:51')) {
            if (isNextDay) {
                console.log(`[PASS] Case ${idx + 1}: ${tc.nowStr} -> ${resultStr}`);
                passed++;
            } else {
                console.log(`[FAIL] Case ${idx + 1}: ${tc.nowStr} -> ${resultStr} (Expected Next Day)`);
            }
        } else {
            console.log(`[PASS] Case ${idx + 1}: ${tc.nowStr} -> ${resultStr}`);
            passed++;
        }
    } else {
        console.log(`[FAIL] Case ${idx + 1}: ${tc.nowStr} -> ${resultStr} (Expected ${tc.expectedTime})`);
    }
});

console.log(`--- Result: ${passed}/${testCases.length} Passed ---`);
