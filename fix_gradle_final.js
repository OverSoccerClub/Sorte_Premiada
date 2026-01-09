const fs = require('fs');
const path = require('path');

const targetPath = path.join('apps', 'mobile', 'android', 'build.gradle');

const newContent = `// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
  ext {
    kotlinVersion = "2.0.20"
  }
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath('com.android.tools.build:gradle')
    classpath('com.facebook.react:react-native-gradle-plugin')
    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}

apply plugin: "expo-root-project"
apply plugin: "com.facebook.react.rootproject"
`;

try {
    fs.writeFileSync(targetPath, newContent);
    console.log('Successfully wrote to ' + targetPath);
} catch (error) {
    console.error('Error writing file:', error);
    process.exit(1);
}
