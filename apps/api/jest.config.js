module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/main.ts',
    ],
    coverageDirectory: '../../test-reports/api/coverage',
    coverageReporters: ['html', 'text', 'lcov'],
    reporters: [
        'default',
        [
            'jest-html-reporter',
            {
                pageTitle: 'API Test Report - MegaSena',
                outputPath: '../../test-reports/api/html/index.html',
                includeFailureMsg: true,
                includeConsoleLog: true,
                dateFormat: 'yyyy-mm-dd HH:MM:ss',
                sort: 'status',
            },
        ],
    ],
    testTimeout: 30000,
    verbose: true,
};
