#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

interface TestError {
    test: string;
    message: string;
    stack?: string;
    screenshot?: string;
    video?: string;
}

interface TestSuite {
    name: string;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    errors: TestError[];
}

interface ConsolidatedReport {
    timestamp: string;
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        duration: number;
        passRate: number;
    };
    api: TestSuite[];
    e2e: TestSuite[];
}

function parseApiResults(): TestSuite[] {
    const resultsPath = path.join(__dirname, '../test-reports/api/json/results.json');

    if (!fs.existsSync(resultsPath)) {
        console.warn('API test results not found');
        return [];
    }

    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

    const suites: TestSuite[] = [];

    if (results.testResults) {
        results.testResults.forEach((testFile: any) => {
            const suite: TestSuite = {
                name: path.basename(testFile.name),
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: testFile.endTime - testFile.startTime,
                errors: [],
            };

            testFile.assertionResults.forEach((test: any) => {
                if (test.status === 'passed') suite.passed++;
                else if (test.status === 'failed') {
                    suite.failed++;
                    suite.errors.push({
                        test: test.title,
                        message: test.failureMessages.join('\n'),
                        stack: test.failureMessages.join('\n'),
                    });
                } else suite.skipped++;
            });

            suites.push(suite);
        });
    }

    return suites;
}

function parseE2eResults(): TestSuite[] {
    const resultsPath = path.join(__dirname, '../test-reports/e2e/json/results.json');

    if (!fs.existsSync(resultsPath)) {
        console.warn('E2E test results not found');
        return [];
    }

    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

    const suites: TestSuite[] = [];

    if (results.suites) {
        results.suites.forEach((suite: any) => {
            const testSuite: TestSuite = {
                name: suite.title,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: suite.duration || 0,
                errors: [],
            };

            suite.specs.forEach((spec: any) => {
                spec.tests.forEach((test: any) => {
                    if (test.status === 'expected') testSuite.passed++;
                    else if (test.status === 'unexpected') {
                        testSuite.failed++;
                        testSuite.errors.push({
                            test: test.title,
                            message: test.error?.message || 'Test failed',
                            stack: test.error?.stack,
                            screenshot: test.attachments?.find((a: any) => a.name === 'screenshot')?.path,
                            video: test.attachments?.find((a: any) => a.name === 'video')?.path,
                        });
                    } else testSuite.skipped++;
                });
            });

            suites.push(testSuite);
        });
    }

    return suites;
}

function generateHTML(report: ConsolidatedReport): string {
    const { summary, api, e2e } = report;

    const renderErrors = (errors: TestError[]) => {
        return errors.map(error => `
      <div class="error">
        <h4>❌ ${error.test}</h4>
        <p><strong>Message:</strong> ${error.message}</p>
        ${error.stack ? `<pre class="stack">${error.stack}</pre>` : ''}
        ${error.screenshot ? `<img src="${error.screenshot}" alt="Screenshot" class="screenshot" />` : ''}
        ${error.video ? `<video src="${error.video}" controls class="video"></video>` : ''}
      </div>
    `).join('');
    };

    const renderSuite = (suite: TestSuite) => `
    <div class="suite">
      <h3>${suite.name}</h3>
      <div class="suite-stats">
        <span class="stat passed">✅ ${suite.passed} passed</span>
        <span class="stat failed">❌ ${suite.failed} failed</span>
        <span class="stat skipped">⏭️ ${suite.skipped} skipped</span>
        <span class="stat duration">⏱️ ${(suite.duration / 1000).toFixed(2)}s</span>
      </div>
      ${suite.errors.length > 0 ? renderErrors(suite.errors) : '<p class="no-errors">✅ All tests passed!</p>'}
    </div>
  `;

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report Dashboard - MegaSena</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 10px; }
    .timestamp { color: #666; margin-bottom: 30px; }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    .card h3 { color: #666; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; }
    .card h1 { font-size: 48px; margin-bottom: 5px; }
    .card.total h1 { color: #333; }
    .card.passed h1 { color: #10b981; }
    .card.failed h1 { color: #ef4444; }
    .card.skipped h1 { color: #f59e0b; }
    .card.duration h1 { color: #3b82f6; font-size: 36px; }
    .pass-rate {
      font-size: 18px;
      color: ${summary.passRate >= 95 ? '#10b981' : summary.passRate >= 80 ? '#f59e0b' : '#ef4444'};
      font-weight: bold;
    }
    
    .section {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    .section h2 {
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .suite {
      margin-bottom: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }
    .suite h3 { color: #333; margin-bottom: 15px; }
    .suite-stats {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    .stat {
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }
    .stat.passed { background: #d1fae5; color: #065f46; }
    .stat.failed { background: #fee2e2; color: #991b1b; }
    .stat.skipped { background: #fef3c7; color: #92400e; }
    .stat.duration { background: #dbeafe; color: #1e40af; }
    
    .error {
      background: #fff;
      border: 2px solid #fecaca;
      border-left: 4px solid #ef4444;
      padding: 20px;
      margin: 15px 0;
      border-radius: 8px;
    }
    .error h4 { color: #991b1b; margin-bottom: 10px; }
    .error p { margin: 10px 0; color: #333; }
    .stack {
      background: #1f2937;
      color: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.5;
    }
    .screenshot, .video {
      max-width: 100%;
      margin-top: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .no-errors {
      color: #059669;
      font-weight: 600;
      padding: 15px;
      background: #d1fae5;
      border-radius: 6px;
      text-align: center;
    }
    
    @media print {
      body { background: white; }
      .card, .section, .suite { box-shadow: none; border: 1px solid #e5e7eb; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Test Report Dashboard</h1>
    <p class="timestamp">Generated: ${report.timestamp}</p>
    
    <div class="summary">
      <div class="card total">
        <h3>Total Tests</h3>
        <h1>${summary.total}</h1>
      </div>
      <div class="card passed">
        <h3>✅ Passed</h3>
        <h1>${summary.passed}</h1>
      </div>
      <div class="card failed">
        <h3>❌ Failed</h3>
        <h1>${summary.failed}</h1>
      </div>
      <div class="card skipped">
        <h3>⏭️ Skipped</h3>
        <h1>${summary.skipped}</h1>
      </div>
      <div class="card duration">
        <h3>⏱️ Duration</h3>
        <h1>${(summary.duration / 1000).toFixed(1)}s</h1>
      </div>
      <div class="card">
        <h3>Pass Rate</h3>
        <h1 class="pass-rate">${summary.passRate.toFixed(1)}%</h1>
      </div>
    </div>

    <div class="section">
      <h2>🔧 API Tests (${api.reduce((sum, s) => sum + s.passed + s.failed + s.skipped, 0)} total)</h2>
      ${api.map(renderSuite).join('')}
    </div>

    <div class="section">
      <h2>🌐 E2E Tests (${e2e.reduce((sum, s) => sum + s.passed + s.failed + s.skipped, 0)} total)</h2>
      ${e2e.map(renderSuite).join('')}
    </div>
  </div>
</body>
</html>
  `;
}

function generateReport() {
    console.log('📊 Generating consolidated test report...\n');

    const api = parseApiResults();
    const e2e = parseE2eResults();

    const summary = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        passRate: 0,
    };

    [...api, ...e2e].forEach(suite => {
        summary.total += suite.passed + suite.failed + suite.skipped;
        summary.passed += suite.passed;
        summary.failed += suite.failed;
        summary.skipped += suite.skipped;
        summary.duration += suite.duration;
    });

    summary.passRate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;

    const report: ConsolidatedReport = {
        timestamp: new Date().toLocaleString('pt-BR'),
        summary,
        api,
        e2e,
    };

    // Gerar HTML
    const html = generateHTML(report);
    const htmlPath = path.join(__dirname, '../test-reports/dashboard/index.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`✅ HTML report generated: ${htmlPath}`);

    // Gerar JSON
    const jsonPath = path.join(__dirname, '../test-reports/dashboard/report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`✅ JSON report generated: ${jsonPath}`);

    // Resumo no console
    console.log('\n📊 Test Summary:');
    console.log(`   Total:   ${summary.total}`);
    console.log(`   ✅ Passed:  ${summary.passed} (${summary.passRate.toFixed(1)}%)`);
    console.log(`   ❌ Failed:  ${summary.failed}`);
    console.log(`   ⏭️  Skipped: ${summary.skipped}`);
    console.log(`   ⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s\n`);

    if (summary.failed > 0) {
        console.log('❌ Some tests failed. Check the report for details.');
        process.exit(1);
    } else {
        console.log('✅ All tests passed!');
        process.exit(0);
    }
}

// Executar
generateReport();
