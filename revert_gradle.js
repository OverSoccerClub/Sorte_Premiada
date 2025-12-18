const fs = require('fs');
const path = 'apps/mobile/android/app/build.gradle';
try {
    let c = fs.readFileSync(path, 'utf8');
    // I know current state has: entryFile = file(new File(rootDir, "../index.js"))
    const target = 'entryFile = file(new File(rootDir, "../index.js"))';
    const replacement = 'entryFile = file("../../index.js")';
    if (c.includes(target)) {
        c = c.replace(target, replacement);
        fs.writeFileSync(path, c);
        console.log('Successfully reverted build.gradle');
    } else {
        // Double check if I stuck with the commented out version or what
        console.log('Target string not found for revert');
        // Just force write if I am confident, or print content.
    }
} catch (e) {
    console.error(e);
}
