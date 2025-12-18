const fs = require('fs');
const path = 'apps/mobile/android/app/build.gradle';
try {
    let c = fs.readFileSync(path, 'utf8');
    const target = '// entryFile = file("../../index.js")';
    const replacement = 'entryFile = file(new File(rootDir, "../index.js"))';
    if (c.includes(target)) {
        c = c.replace(target, replacement);
        fs.writeFileSync(path, c);
        console.log('Successfully updated build.gradle with absolute path');
    } else {
        // Fallback in case I messed up previous step or content differs
        const altTarget = 'entryFile = file("../../index.js")';
        if (c.includes(altTarget)) {
            c = c.replace(altTarget, replacement);
            fs.writeFileSync(path, c);
            console.log('Successfully updated build.gradle with absolute path (from original)');
        } else {
            console.log('Target string not found');
        }
    }
} catch (e) {
    console.error(e);
}
