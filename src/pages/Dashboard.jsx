import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabaseClient';
import Sidebar from '../components/Sidebar';
import Telepros from '../components/Telepros';
import Agents from '../components/Agents';
import EvaluationAppel from '../components/EvaluationAppel';
import EvaluationAbsentRdv from '../components/EvaluationAbsentRdv';
import ListeEvaluations from '../components/ListeEvaluations';
import Stats from '../components/Stats';
import Debriefing from '../components/Debriefing';
import ListeDebriefings from '../components/ListeDebriefings';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('telepros');
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
      />
      
      <div className="dashboard-content-wrapper">
        <div className="dashboard-main">
          {activeTab === 'telepros' && <Telepros />}
          {activeTab === 'agents' && <Agents />}
          {activeTab === 'evaluation' && <EvaluationAppel />}
          {activeTab === 'evaluation-absent' && <EvaluationAbsentRdv />}
          {activeTab === 'liste-evaluations' && <ListeEvaluations />}
          {activeTab === 'stats' && <Stats />}
          {activeTab === 'debriefing' && <Debriefing />}
          {activeTab === 'liste-debriefings' && <ListeDebriefings />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
