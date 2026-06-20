export const cases = [
  { id: 'ASC-2401', client: 'Priya Sharma', type: 'H-1B Visa', status: 'Active', health: 92, priority: 'High', lastUpdated: '2h ago', deadline: '2024-06-15', assignee: 'J. Chen' },
  { id: 'ASC-2402', client: 'Marco Rossi', type: 'Green Card', status: 'Review', health: 67, priority: 'Medium', lastUpdated: '5h ago', deadline: '2024-07-22', assignee: 'S. Patel' },
  { id: 'ASC-2403', client: 'Aisha Okonkwo', type: 'O-1 Visa', status: 'High Risk', health: 34, priority: 'Urgent', lastUpdated: '1d ago', deadline: '2024-05-30', assignee: 'M. Liu' },
  { id: 'ASC-2404', client: 'David Kim', type: 'L-1 Visa', status: 'Active', health: 88, priority: 'High', lastUpdated: '3h ago', deadline: '2024-08-10', assignee: 'J. Chen' },
  { id: 'ASC-2405', client: 'Sofia Mendez', type: 'TN Visa', status: 'Pending', health: 55, priority: 'Low', lastUpdated: '2d ago', deadline: '2024-09-05', assignee: 'R. Torres' },
  { id: 'ASC-2406', client: 'Rajan Patel', type: 'EB-2 NIW', status: 'High Risk', health: 41, priority: 'Urgent', lastUpdated: '6h ago', deadline: '2024-06-01', assignee: 'S. Patel' },
  { id: 'ASC-2407', client: 'Emma Laurent', type: 'E-3 Visa', status: 'Completed', health: 100, priority: 'Low', lastUpdated: '1w ago', deadline: '2024-04-20', assignee: 'M. Liu' },
  { id: 'ASC-2408', client: 'Chen Wei', type: 'H-4 EAD', status: 'Active', health: 79, priority: 'Medium', lastUpdated: '4h ago', deadline: '2024-07-30', assignee: 'R. Torres' },
];

export const statusChartData = [
  { name: 'Active', value: 42, color: '#6366f1' },
  { name: 'Review', value: 18, color: '#f59e0b' },
  { name: 'High Risk', value: 11, color: '#ef4444' },
  { name: 'Pending', value: 24, color: '#94a3b8' },
  { name: 'Completed', value: 31, color: '#10b981' },
];

export const trendData = [
  { month: 'Jan', completed: 18, new: 24, risk: 5 },
  { month: 'Feb', completed: 22, new: 19, risk: 3 },
  { month: 'Mar', completed: 29, new: 31, risk: 7 },
  { month: 'Apr', completed: 34, new: 28, risk: 4 },
  { month: 'May', completed: 31, new: 36, risk: 8 },
  { month: 'Jun', completed: 38, new: 42, risk: 6 },
];

export const documents = [
  { id: 1, name: 'Passport', status: 'uploaded', uploadedAt: '2024-05-12', size: '2.4 MB', type: 'PDF' },
  { id: 2, name: 'Resume / CV', status: 'uploaded', uploadedAt: '2024-05-10', size: '548 KB', type: 'DOCX' },
  { id: 3, name: 'Degree Certificate', status: 'missing', uploadedAt: null, size: null, type: null },
  { id: 4, name: 'Experience Letter', status: 'under_review', uploadedAt: '2024-05-14', size: '1.1 MB', type: 'PDF' },
  { id: 5, name: 'Bank Statement', status: 'uploaded', uploadedAt: '2024-05-11', size: '3.2 MB', type: 'PDF' },
  { id: 6, name: 'Employment Letter', status: 'missing', uploadedAt: null, size: null, type: null },
  { id: 7, name: 'I-140 Approval', status: 'uploaded', uploadedAt: '2024-05-09', size: '892 KB', type: 'PDF' },
  { id: 8, name: 'Tax Returns 2023', status: 'under_review', uploadedAt: '2024-05-13', size: '4.7 MB', type: 'PDF' },
];

export const aiInsights = [
  { type: 'warning', icon: 'FileX', text: '12 cases missing critical documents', count: 12 },
  { type: 'danger', icon: 'AlertTriangle', text: '3 high-risk cases need immediate attention', count: 3 },
  { type: 'info', icon: 'Clock', text: '5 case deadlines approaching this week', count: 5 },
  { type: 'success', icon: 'TrendingUp', text: 'Approval rate up 14% vs last month', count: null },
];

export const riskFactors = [
  { label: 'Missing Degree Certificate', severity: 'high', impact: 'Required for qualification proof' },
  { label: 'Passport Expiring in 45 days', severity: 'medium', impact: 'Must be valid for visa duration' },
  { label: 'Employment letter date mismatch', severity: 'medium', impact: 'Inconsistency may cause RFE' },
  { label: 'Translation not certified', severity: 'low', impact: 'Foreign documents need certification' },
];

export const chatHistory = [
  {
    role: 'assistant',
    content: "Hello! I'm your AI Case Assistant. I can help you analyze cases, identify missing documents, generate summaries, and answer questions about any case. How can I help you today?",
    time: '9:00 AM'
  }
];

export const suggestedQuestions = [
  'What documents are missing for ASC-2401?',
  'Summarize the Priya Sharma case',
  'Which cases have deadlines this week?',
  'Generate a petition summary for ASC-2404',
  'What are the high-risk cases?',
  'What actions are pending for ASC-2403?',
];

export const stats = {
  totalCases: 126,
  activeCases: 84,
  highRiskCases: 11,
  missingDocuments: 38,
  changes: {
    totalCases: '+8 this month',
    activeCases: '+3 this week',
    highRiskCases: '-2 resolved',
    missingDocuments: '+5 flagged',
  }
};