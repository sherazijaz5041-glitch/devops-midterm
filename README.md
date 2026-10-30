# CSC418 DevOps Lab Midterm Examination
## Assignment Submission Portal with Automated CI Testing & Local Report Delivery

**Course:** CSC418 DevOps  
**Institution:** COMSATS University Islamabad, Attock Campus  
**Student Name:** Muhammad Sheraz Ijaz  
**Registration Number:** FA23-BSE-065  
**Email:** sherazijaz5041@gmail.com  
**GitHub Repository:** `https://github.com/sheraz112/devops-midterm`  

---

## 📌 Project Overview
This project is an automated **Assignment Submission Portal** developed for the CSC418 DevOps Midterm Examination. It features:
1. **Interactive Web Application**: Form for students to submit assignments (Name, Registration Number, Title, and Submission URL) with real-time field and URL validation, persistent storage, and live submission feed.
2. **Automated Testing Suite**: Standardized test cases verifying complete details submission, missing registration number rejection, and invalid URL rejection.
3. **Continuous Integration (CI) Pipeline**: GitHub Actions workflow that automatically executes tests on every push, ensuring test stage failure on defective revisions.
4. **Local HTTP Report Receiver**: A dedicated HTTP receiver running locally on the instructor/student workstation listening for incoming test reports and saving them as `test-report.json`.
5. **Bonus Capabilities**:
   - **Conditional Deployment**: Automatic publication of the portal's static frontend to GitHub Pages upon push to `main` branch, only when all tests pass.
   - **Automated Email Reports**: Automated dispatch of test reports with attachment to a configurable email address after both passing and failing runs.

---

## 🚀 1. How to Run the Application Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/sheraz112/devops-midterm.git
cd devops-midterm

# Install dependencies
npm install
```

### Start Web Server
```bash
npm start
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🧪 2. How to Execute Automated Tests

### Run Tests Directly
```bash
npm test
```

### Run CI Test & Reporting Engine Locally
To run tests, generate `test-report.json`, and attempt transmission to the local receiver:
```bash
npm run test:ci
# or
node scripts/run-and-report.js
```

---

## 📡 3. How to Start the Local Report Receiver

The local report receiver listens on port `5000` and automatically saves incoming payloads to `test-report.json`.

### Option A: Using Node.js
```bash
npm run receiver
# or
node receiver.js
```

### Option B: Using Python
```bash
python receiver.py
```

### Forwarding GitHub-Hosted CI to Localhost (Tunneling)
Since GitHub-hosted runners run in cloud VMs, run a tunnel to forward requests to your local machine:
```bash
npx localtunnel --port 5000 --subdomain sheraz-midterm-receiver
```
Set the tunnel URL (e.g. `https://sheraz-midterm-receiver.loca.lt/report`) in your GitHub repository Secrets as `RECEIVER_URL`.

---

## 🔄 4. Demonstrating the Complete Workflow (Requirement 5)

### Step 1: Passing Run
1. Ensure the code is in its clean state:
   ```bash
   node scripts/toggle-defect.js --fix
   ```
2. Commit and push:
   ```bash
   git add .
   git commit -m "feat: complete assignment portal with passing test suite"
   git push origin main
   ```
3. Observe GitHub Actions passing and local `test-report.json` updating with `overallStatus: "PASSED"`.

### Step 2: Defect Introduction (Failing Run)
1. Introduce defect into the portal:
   ```bash
   node scripts/toggle-defect.js --break
   ```
2. Commit and push:
   ```bash
   git add .
   git commit -m "test: introduce defect in url validation"
   git push origin main
   ```
3. Observe GitHub Actions failing and local `test-report.json` automatically updating with `overallStatus: "FAILED"`.

### Step 3: Defect Resolution (Passing Run)
1. Resolve the defect:
   ```bash
   node scripts/toggle-defect.js --fix
   ```
2. Commit and push:
   ```bash
   git add .
   git commit -m "fix: restore url validation logic"
   git push origin main
   ```
3. Observe GitHub Actions passing and local `test-report.json` returning to `overallStatus: "PASSED"`.

---

## 🎁 5. Bonus Tasks Configuration

### Bonus 1: GitHub Pages Conditional Deployment
- Go to **Settings > Pages** in your GitHub repository.
- Under **Build and deployment > Source**, select **GitHub Actions**.
- Pushes to `main` will automatically deploy `./public` when and only when tests pass!

### Bonus 2: Automated Email Reports
Configure the following Repository Secrets (**Settings > Secrets and variables > Actions**):
- `SMTP_HOST`: (e.g., `smtp.gmail.com`)
- `SMTP_PORT`: (e.g., `587`)
- `SMTP_USER`: Your email address
- `SMTP_PASS`: Your email App Password
- `REPORT_RECIPIENT_EMAIL`: Configurable recipient email address
