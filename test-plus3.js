
function testPlus3RandomUnique(firstNum) {
    console.log(`Testing Random Unique +3 for: ${firstNum.toString().padStart(4, '0')}`);

    const excludedCentenas = new Set();
    excludedCentenas.add(firstNum % 1000);

    const others = [];

    // Logic mimic from tickets.service.ts
    while (others.length < 3) {
        const candidate = Math.floor(Math.random() * 10000);
        const candidateCentena = candidate % 1000;

        if (candidate !== firstNum && !excludedCentenas.has(candidateCentena)) {
            if (!others.includes(candidate)) {
                others.push(candidate);
                excludedCentenas.add(candidateCentena);
            }
        }
    }

    const finalNumbers = [firstNum, ...others].sort((a, b) => a - b);
    console.log("Generated numbers:", finalNumbers.map(n => n.toString().padStart(4, '0')).join(", "));

    // Verification
    const centenas = finalNumbers.map(n => n % 1000);
    const uniqueCentenas = new Set(centenas);

    if (uniqueCentenas.size !== 4) {
        console.error("ERROR: Centenas are NOT unique!");
        console.error("Centenas found:", centenas);
    } else {
        console.log("OK: All 4 centenas are unique.");
    }

    // Check specific user constraint: "different termination from X"
    const originalTermination = firstNum % 1000;
    const violations = others.filter(n => n % 1000 === originalTermination);
    if (violations.length > 0) {
        console.error("ERROR: Found numbers with same termination as original!");
    } else {
        console.log("OK: No number shares termination with original.");
    }
}

console.log("--- TEST 1: 4715 ---");
testPlus3RandomUnique(4715);
console.log("\n--- TEST 2: 7436 ---");
testPlus3RandomUnique(7436);
console.log("\n--- TEST 3: 0000 ---");
testPlus3RandomUnique(0);
