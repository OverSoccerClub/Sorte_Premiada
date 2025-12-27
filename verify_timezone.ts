
function testLogic() {
    const extractionTimes = ['08:15', '11:30', '12:35'];

    // Simulate "Now" as Dec 27, 10:25 AM Brazil Time
    // Brazil is UTC-3. So 10:25 Brazil = 13:25 UTC.
    const now = new Date('2025-12-27T13:25:00Z');
    console.log("Mock Now (UTC):", now.toISOString());
    console.log("Mock Now (Brazil): 10:25 (approx)");

    const createBrazilDrawDate = (timeStr, baseBrazilDate) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return new Date(Date.UTC(
            baseBrazilDate.getUTCFullYear(),
            baseBrazilDate.getUTCMonth(),
            baseBrazilDate.getUTCDate(),
            hours + 3,
            minutes,
            0,
            0
        ));
    };

    const CUTOFF_MINUTES = 10;
    const brazilNow = new Date(now.getTime() - 3 * 3600000);
    // brazilNow should be 10:25 "Fake UTC"
    console.log("Brazil Now Object (Fake UTC):", brazilNow.toISOString());

    extractionTimes.sort();

    for (const timeStr of extractionTimes) {
        const drawDate = createBrazilDrawDate(timeStr, brazilNow);
        const cutoffDate = new Date(drawDate.getTime() - (CUTOFF_MINUTES - 1) * 60000);

        console.log(`Checking Slot ${timeStr}:`);
        console.log(`  Draw Date (UTC): ${drawDate.toISOString()} (Expected Brazil: ${timeStr})`);
        console.log(`  Cutoff (UTC): ${cutoffDate.toISOString()}`);
        console.log(`  Now < Cutoff? ${now < cutoffDate}`);

        if (now < cutoffDate) {
            console.log("  >>> MATCH!");
            return drawDate;
        }
    }

    console.log("  >>> NO MATCH TODAY. Trying Tomorrow.");
    const tomorrowBrazil = new Date(brazilNow);
    tomorrowBrazil.setUTCDate(tomorrowBrazil.getUTCDate() + 1);
    const nextDay = createBrazilDrawDate(extractionTimes[0], tomorrowBrazil);
    console.log("  Next Day Draw (UTC):", nextDay.toISOString());
    return nextDay;
}

testLogic();
