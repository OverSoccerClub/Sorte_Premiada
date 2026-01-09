const fs = require('fs');
const path = 'apps/mobile/android/app/build.gradle';
try {
    let c = fs.readFileSync(path, 'utf8');
    const target = 'entryFile = file(new File(rootDir, "../index.js"))';
    const replacement = 'entryFile = file("../../index.js")';
    // Actually I want to DISABLE BUNDLING now.
    // bundleInRelease: true -> bundleInRelease: false
    // But I must revert my absolute path change first AND then disable bundling?
    // Or just search for 'entryFile' line and comment it out AGAIN?
    // Or searching for 'project.ext.react = [' ...

    // Let's use a regex to find the react block or just append?
    // The previous state: I reverted it in Step 335.
    // So currently it has `entryFile = file("../../index.js")` (the default).

    // I need to add `bundleInRelease: false` inside `react { ... }`.

    if (c.includes('bundleInRelease: false')) {
        console.log('Already disabled');
    } else {
        // Look for `react {`
        if (c.includes('react {')) {
            c = c.replace('react {', 'react {\n    bundleInRelease = false');
            fs.writeFileSync(path, c);
            console.log('Disabled bundleInRelease');
        } else {
            console.log('Could not find react block');
        }
    }

} catch (e) {
    console.error(e);
}
