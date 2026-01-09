const fs = require('fs');
const path = 'apps/mobile/android/app/build.gradle';
try {
    let c = fs.readFileSync(path, 'utf8');
    // Look for `bundleInRelease = false`
    if (c.includes('bundleInRelease = false')) {
        c = c.replace('react {\n    bundleInRelease = false', 'react {');
        // Fallback if formatting differed
        c = c.replace('bundleInRelease = false', '');
        fs.writeFileSync(path, c);
        console.log('Reverted bundleInRelease');
    } else {
        console.log('bundleInRelease not found');
    }
} catch (e) {
    console.error(e);
}
