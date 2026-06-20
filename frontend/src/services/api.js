const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Cases ──────────────────────────────────────────────

export async function getCases() {
  const res = await fetch(`${BASE_URL}/cases/`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function getCaseDetails(caseId) {
  const res = await fetch(`${BASE_URL}/cases/${caseId}`);
  if (!res.ok) throw new Error('Failed to fetch case details');
  return res.json();
}

export async function createCase(data) {
  // data: { client_name, case_type, priority }
  const res = await fetch(`${BASE_URL}/cases/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create case');
  return res.json();
}

// ── Documents ──────────────────────────────────────────

export async function uploadDocument(caseId, file) {
  const formData = new FormData();
  formData.append('case_id', caseId);
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Document upload failed');
  return res.json();
}

// ── AI ─────────────────────────────────────────────────

export async function analyzeCase(caseId) {
  const res = await fetch(`${BASE_URL}/ai/analyze/${caseId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('AI analysis failed');
  return res.json();
}

export async function getAnalysis(caseId) {
  const res = await fetch(`${BASE_URL}/ai/result/${caseId}`);
  if (!res.ok) throw new Error('Failed to fetch analysis result');
  return res.json();
}

// ── Dashboard ──────────────────────────────────────────

export async function getDashboardStats() {
  const res = await fetch(`${BASE_URL}/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

// ── Petitions ──────────────────────────────────────────

export async function generatePetition(caseId) {
  const res = await fetch(`${BASE_URL}/petitions/generate/${caseId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Petition generation failed');
  return res.json();
}

export async function getPetition(caseId) {
  const res = await fetch(`${BASE_URL}/petitions/${caseId}`);
  if (!res.ok) throw new Error('Failed to fetch petition');
  return res.json();
}

export function getPetitionDownloadUrl(petitionId) {
  return `${BASE_URL}/petitions/download/${petitionId}`;
}

// ── Settings / Firm Profile ─────────────────────────────

export async function getFirmProfile() {
  const res = await fetch(`${BASE_URL}/settings/profile`);
  if (!res.ok) throw new Error('Failed to fetch firm profile');
  return res.json();
}

export async function saveFirmProfile(data) {
  // data: { attorney_name, attorney_title, law_firm_name, bar_number }
  const res = await fetch(`${BASE_URL}/settings/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save firm profile');
  return res.json();
}