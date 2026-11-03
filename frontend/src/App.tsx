import React, { useState } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { RawOutputDrawer } from './components/layout/RawOutputDrawer';
import { DashboardPage } from './pages/DashboardPage';
import { ScannerPage } from './pages/ScannerPage';
import { NewsPage } from './pages/NewsPage';
import { PipelinePage } from './pages/PipelinePage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalystPage } from './pages/AnalystPage';
import { SettingsPage } from './pages/SettingsPage';
import { HowToPage } from './pages/HowToPage';
import { TipsPage } from './pages/TipsPage';
import { AdminPage } from './pages/AdminPage';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const { rawLogs } = useUser();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'scanner':
        return <ScannerPage onNavigate={setActiveTab} />;
      case 'news':
        return <NewsPage />;
      case 'pipeline':
        return <PipelinePage />;
      case 'alerts':
        return <AlertsPage />;
      case 'analyst':
        return <AnalystPage />;
      case 'how-to':
        return <HowToPage />;
      case 'tips':
        return <TipsPage />;
      case 'admin':
        return <AdminPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleTerminal={() => setShowTerminal(prev => !prev)}
          hasLogs={rawLogs.length > 0}
        />
        <main className="flex-1 overflow-y-auto pb-16">
          {renderActivePage()}
        </main>
      </div>
      <RawOutputDrawer
        isOpen={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <UserProvider>
      <MainLayout />
    </UserProvider>
  );
};

export default App;
