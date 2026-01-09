const fs = require('fs');
const path = 'apps/mobile/android/app/build.gradle';
try {
    let c = fs.readFileSync(path, 'utf8');
    const target = 'entryFile = file("../../index.js")';
    const replacement = '// entryFile = file("../../index.js")';
    if (c.includes(target)) {
        c = c.replace(target, replacement);
        fs.writeFileSync(path, c);
        console.log('Successfully updated build.gradle');
    } else {
        console.log('Target string not found in build.gradle');
        console.log('Content preview:', c.substring(0, 500));
    }
} catch (e) {
    console.error('Error:', e);
    process.exit(1);
}
