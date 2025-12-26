const fs = require('fs');
const path = require('path');

const targetPath = path.join('apps', 'mobile', 'android', 'app', 'build.gradle');

let content = fs.readFileSync(targetPath, 'utf8');

// Comment out enableBundleCompression
content = content.replace(
    /enableBundleCompression\s*=\s*\(findProperty\('android\.enableBundleCompression'\)\s*\?:\s*false\)\.toBoolean\(\)/g,
    '// enableBundleCompression = (findProperty(\'android.enableBundleCompression\') ?: false).toBoolean()'
);

fs.writeFileSync(targetPath, content);
console.log('Updated app/build.gradle');
