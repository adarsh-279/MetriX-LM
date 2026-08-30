import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import App from './App';
import Dashboard from './pages/Dashboard';
import EvaluationCases from './pages/EvaluationCases';
import CaseExecution from './pages/CaseExecution';
import Instruments from './pages/Instruments';
import Passport from './pages/Passport';
import ReviewWorkspace from './pages/ReviewWorkspace';
import Reports from './pages/Reports';
import ReportView from './pages/ReportView';
import EquipmentMaster from './pages/EquipmentMaster';
import RulesCatalogue from './pages/RulesCatalogue';
import AuditTrail from './pages/AuditTrail';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<EvaluationCases />} />
          <Route path="cases/new" element={<CaseExecution />} />
          <Route path="cases/:id/execute" element={<CaseExecution />} />
          <Route path="instruments" element={<Instruments />} />
          <Route path="instruments/:id/passport" element={<Passport />} />
          <Route path="review" element={<ReviewWorkspace />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:id" element={<ReportView />} />
          <Route path="equipment" element={<EquipmentMaster />} />
          <Route path="rules" element={<RulesCatalogue />} />
          <Route path="audit" element={<AuditTrail />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
