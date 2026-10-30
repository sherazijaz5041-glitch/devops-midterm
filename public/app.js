// Frontend JavaScript for Assignment Submission Portal
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('submissionForm');
  const studentNameInput = document.getElementById('studentName');
  const regNoInput = document.getElementById('regNo');
  const assignmentTitleInput = document.getElementById('assignmentTitle');
  const submissionUrlInput = document.getElementById('submissionUrl');
  const submitBtn = document.getElementById('submitBtn');
  const formAlert = document.getElementById('formAlert');
  const submissionsList = document.getElementById('submissionsList');
  const submissionCount = document.getElementById('submissionCount');
  const refreshBtn = document.getElementById('refreshBtn');
  const systemModeBadge = document.getElementById('systemModeBadge');

  let isOfflineOrPages = false;
  let localCache = [];

  // Check URL validity
  function isValidHttpUrl(string) {
    try {
      const url = new URL(string.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  // Show inline field error
  function setFieldError(fieldId, errorMsg) {
    const errorEl = document.getElementById(`${fieldId}Error`);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) errorEl.textContent = errorMsg;
    if (inputEl) {
      if (errorMsg) {
        inputEl.classList.add('invalid');
      } else {
        inputEl.classList.remove('invalid');
      }
    }
  }

  // Clear all errors
  function clearErrors() {
    ['studentName', 'regNo', 'assignmentTitle', 'submissionUrl'].forEach(id => setFieldError(id, ''));
    formAlert.className = 'alert hidden';
    formAlert.textContent = '';
  }

  function showAlert(message, type = 'success') {
    formAlert.className = `alert alert-${type}`;
    formAlert.textContent = message;
    formAlert.classList.remove('hidden');
  }

  // Detect environment (Backend API vs Static GitHub Pages)
  async function detectMode() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        systemModeBadge.textContent = 'API Connected';
        systemModeBadge.className = 'badge badge-mode';
        isOfflineOrPages = false;
        return;
      }
    } catch (e) {
      // Backend not accessible, switch to GitHub Pages / LocalStorage mode
    }
    isOfflineOrPages = true;
    systemModeBadge.textContent = 'GitHub Pages Demo Mode';
    systemModeBadge.className = 'badge badge-mode';
    systemModeBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    systemModeBadge.style.color = '#34d399';
    systemModeBadge.style.background = 'rgba(16, 185, 129, 0.15)';
  }

  // Render submissions
  function renderSubmissions(items) {
    submissionCount.textContent = items.length;
    if (!items || items.length === 0) {
      submissionsList.innerHTML = `
        <div class="empty-state" id="emptyState">
          <div class="empty-icon">📭</div>
          <p>No submissions recorded yet.</p>
          <span>Fill in the form on the left to add your first submission.</span>
        </div>
      `;
      return;
    }

    submissionsList.innerHTML = items.map(sub => `
      <div class="submission-item" data-id="${sub.id}">
        <div class="submission-top">
          <span class="submission-student">${escapeHtml(sub.studentName)}</span>
          <span class="submission-reg">${escapeHtml(sub.regNo)}</span>
        </div>
        <div class="submission-title"><strong>Task:</strong> ${escapeHtml(sub.assignmentTitle)}</div>
        <div class="submission-url-wrap">
          <span>🔗</span>
          <a href="${escapeHtml(sub.submissionUrl)}" target="_blank" rel="noopener noreferrer" class="submission-url-link">
            ${escapeHtml(sub.submissionUrl)}
          </a>
        </div>
        <div class="submission-meta">
          <span>ID: <code>${escapeHtml(sub.id.substring(0, 14))}...</code></span>
          <span>${new Date(sub.submittedAt).toLocaleTimeString()} • ${new Date(sub.submittedAt).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Fetch Submissions
  async function fetchSubmissions() {
    if (isOfflineOrPages) {
      const stored = localStorage.getItem('portal_submissions');
      localCache = stored ? JSON.parse(stored) : [];
      renderSubmissions(localCache);
      return;
    }

    try {
      const res = await fetch('/api/submissions');
      const data = await res.json();
      if (data.success) {
        renderSubmissions(data.submissions);
      }
    } catch (err) {
      // Fallback to local storage if API call fails
      const stored = localStorage.getItem('portal_submissions');
      localCache = stored ? JSON.parse(stored) : [];
      renderSubmissions(localCache);
    }
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const studentName = studentNameInput.value.trim();
    const regNo = regNoInput.value.trim();
    const assignmentTitle = assignmentTitleInput.value.trim();
    const submissionUrl = submissionUrlInput.value.trim();

    let hasError = false;

    if (!studentName) {
      setFieldError('studentName', 'Student full name is required');
      hasError = true;
    }
    if (!regNo) {
      setFieldError('regNo', 'Registration number is required');
      hasError = true;
    }
    if (!assignmentTitle) {
      setFieldError('assignmentTitle', 'Assignment title is required');
      hasError = true;
    }
    if (!submissionUrl) {
      setFieldError('submissionUrl', 'Submission URL is required');
      hasError = true;
    } else if (!isValidHttpUrl(submissionUrl)) {
      setFieldError('submissionUrl', 'Please enter a valid URL starting with http:// or https://');
      hasError = true;
    }

    if (hasError) return;

    submitBtn.disabled = true;

    const payload = { studentName, regNo, assignmentTitle, submissionUrl };

    if (isOfflineOrPages) {
      // LocalStorage Demo Mode
      const newSub = {
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        ...payload,
        submittedAt: new Date().toISOString()
      };
      localCache.unshift(newSub);
      localStorage.setItem('portal_submissions', JSON.stringify(localCache));
      renderSubmissions(localCache);
      showAlert('Submission recorded successfully! (Demo Mode)', 'success');
      form.reset();
      submitBtn.disabled = false;
      return;
    }

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showAlert('Submission saved successfully!', 'success');
        form.reset();
        fetchSubmissions();
      } else {
        showAlert(data.error || 'Failed to submit assignment', 'danger');
      }
    } catch (err) {
      showAlert('Network error: Could not reach portal server.', 'danger');
    } finally {
      submitBtn.disabled = false;
    }
  });

  refreshBtn.addEventListener('click', fetchSubmissions);

  // Initialize
  detectMode().then(() => fetchSubmissions());
});
