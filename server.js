const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  CSC418 DevOps Midterm: Assignment Submission Portal`);
  console.log(`  Server running on http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Submissions API: http://localhost:${PORT}/api/submissions`);
  console.log(`====================================================`);
});
