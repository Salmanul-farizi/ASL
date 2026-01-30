
import React, { useState, useEffect } from 'react';
import { dataStore } from './services/dataStore';
import Layout from './components/Layout';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import AdminPlayers from './components/AdminPlayers';
import AdminTeams from './components/AdminTeams';
import AdminTournaments from './components/AdminTournaments';
import AdminMatches from './components/AdminMatches';
import AdminNews from './components/AdminNews';
import AdminTable from './components/AdminTable';
import PublicHome from './components/PublicHome';
import PublicFixtures from './components/PublicFixtures';
import PublicTable from './components/PublicTable';
import PublicNews from './components/PublicNews';
import PublicTeamProfile from './components/PublicTeamProfile';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(dataStore.isAdminLoggedIn());
  const [activeTab, setActiveTab] = useState(isAdmin ? 'dashboard' : 'home');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    dataStore.seedInitialData();
  }, []);

  const handleLogin = () => {
    dataStore.loginAdmin();
    setIsAdmin(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    dataStore.logoutAdmin();
    setIsAdmin(false);
    setActiveTab('home');
  };

  const navigateToTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    setActiveTab('team-profile');
  };

  const renderContent = () => {
    if (selectedTeamId && activeTab === 'team-profile') {
      return <PublicTeamProfile teamId={selectedTeamId} onBack={() => setActiveTab('home')} />;
    }

    if (isAdmin) {
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard />;
        case 'players': return <AdminPlayers />;
        case 'teams': return <AdminTeams />;
        case 'tournaments': return <AdminTournaments />;
        case 'matches': return <AdminMatches />;
        case 'table': return <AdminTable />;
        case 'news': return <AdminNews />;
        default: return <AdminDashboard />;
      }
    } else {
      switch (activeTab) {
        case 'home': return <PublicHome onTeamClick={navigateToTeam} />;
        case 'fixtures': return <PublicFixtures />;
        case 'table': return <PublicTable />;
        case 'news': return <PublicNews isAdmin={false} />;
        case 'admin-login': return <Login onLogin={handleLogin} />;
        default: return <PublicHome onTeamClick={navigateToTeam} />;
      }
    }
  };

  return (
    <Layout 
      isAdmin={isAdmin} 
      activeTab={activeTab} 
      setActiveTab={(tab) => {
        setSelectedTeamId(null);
        setActiveTab(tab);
      }}
      onLogout={handleLogout}
    >
      {renderContent()}
      
      {!isAdmin && activeTab === 'home' && (
        <div className="mt-12 text-center pb-8">
          <button 
            onClick={() => setActiveTab('admin-login')}
            className="text-white/20 text-xs hover:text-white/40 transition-colors uppercase tracking-widest font-semibold"
          >
            Admin Access
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
