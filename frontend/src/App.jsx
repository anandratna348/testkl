import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import CasesPage from './pages/Cases';
import CaseDetails from './pages/CaseDetails';
import CreateCase from './pages/CreateCase';
import DocumentUpload from './pages/Documents';
import AIAssistant from './pages/AIAssistant';
import HealthDashboard from './pages/HealthDashboard';
import Settings from './pages/Settings';
import PetitionView from './pages/PetitionView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/:id" element={<CaseDetails />} />
          <Route path="cases/:id/petition" element={<PetitionView />} />
          <Route path="create-case" element={<CreateCase />} />
          <Route path="documents" element={<DocumentUpload />} />
          <Route path="assistant" element={<AIAssistant />} />
          <Route path="health" element={<HealthDashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}