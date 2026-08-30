import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { AuthProvider } from './lib/authContext';

const getPageMeta = (pathname: string): { title: string; sub: string } => {
  if (pathname === '/') return { title: 'Compliance Dashboard', sub: 'Laboratory Overview & OIML R 76 Evaluation Health' };
  if (pathname === '/cases') return { title: 'Evaluation Cases', sub: 'Active & Historical Type-Evaluation Workflows' };
  if (pathname === '/cases/new') return { title: 'New Evaluation Case', sub: 'Configure & Execute NAWI Metrological Test' };
  if (pathname.includes('/execute')) return { title: 'Test Execution Workspace', sub: 'Record Observations & Run Deterministic Rules' };
  if (pathname === '/instruments') return { title: 'Instruments Master', sub: 'Registered NAWIs & Digital Passports' };
  if (pathname.includes('/passport')) return { title: 'Instrument Digital Passport', sub: 'Complete Metrological Profile & Evaluation History' };
  if (pathname === '/review') return { title: 'Reviewer Workspace', sub: 'Metrologist Inspection, Approval & Locking' };
  if (pathname === '/reports') return { title: 'Reports Repository', sub: 'Standardized OIML R 76-2 Test Reports' };
  if (pathname.startsWith('/reports/')) return { title: 'Test Report Certificate', sub: 'OIML R 76-2 Standardized Type-Evaluation Format' };
  if (pathname === '/equipment') return { title: 'Calibration Traceability', sub: 'Standard Mass Sets & Environmental Instruments' };
  if (pathname === '/rules') return { title: 'OIML Rules Catalogue', sub: 'Versioned Metrological Standards & Clause Definitions' };
  if (pathname === '/audit') return { title: 'Audit Trail', sub: 'Immutable Log of Laboratory Actions & Changes' };
  return { title: 'MetriX-LM', sub: 'OIML R 76 Type-Evaluation Platform' };
};

export default function App() {
  const location = useLocation();
  const { title, sub } = getPageMeta(location.pathname);

  return (
    <AuthProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="main-area">
          <Navbar title={title} sub={sub} />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
