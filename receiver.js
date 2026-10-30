const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const REPORT_FILE = path.join(process.cwd(), 'test-report.json');

const server = http.createServer((req, res) => {
  // Set CORS headers so it accepts incoming requests from any client/tunnel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'active',
      message: 'Local Test Report Receiver is listening',
      reportPath: REPORT_FILE
    }));
    return;
  }

  // POST endpoint to receive test report
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const reportData = JSON.parse(body);

        // Write directly to test-report.json
        fs.writeFileSync(REPORT_FILE, JSON.stringify(reportData, null, 2), 'utf-8');

        console.log('\n=============================================================');
        console.log('  [RECEIVER] >>> NEW TEST REPORT RECEIVED & SAVED <<<');
        console.log(`  File: ${REPORT_FILE}`);
        console.log(`  Timestamp:   ${reportData.executionTimestamp || new Date().toISOString()}`);
        console.log(`  Repository:  ${reportData.repository}`);
        console.log(`  Branch:      ${reportData.branch}`);
        console.log(`  Commit SHA:  ${reportData.commitSha}`);
        console.log(`  Run ID:      ${reportData.pipelineRunId}`);
        console.log(`  Overall:     ${reportData.overallStatus === 'PASSED' ? 'SUCCESS (PASSED)' : 'FAILED'}`);
        console.log(`  Tests:       Total: ${reportData.summary?.total} | Passed: ${reportData.summary?.passed} | Failed: ${reportData.summary?.failed}`);
        console.log('-------------------------------------------------------------');
        if (Array.isArray(reportData.tests)) {
          reportData.tests.forEach((t, i) => {
            const mark = t.result === 'passed' ? 'PASS' : 'FAIL';
            console.log(`  [${mark}] ${i + 1}. ${t.name}`);
            if (t.failureMessage) {
              console.log(`         Error: ${t.failureMessage.split('\n')[0]}`);
            }
          });
        }
        console.log('=============================================================\n');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Report received and saved to test-report.json',
          savedPath: REPORT_FILE
        }));
      } catch (err) {
        console.error('  [RECEIVER ERROR] Invalid JSON payload:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(`  LOCAL TEST REPORT RECEIVER ACTIVE`);
  console.log(`  Port: http://localhost:${PORT}`);
  console.log(`  Target Output: ${REPORT_FILE}`);
  console.log(`  Waiting for automated test reports from CI / pipeline...`);
  console.log(`=============================================================`);
});
