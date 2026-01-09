import { toBrazilTime, getBrazilTime, dayjs } from './src/utils/date.util';

console.log("--- Timezone Verification Script ---");

// 1. Current Time
const now = getBrazilTime();
console.log(`Current Brazil Time: ${now.format()}`);
console.log(`Native UTC Date:     ${now.toDate().toISOString()}`);

// 2. Test specific input "10:00"
// Scenario: Admin inputs "2025-10-20T10:00:00.000Z" meaning 10:00 AM Brazil
const inputStr = "2025-10-20T10:00:00";
// Note: if input has "Z", dayjs might confuse it. We assume inputs from front might be unaware ISOs.

const fixed = toBrazilTime(inputStr);
console.log(`\nInput String:        ${inputStr}`);
console.log(`Interpreted Brazil:  ${fixed.format()}`);
console.log(`Resulting UTC:       ${fixed.toDate().toISOString()}`);

// Check correct mapping: 10:00 BRT should be 13:00 UTC
const hourDiff = fixed.utcOffset();
console.log(`UTC Offset:          ${hourDiff} minutes`);

if (fixed.hour() !== 10) {
    console.error("FAIL: Hour should be 10!");
} else {
    console.log("PASS: Hour preserved as 10.");
}

console.log("\n--- Comparison Test ---");
const nowFake = dayjs.tz("2025-12-27T10:25:00", "America/Sao_Paulo"); // Setup mock "Now"
const drawTime = dayjs.tz("2025-12-27T12:00:00", "America/Sao_Paulo"); // Draw at 12:00

console.log(`Mock Now (Brazil):   ${nowFake.format()}`);
console.log(`Draw Time (Brazil):  ${drawTime.format()}`);

const diff = drawTime.diff(nowFake, 'minutes');
console.log(`Minutes until Draw:  ${diff}`);

if (diff > 0) {
    console.log("PASS: Draw is in the future.");
} else {
    console.error("FAIL: Draw is considered past/now.");
}
