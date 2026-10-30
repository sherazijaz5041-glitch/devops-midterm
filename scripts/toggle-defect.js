const fs = require('fs');
const path = require('path');

const APP_PATH = path.join(__dirname, '..', 'app.js');

const mode = process.argv[2];

if (!mode || (mode !== '--break' && mode !== '--fix')) {
  console.log('Usage:');
  console.log('  node scripts/toggle-defect.js --break   (Introduces defect for Requirement 5 demonstration)');
  console.log('  node scripts/toggle-defect.js --fix     (Fixes defect to restore passing test state)');
  process.exit(1);
}

let content = fs.readFileSync(APP_PATH, 'utf-8');

if (mode === '--break') {
  // Break the URL validation check so invalid URLs are accepted
  if (content.includes('// 2. Validate URL format')) {
    content = content.replace(
      '// 2. Validate URL format\n  if (!isValidUrl(submissionUrl)) {',
      '// 2. Validate URL format (DEFECT INTRODUCED FOR REQUIREMENT 5 DEMO)\n  if (false && !isValidUrl(submissionUrl)) {'
    );
    fs.writeFileSync(APP_PATH, content, 'utf-8');
    console.log('-------------------------------------------------------------');
    console.log('  [DEFECT INTRODUCED]');
    console.log('  URL validation has been intentionally bypassed in app.js.');
    console.log('  Running automated tests now will cause TestCase 3 to FAIL.');
    console.log('-------------------------------------------------------------');
  } else {
    console.log('Defect already appears to be active or target code modified.');
  }
} else if (mode === '--fix') {
  // Restore the URL validation check
  if (content.includes('(DEFECT INTRODUCED FOR REQUIREMENT 5 DEMO)')) {
    content = content.replace(
      '// 2. Validate URL format (DEFECT INTRODUCED FOR REQUIREMENT 5 DEMO)\n  if (false && !isValidUrl(submissionUrl)) {',
      '// 2. Validate URL format\n  if (!isValidUrl(submissionUrl)) {'
    );
    fs.writeFileSync(APP_PATH, content, 'utf-8');
    console.log('-------------------------------------------------------------');
    console.log('  [DEFECT RESOLVED]');
    console.log('  URL validation has been restored in app.js.');
    console.log('  Running automated tests now will PASS successfully.');
    console.log('-------------------------------------------------------------');
  } else {
    console.log('Code is already clean and passing.');
  }
}
