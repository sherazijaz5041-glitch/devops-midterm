const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const JEST_RAW_FILE = path.join(ROOT_DIR, 'jest-raw.json');
const REPORT_FILE = path.join(ROOT_DIR, 'test-report.json');

console.log('-------------------------------------------------------------');
console.log('  [CI RUNNER] Executing Automated Test Suite...');
console.log('-------------------------------------------------------------');

// Determine git commit sha locally if not in GitHub Actions
function getGitCommitSha() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    const res = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT_DIR, encoding: 'utf-8' });
    if (res.stdout) return res.stdout.trim();
  } catch (e) {}
  return 'local-dev-sha';
}

function getGitBranch() {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  try {
    const res = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT_DIR, encoding: 'utf-8' });
    if (res.stdout) return res.stdout.trim();
  } catch (e) {}
  return 'main';
}

// 1. Run Jest and output raw JSON
const jestCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const jestArgs = ['jest', '--runInBand', '--json', '--outputFile=jest-raw.json'];

const jestProcess = spawnSync(jestCmd, jestArgs, {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  shell: true
});

// 2. Parse Jest output
let rawResults = null;
try {
  if (fs.existsSync(JEST_RAW_FILE)) {
    const raw = fs.readFileSync(JEST_RAW_FILE, 'utf-8');
    rawResults = JSON.parse(raw);
  }
} catch (e) {
  console.error('[CI RUNNER] Could not read Jest raw output:', e.message);
}

// Format test report according to CSC418 Midterm Exam requirements
const totalTests = rawResults ? rawResults.numTotalTests : 0;
const passedTests = rawResults ? rawResults.numPassedTests : 0;
const failedTests = rawResults ? rawResults.numFailedTests : 0;
const isSuccess = rawResults ? rawResults.success : (jestProcess.status === 0);

const individualTests = [];
if (rawResults && Array.isArray(rawResults.testResults)) {
  rawResults.testResults.forEach(suite => {
    if (Array.isArray(suite.assertionResults)) {
      suite.assertionResults.forEach(test => {
        individualTests.push({
          name: test.title,
          fullName: test.fullName,
          result: test.status === 'passed' ? 'passed' : 'failed',
          failureMessage: test.failureMessages && test.failureMessages.length > 0 
            ? test.failureMessages.join('\n') 
            : null,
          durationMs: test.duration || 0
        });
      });
    }
  });
}

const reportPayload = {
  repository: process.env.GITHUB_REPOSITORY || 'sheraz112/devops-midterm',
  branch: getGitBranch(),
  commitSha: getGitCommitSha(),
  pipelineRunId: process.env.GITHUB_RUN_ID || 'local_run_' + Date.now(),
  pipelineRunNumber: process.env.GITHUB_RUN_NUMBER || '1',
  executionTimestamp: new Date().toISOString(),
  overallStatus: isSuccess ? 'PASSED' : 'FAILED',
  summary: {
    total: totalTests,
    passed: passedTests,
    failed: failedTests
  },
  tests: individualTests
};

// Save report to local test-report.json
fs.writeFileSync(REPORT_FILE, JSON.stringify(reportPayload, null, 2), 'utf-8');
console.log(`\n[CI RUNNER] Generated test-report.json at: ${REPORT_FILE}`);

// 3. Post to receiver URL (localhost, tunnel, or relay)
async function sendReportToReceiver() {
  const receiverUrl = process.env.RECEIVER_URL || 'http://localhost:5000/report';
  console.log(`[CI RUNNER] Transmitting test report to receiver: ${receiverUrl}`);

  try {
    const url = new URL(receiverUrl);
    const client = url.protocol === 'https:' ? https : http;
    const bodyData = JSON.stringify(reportPayload);

    await new Promise((resolve) => {
      const req = client.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyData),
          'Bypass-Tunnel-Reminder': 'true' // For localtunnel
        },
        timeout: 10000
      }, (res) => {
        let respData = '';
        res.on('data', chunk => respData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[CI RUNNER] SUCCESS: Test report successfully delivered to receiver! (HTTP ${res.statusCode})`);
          } else {
            console.warn(`[CI RUNNER] Receiver responded with HTTP ${res.statusCode}: ${respData}`);
          }
          resolve();
        });
      });

      req.on('error', (err) => {
        console.warn(`[CI RUNNER] Note: Could not connect to remote receiver (${receiverUrl}): ${err.message}`);
        console.warn(`[CI RUNNER] (Ensure local receiver & tunnel are running during demonstration).`);
        resolve(); // Continue without crashing script
      });

      req.on('timeout', () => {
        req.destroy();
        console.warn(`[CI RUNNER] Request to receiver timed out.`);
        resolve();
      });

      req.write(bodyData);
      req.end();
    });
  } catch (err) {
    console.warn(`[CI RUNNER] Transmission error: ${err.message}`);
  }
}

sendReportToReceiver().then(() => {
  // Clean temporary raw jest file
  try {
    if (fs.existsSync(JEST_RAW_FILE)) fs.unlinkSync(JEST_RAW_FILE);
  } catch (e) {}

  // Enforce Requirement 3: "A failed test must cause the test stage to fail."
  if (!isSuccess || failedTests > 0) {
    console.error('\n[CI RUNNER] Automated tests FAILED. Exiting with status 1.');
    process.exit(1);
  } else {
    console.log('\n[CI RUNNER] All automated tests PASSED successfully. Exiting with status 0.');
    process.exit(0);
  }
});
