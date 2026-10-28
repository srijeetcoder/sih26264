// OneDesk — Main Application Container
// AICTE Cross-Bureau Case Monitoring Dashboard

import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, type ViewName } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Overview } from './components/Overview';
import { Register } from './components/Register';
import { Institutions, InstitutionProfile } from './components/Institutions';
import { CaseDetail } from './components/CaseDetail';
import { OverlapWatch } from './components/OverlapWatch';
import { Reports } from './components/Reports';
import { ActivityLog } from './components/ActivityLog';
import { SettingsView } from './components/Settings';
import { AuthScreen } from './components/AuthScreen';
import { LodgeComplaintModal } from './components/LodgeComplaintModal';

function AppContent() {
  const { currentUser } = useApp();
  const [currentView, setCurrentView] = useState<ViewName>('overview');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CASE-2024-001');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('INST-0042');
  const [isLodgeModalOpen, setIsLodgeModalOpen] = useState(false);

  // Unified navigation router
  const handleNavigate = (view: ViewName, payload?: unknown) => {
    if (view === 'case-detail' && typeof payload === 'string') {
      setSelectedCaseId(payload);
    }
    if (view === 'institution-profile' && typeof payload === 'string') {
      setSelectedInstitutionId(payload);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is not authenticated, display the cinematic Enterprise Auth Screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="app-shell">
      {/* Collapsible Institutional Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Main Workspace */}
      <main className="main-content">
        {/* Universal Topbar */}
        <Topbar
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenLodgeModal={() => setIsLodgeModalOpen(true)}
        />

        {/* Dynamic Route View */}
        {currentView === 'overview' && (
          <Overview onNavigate={handleNavigate} />
        )}

        {currentView === 'register' && (
          <Register
            onNavigate={handleNavigate}
            onOpenLodgeModal={() => setIsLodgeModalOpen(true)}
          />
        )}

        {currentView === 'institutions' && (
          <Institutions onNavigate={handleNavigate} />
        )}

        {currentView === 'institution-profile' && (
          <InstitutionProfile
            institutionId={selectedInstitutionId}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'case-detail' && (
          <CaseDetail
            caseId={selectedCaseId}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'overlap-watch' && (
          <OverlapWatch onNavigate={handleNavigate} />
        )}

        {currentView === 'reports' && (
          <Reports />
        )}

        {currentView === 'activity-log' && (
          <ActivityLog onNavigate={handleNavigate} />
        )}

        {currentView === 'settings' && (
          <SettingsView />
        )}

        {/* Global Live Complaint Modal */}
        <LodgeComplaintModal
          isOpen={isLodgeModalOpen}
          onClose={() => setIsLodgeModalOpen(false)}
          onCaseCreated={(caseId) => {
            setIsLodgeModalOpen(false);
            handleNavigate('case-detail', caseId);
          }}
        />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
