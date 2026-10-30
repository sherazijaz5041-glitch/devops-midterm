const request = require('supertest');
const app = require('../app');

describe('CSC418 DevOps Midterm: Assignment Submission Portal Test Suite', () => {
  beforeEach(() => {
    app.__resetSubmissions();
  });

  // TEST CASE 1 (Mandatory Requirement):
  // Complete details and a valid submission URL -> The submission is saved and appears in the submission list.
  test('TestCase 1: Complete details and a valid submission URL saves and appears in list', async () => {
    const validPayload = {
      studentName: 'Muhammad Sheraz',
      regNo: 'FA23-BSE-065',
      assignmentTitle: 'CSC418 DevOps Midterm Lab',
      submissionUrl: 'https://github.com/sherazijaz5041-glitch/devops-midterm'
    };

    // 1. Submit valid assignment
    const postRes = await request(app)
      .post('/api/submissions')
      .send(validPayload);

    expect(postRes.status).toBe(201);
    expect(postRes.body.success).toBe(true);
    expect(postRes.body.submission).toBeDefined();
    expect(postRes.body.submission.regNo).toBe('FA23-BSE-065');
    expect(postRes.body.submission.submissionUrl).toBe('https://github.com/sherazijaz5041-glitch/devops-midterm');

    // 2. Verify submission appears in the submission list
    const getRes = await request(app)
      .get('/api/submissions');

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.count).toBe(1);

    const saved = getRes.body.submissions.find(s => s.regNo === 'FA23-BSE-065');
    expect(saved).toBeDefined();
    expect(saved.studentName).toBe('Muhammad Sheraz');
    expect(saved.submissionUrl).toBe('https://github.com/sherazijaz5041-glitch/devops-midterm');
  });

  // TEST CASE 2 (Mandatory Requirement):
  // Missing registration number -> The submission is rejected with a validation message.
  test('TestCase 2: Missing registration number is rejected with a validation message', async () => {
    const invalidPayload = {
      studentName: 'Muhammad Sheraz',
      // regNo is omitted
      assignmentTitle: 'CSC418 DevOps Midterm Lab',
      submissionUrl: 'https://github.com/sherazijaz5041-glitch/devops-midterm'
    };

    const postRes = await request(app)
      .post('/api/submissions')
      .send(invalidPayload);

    expect(postRes.status).toBe(400);
    expect(postRes.body.success).toBe(false);
    expect(postRes.body.error).toBe('Registration number is required');

    // Ensure nothing was saved
    const getRes = await request(app).get('/api/submissions');
    expect(getRes.body.count).toBe(0);
  });

  // TEST CASE 3 (Mandatory Requirement):
  // Invalid submission URL -> The submission is rejected and is not saved.
  test('TestCase 3: Invalid submission URL is rejected and is not saved', async () => {
    const invalidUrlPayload = {
      studentName: 'Muhammad Sheraz',
      regNo: 'FA23-BSE-065',
      assignmentTitle: 'CSC418 DevOps Midterm Lab',
      submissionUrl: 'ht!tp://invalid-link-without-scheme'
    };

    const postRes = await request(app)
      .post('/api/submissions')
      .send(invalidUrlPayload);

    expect(postRes.status).toBe(400);
    expect(postRes.body.success).toBe(false);
    expect(postRes.body.error).toContain('Invalid submission URL');

    // Ensure invalid submission is NOT saved
    const getRes = await request(app).get('/api/submissions');
    expect(getRes.body.count).toBe(0);
  });
});
