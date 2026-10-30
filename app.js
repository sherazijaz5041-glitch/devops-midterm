const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory submissions cache
let submissions = [];

function loadSubmissions() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      submissions = JSON.parse(raw);
    }
  } catch (err) {
    submissions = [];
  }
}

function saveSubmissions() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving submissions to file:', err.message);
  }
}

// Load initial submissions
loadSubmissions();

// URL validation helper
function isValidUrl(urlString) {
  if (typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/submissions - Retrieve all submissions
app.get('/api/submissions', (req, res) => {
  res.json({
    success: true,
    count: submissions.length,
    submissions
  });
});

// POST /api/submissions - Validate and save new submission
app.post('/api/submissions', (req, res) => {
  const { studentName, regNo, assignmentTitle, submissionUrl } = req.body || {};

  // 1. Validate required fields
  if (!studentName || typeof studentName !== 'string' || !studentName.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Student name is required'
    });
  }

  if (!regNo || typeof regNo !== 'string' || !regNo.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Registration number is required'
    });
  }

  if (!assignmentTitle || typeof assignmentTitle !== 'string' || !assignmentTitle.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Assignment title is required'
    });
  }

  if (!submissionUrl || typeof submissionUrl !== 'string' || !submissionUrl.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Submission URL is required'
    });
  }

  // 2. Validate URL format (DEFECT INTRODUCED FOR REQUIREMENT 5 DEMO)
  if (false && !isValidUrl(submissionUrl)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid submission URL. Must be a valid HTTP or HTTPS URL'
    });
  }

  // 3. Create and save submission
  const newSubmission = {
    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    studentName: studentName.trim(),
    regNo: regNo.trim(),
    assignmentTitle: assignmentTitle.trim(),
    submissionUrl: submissionUrl.trim(),
    submittedAt: new Date().toISOString()
  };

  submissions.unshift(newSubmission);
  saveSubmissions();

  return res.status(201).json({
    success: true,
    message: 'Submission successfully recorded',
    submission: newSubmission
  });
});

// Helper for test reset
app.__resetSubmissions = function() {
  submissions = [];
  saveSubmissions();
};

module.exports = app;
