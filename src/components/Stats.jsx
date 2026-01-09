import React, { useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';
import './Stats.css';

function Stats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    excellent: 0,
    conforme: 0,
    aAmeliorer: 0,
    nonConforme: 0,
    net: 0
  });
  const [statsFilter, setStatsFilter] = useState({
    dateDebut: '',
    dateFin: '',
    agentId: ''
  });
  const [allEvaluationsData, setAllEvaluationsData] = useState([]);

  // Section 2: Classement agents
  const [agents, setAgents] = useState([]);
  const [agentRanking, setAgentRanking] = useState([]);
  const [rankingFilter, setRankingFilter] = useState({
    dateDebut: '',
    dateFin: ''
  });

  // Section 3: Détails agent
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [agentEvolution, setAgentEvolution] = useState([]);
  const [agentStrengths, setAgentStrengths] = useState({ nouveauRdv: [], absentRdv: [] });
  const [agentWeaknesses, setAgentWeaknesses] = useState({ nouveauRdv: [], absentRdv: [] });

  // Critères pour Nouveau RDV
  const CRITERES_NOUVEAU_RDV = [
    { id: 'presentation', label: 'Se présenter', maxPoints: 5 },
    { id: 'identite_client', label: "Confirmer l'identité du client", maxPoints: 5 },
    { id: 'besoin_client', label: 'Comprendre le besoin client', maxPoints: 5 },
    { id: 'etapes', label: 'Décrire les étapes sans détails', maxPoints: 10 },
    { id: 'localisation', label: 'Vérifier la localisation', maxPoints: 5 },
    { id: 'fixer_rdv', label: 'Fixer un RDV', maxPoints: 5 },
    { id: 'sms_appel', label: "Envoyer un SMS pendant l'appel", maxPoints: 10 },
    { id: 'documents_recap', label: 'Rappeler les documents et le récapitulatif', maxPoints: 5 },
    { id: 'appel_confirmation', label: "Informer sur l'appel de confirmation", maxPoints: 5 },
    { id: 'reception_sms', label: 'Vérifier la réception du SMS', maxPoints: 10 },
    { id: 'ton_voix', label: 'Le ton de la voix', maxPoints: 7 },
    { id: 'ecoute_active', label: 'Écoute active', maxPoints: 7 },
    { id: 'reponse_questions', label: 'Répondre aux questions', maxPoints: 7 },
    { id: 'intelligence_emotionnelle', label: 'Intelligence émotionnelle', maxPoints: 7 },
    { id: 'adaptation_client', label: "S'adapter au niveau du client", maxPoints: 7 },
  ];

  // Critères pour Absent RDV
  const CRITERES_ABSENT_RDV = [
    { id: 'presentation', label: 'Se présenter', maxPoints: 5 },
    { id: 'identite_client', label: "Confirmer l'identité du client", maxPoints: 5 },
    { id: 'mention_rdv_avant', label: "Mentionner qu'il avait un RDV avant", maxPoints: 10 },
    { id: 'proposer_autre_rdv', label: 'Proposer un autre RDV', maxPoints: 10 },
    { id: 'importance_presence', label: "Lui faire comprendre l'importance de sa présence", maxPoints: 10 },
    { id: 'sms_appel', label: "Envoyer un SMS pendant l'appel", maxPoints: 10 },
    { id: 'recapitulatif_documents', label: 'Récapitulatif + document', maxPoints: 5 },
    { id: 'reception_sms', label: 'Vérifier la réception du SMS', maxPoints: 10 },
    { id: 'ton_voix', label: 'Le ton de la voix', maxPoints: 7 },
    { id: 'ecoute_active', label: 'Écoute active', maxPoints: 7 },
    { id: 'reponse_questions', label: 'Répondre aux questions', maxPoints: 7 },
    { id: 'intelligence_emotionnelle', label: 'Intelligence émotionnelle', maxPoints: 7 },
    { id: 'adaptation_client', label: "S'adapter au niveau du client", maxPoints: 7 },
  ];

  useEffect(() => {
    fetchStats();
    fetchAgents();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les évaluations des deux tables avec note_finale, date_evaluation et agent_id
      const { data: nouveauRdvData, error: error1 } = await supabase
        .from('evaluations_appels')
        .select('note_finale, date_evaluation, agent_id');

      const { data: absentRdvData, error: error2 } = await supabase
        .from('evaluations_absent_rdv')
        .select('note_finale, date_evaluation, agent_id');

      if (error1) throw error1;
      if (error2) throw error2;

      const allEvaluations = [...(nouveauRdvData || []), ...(absentRdvData || [])];
      setAllEvaluationsData(allEvaluations);
      
      // Calculer les stats initiales (toutes les évaluations)
      calculateStats(allEvaluations);

    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (evaluations, dateDebut = '', dateFin = '', agentId = '') => {
    let filtered = [...evaluations];

    // Appliquer les filtres de date
    if (dateDebut) {
      filtered = filtered.filter(e => e.date_evaluation >= dateDebut);
    }
    if (dateFin) {
      filtered = filtered.filter(e => e.date_evaluation <= dateFin);
    }
    // Appliquer le filtre par agent
    if (agentId) {
      filtered = filtered.filter(e => e.agent_id === agentId);
    }

    // Compter par catégorie de score
    let excellent = 0;
    let conforme = 0;
    let aAmeliorer = 0;
    let nonConforme = 0;

    filtered.forEach(evaluation => {
      const score = parseFloat(evaluation.note_finale) || 0;
      if (score >= 90) {
        excellent++;
      } else if (score >= 75) {
        conforme++;
      } else if (score >= 60) {
        aAmeliorer++;
      } else {
        nonConforme++;
      }
    });

    const total = filtered.length;
    const net = total - nonConforme;

    setStats({
      total,
      excellent,
      conforme,
      aAmeliorer,
      nonConforme,
      net
    });
  };

  const applyStatsFilter = () => {
    calculateStats(allEvaluationsData, statsFilter.dateDebut, statsFilter.dateFin, statsFilter.agentId);
  };

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setStatsQuickFilter = (period) => {
    const now = new Date();
    
    let dateDebut = '';
    let dateFin = '';

    if (period === 'today') {
      // Aujourd'hui : début et fin = aujourd'hui
      const todayStr = formatDateLocal(now);
      dateDebut = todayStr;
      dateFin = todayStr;
    } else if (period === 'week') {
      // Cette semaine : lundi à dimanche
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - diffToMonday);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Dimanche
      
      dateDebut = formatDateLocal(weekStart);
      dateFin = formatDateLocal(weekEnd);
    } else if (period === 'month') {
      // Ce mois : 1er au dernier jour du mois
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Dernier jour du mois
      
      dateDebut = formatDateLocal(monthStart);
      dateFin = formatDateLocal(monthEnd);
    }

    setStatsFilter(prev => ({ ...prev, dateDebut, dateFin }));
    calculateStats(allEvaluationsData, dateDebut, dateFin, statsFilter.agentId);
  };

  const resetStatsFilter = () => {
    setStatsFilter({ dateDebut: '', dateFin: '', agentId: '' });
    calculateStats(allEvaluationsData);
  };

  useEffect(() => {
    applyStatsFilter();
  }, [statsFilter.dateDebut, statsFilter.dateFin, statsFilter.agentId]);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('nom', { ascending: true });
      if (error) throw error;
      setAgents(data || []);
      // Charger le classement initial
      fetchAgentRanking(data || []);
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    }
  };

  const fetchAgentRanking = async (agentsList = agents) => {
    try {
      // Récupérer les évaluations des deux tables
      const { data: nouveauRdvData, error: error1 } = await supabase
        .from('evaluations_appels')
        .select('agent_id, note_finale, date_evaluation');

      const { data: absentRdvData, error: error2 } = await supabase
        .from('evaluations_absent_rdv')
        .select('agent_id, note_finale, date_evaluation');

      if (error1) throw error1;
      if (error2) throw error2;

      let allEvaluations = [...(nouveauRdvData || []), ...(absentRdvData || [])];

      // Appliquer les filtres de date
      if (rankingFilter.dateDebut) {
        allEvaluations = allEvaluations.filter(e => 
          e.date_evaluation && new Date(e.date_evaluation) >= new Date(rankingFilter.dateDebut)
        );
      }
      if (rankingFilter.dateFin) {
        allEvaluations = allEvaluations.filter(e => 
          e.date_evaluation && new Date(e.date_evaluation) <= new Date(rankingFilter.dateFin)
        );
      }

      // Calculer la moyenne par agent
      const agentScores = {};
      allEvaluations.forEach(evaluation => {
        if (evaluation.agent_id) {
          if (!agentScores[evaluation.agent_id]) {
            agentScores[evaluation.agent_id] = { total: 0, count: 0 };
          }
          agentScores[evaluation.agent_id].total += parseFloat(evaluation.note_finale) || 0;
          agentScores[evaluation.agent_id].count += 1;
        }
      });

      // Créer le classement
      const ranking = agentsList
        .map(agent => {
          const scores = agentScores[agent.id];
          return {
            id: agent.id,
            nom: `${agent.prenom} ${agent.nom}`,
            moyenne: scores ? (scores.total / scores.count).toFixed(1) : 0,
            nbEvaluations: scores ? scores.count : 0
          };
        })
        .filter(agent => agent.nbEvaluations > 0)
        .sort((a, b) => parseFloat(b.moyenne) - parseFloat(a.moyenne));

      setAgentRanking(ranking);
    } catch (error) {
      console.error('Erreur calcul classement:', error);
    }
  };

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    if (agents.length > 0) {
      fetchAgentRanking();
    }
  }, [rankingFilter]);

  const handleRankingFilterChange = (e) => {
    const { name, value } = e.target;
    setRankingFilter(prev => ({ ...prev, [name]: value }));
  };

  const setQuickFilter = (period) => {
    const now = new Date();
    
    let dateDebut = '';
    let dateFin = '';

    if (period === 'today') {
      // Aujourd'hui : début et fin = aujourd'hui
      const todayStr = formatDateLocal(now);
      dateDebut = todayStr;
      dateFin = todayStr;
    } else if (period === 'week') {
      // Cette semaine : lundi à dimanche
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - diffToMonday);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Dimanche
      
      dateDebut = formatDateLocal(weekStart);
      dateFin = formatDateLocal(weekEnd);
    } else if (period === 'month') {
      // Ce mois : 1er au dernier jour du mois
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      dateDebut = formatDateLocal(monthStart);
      dateFin = formatDateLocal(monthEnd);
    }

    setRankingFilter({ dateDebut, dateFin });
  };

  const resetRankingFilter = () => {
    setRankingFilter({ dateDebut: '', dateFin: '' });
  };

  const getBarColor = (index, total) => {
    const colors = [
      '#22c55e', // 1er - Vert
      '#3b82f6', // 2ème - Bleu
      '#8b5cf6', // 3ème - Violet
      '#f59e0b', // 4ème - Orange
      '#ef4444', // 5ème+ - Rouge
    ];
    if (index === 0) return colors[0];
    if (index === 1) return colors[1];
    if (index === 2) return colors[2];
    if (index < total / 2) return colors[3];
    return colors[4];
  };

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  // Section 3: Charger les détails d'un agent
  const fetchAgentDetails = async (agentId) => {
    if (!agentId) {
      setAgentEvolution([]);
      setAgentStrengths({ nouveauRdv: [], absentRdv: [] });
      setAgentWeaknesses({ nouveauRdv: [], absentRdv: [] });
      return;
    }

    try {
      // Récupérer les évaluations Nouveau RDV
      const { data: nouveauRdvData, error: error1 } = await supabase
        .from('evaluations_appels')
        .select('*')
        .eq('agent_id', agentId)
        .order('date_evaluation', { ascending: true })
        .limit(50);

      // Récupérer les évaluations Absent RDV
      const { data: absentRdvData, error: error2 } = await supabase
        .from('evaluations_absent_rdv')
        .select('*')
        .eq('agent_id', agentId)
        .order('date_evaluation', { ascending: true })
        .limit(50);

      if (error1) throw error1;
      if (error2) throw error2;

      // Combiner et trier pour le diagramme d'évolution
      const allEvals = [
        ...(nouveauRdvData || []).map(e => ({ ...e, type: 'nouveau_rdv' })),
        ...(absentRdvData || []).map(e => ({ ...e, type: 'absent_rdv' }))
      ].sort((a, b) => new Date(a.date_evaluation) - new Date(b.date_evaluation)).slice(-50);

      setAgentEvolution(allEvals);

      // Calculer les points forts et faibles pour Nouveau RDV
      if (nouveauRdvData && nouveauRdvData.length > 0) {
        const criteresStats = CRITERES_NOUVEAU_RDV.map(critere => {
          const notes = nouveauRdvData.map(e => e[`note_${critere.id}`] || 0);
          const moyenne = notes.reduce((a, b) => a + b, 0) / notes.length;
          const pourcentage = (moyenne / critere.maxPoints) * 100;
          return { ...critere, moyenne, pourcentage };
        });

        const sorted = [...criteresStats].sort((a, b) => b.pourcentage - a.pourcentage);
        const strengths = sorted.filter(c => c.pourcentage >= 75).slice(0, 5);
        const strengthIds = strengths.map(s => s.id);
        // Points à améliorer = tous les critères qui ne sont pas des points forts, triés du plus faible
        const weaknesses = sorted.filter(c => !strengthIds.includes(c.id)).reverse().slice(0, 5);
        setAgentStrengths(prev => ({ ...prev, nouveauRdv: strengths }));
        setAgentWeaknesses(prev => ({ ...prev, nouveauRdv: weaknesses }));
      } else {
        setAgentStrengths(prev => ({ ...prev, nouveauRdv: [] }));
        setAgentWeaknesses(prev => ({ ...prev, nouveauRdv: [] }));
      }

      // Calculer les points forts et faibles pour Absent RDV
      if (absentRdvData && absentRdvData.length > 0) {
        const criteresStats = CRITERES_ABSENT_RDV.map(critere => {
          const notes = absentRdvData.map(e => e[`note_${critere.id}`] || 0);
          const moyenne = notes.reduce((a, b) => a + b, 0) / notes.length;
          const pourcentage = (moyenne / critere.maxPoints) * 100;
          return { ...critere, moyenne, pourcentage };
        });

        const sorted = [...criteresStats].sort((a, b) => b.pourcentage - a.pourcentage);
        const strengths = sorted.filter(c => c.pourcentage >= 75).slice(0, 5);
        const strengthIds = strengths.map(s => s.id);
        // Points à améliorer = tous les critères qui ne sont pas des points forts, triés du plus faible
        const weaknesses = sorted.filter(c => !strengthIds.includes(c.id)).reverse().slice(0, 5);
        setAgentStrengths(prev => ({ ...prev, absentRdv: strengths }));
        setAgentWeaknesses(prev => ({ ...prev, absentRdv: weaknesses }));
      } else {
        setAgentStrengths(prev => ({ ...prev, absentRdv: [] }));
        setAgentWeaknesses(prev => ({ ...prev, absentRdv: [] }));
      }

    } catch (error) {
      console.error('Erreur chargement détails agent:', error);
    }
  };

  // Charger les détails quand l'agent sélectionné change
  useEffect(() => {
    fetchAgentDetails(selectedAgentId);
  }, [selectedAgentId]);

  const getEvolutionColor = (score) => {
    if (score >= 90) return '#22c55e';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="stats-container">
        <div className="stats-loading">
          <div className="spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <h2>Statistiques</h2>

      {/* Section 1: Compteurs d'évaluations */}
      <div className="stats-section">
        <h3 className="section-title">
          <span className="section-icon">📊</span>
          Aperçu des évaluations
        </h3>

        {/* Filtres de date */}
        <div className="stats-filters">
          <div className="date-filters">
            <div className="filter-group">
              <label>Agent</label>
              <select
                value={statsFilter.agentId}
                onChange={(e) => setStatsFilter(prev => ({ ...prev, agentId: e.target.value }))}
              >
                <option value="">Tous les agents</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.prenom} {agent.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Date début</label>
              <input
                type="date"
                value={statsFilter.dateDebut}
                onChange={(e) => setStatsFilter(prev => ({ ...prev, dateDebut: e.target.value }))}
              />
            </div>
            <div className="filter-group">
              <label>Date fin</label>
              <input
                type="date"
                value={statsFilter.dateFin}
                onChange={(e) => setStatsFilter(prev => ({ ...prev, dateFin: e.target.value }))}
              />
            </div>
          </div>
          <div className="quick-filters">
            <button 
              className="quick-filter-btn"
              onClick={() => setStatsQuickFilter('today')}
            >
              Aujourd'hui
            </button>
            <button 
              className="quick-filter-btn"
              onClick={() => setStatsQuickFilter('week')}
            >
              Cette semaine
            </button>
            <button 
              className="quick-filter-btn"
              onClick={() => setStatsQuickFilter('month')}
            >
              Ce mois
            </button>
            <button 
              className="reset-filter-btn"
              onClick={resetStatsFilter}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Réinitialiser
            </button>
          </div>
        </div>
        
        <div className="stats-cards-grid">
          {/* Total évaluations */}
          <div className="stat-card stat-total">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total évaluations</span>
            </div>
          </div>

          {/* Excellent */}
          <div className="stat-card stat-excellent">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.excellent}</span>
              <span className="stat-label">Excellent (≥90)</span>
            </div>
          </div>

          {/* Conforme */}
          <div className="stat-card stat-conforme">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.conforme}</span>
              <span className="stat-label">Conforme (75-89)</span>
            </div>
          </div>

          {/* À améliorer */}
          <div className="stat-card stat-ameliorer">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.aAmeliorer}</span>
              <span className="stat-label">À améliorer (60-74)</span>
            </div>
          </div>

          {/* Non conforme */}
          <div className="stat-card stat-nonconforme">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.nonConforme}</span>
              <span className="stat-label">Non conforme (&lt;60)</span>
            </div>
          </div>

          {/* Net */}
          <div className="stat-card stat-net">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="20" x2="12" y2="10"/>
                <line x1="18" y1="20" x2="18" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="16"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.net}</span>
              <span className="stat-label">Évaluations Net</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Classement des agents */}
      <div className="stats-section">
        <h3 className="section-title">
          <span className="section-icon">🏆</span>
          Classement des agents
        </h3>

        {/* Filtres */}
        <div className="ranking-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Date début</label>
              <input
                type="date"
                name="dateDebut"
                value={rankingFilter.dateDebut}
                onChange={handleRankingFilterChange}
              />
            </div>
            <div className="filter-group">
              <label>Date fin</label>
              <input
                type="date"
                name="dateFin"
                value={rankingFilter.dateFin}
                onChange={handleRankingFilterChange}
              />
            </div>
          </div>
          
          <div className="quick-filters">
            <button 
              className={`quick-filter-btn ${rankingFilter.dateDebut === formatDateLocal(new Date()) ? 'active' : ''}`}
              onClick={() => setQuickFilter('today')}
            >
              Aujourd'hui
            </button>
            <button 
              className="quick-filter-btn"
              onClick={() => setQuickFilter('week')}
            >
              Cette semaine
            </button>
            <button 
              className="quick-filter-btn"
              onClick={() => setQuickFilter('month')}
            >
              Ce mois
            </button>
            <button 
              className="reset-filter-btn"
              onClick={resetRankingFilter}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Graphique de classement */}
        {agentRanking.length === 0 ? (
          <div className="no-data">
            <p>Aucune évaluation trouvée pour cette période</p>
          </div>
        ) : (
          <div className="ranking-chart">
            {agentRanking.map((agent, index) => {
              const maxMoyenne = Math.max(...agentRanking.map(a => parseFloat(a.moyenne)));
              const barWidth = (parseFloat(agent.moyenne) / 100) * 100;
              const barColor = getBarColor(index, agentRanking.length);
              
              return (
                <div key={agent.id} className="ranking-bar-container">
                  <div className="ranking-position">
                    <span className={`medal ${index < 3 ? 'top-3' : ''}`}>
                      {getMedalEmoji(index)}
                    </span>
                  </div>
                  <div className="ranking-info">
                    <span className="agent-name">{agent.nom}</span>
                    <div className="bar-wrapper">
                      <div 
                        className="ranking-bar"
                        style={{ 
                          width: `${barWidth}%`,
                          background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)`
                        }}
                      >
                        <span className="bar-value">{agent.moyenne} pts</span>
                      </div>
                    </div>
                    <span className="eval-count">{agent.nbEvaluations} éval.</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: Détails agent */}
      <div className="stats-section">
        <h3 className="section-title">
          <span className="section-icon">👤</span>
          Détails par agent
        </h3>

        {/* Filtre par agent */}
        <div className="agent-filter">
          <label>Sélectionner un agent :</label>
          <select 
            value={selectedAgentId} 
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="agent-select"
          >
            <option value="">-- Choisir un agent --</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.prenom} {agent.nom}
              </option>
            ))}
          </select>
        </div>

        {!selectedAgentId ? (
          <div className="no-data">
            <p>Sélectionnez un agent pour voir ses statistiques détaillées</p>
          </div>
        ) : (
          <>
            {/* Diagramme d'évolution */}
            <div className="evolution-section">
              <h4 className="subsection-title">📈 Évolution des scores (50 dernières évaluations)</h4>
              {agentEvolution.length === 0 ? (
                <div className="no-data">
                  <p>Aucune évaluation trouvée pour cet agent</p>
                </div>
              ) : (
                <div className="evolution-chart">
                  <div className="chart-container">
                    <div className="chart-y-axis">
                      <span>100</span>
                      <span>75</span>
                      <span>50</span>
                      <span>25</span>
                      <span>0</span>
                    </div>
                    <div className="chart-bars">
                      {agentEvolution.map((evaluation, index) => {
                        const score = parseFloat(evaluation.note_finale) || 0;
                        const height = score;
                        const color = getEvolutionColor(score);
                        return (
                          <div key={index} className="chart-bar-wrapper" title={`${new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR')} - ${score} pts (${evaluation.type === 'nouveau_rdv' ? 'Nouveau RDV' : 'Absent RDV'})`}>
                            <div 
                              className="chart-bar"
                              style={{ 
                                height: `${height}%`,
                                background: color
                              }}
                            >
                              <span className={`bar-type ${evaluation.type}`}></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="chart-legend">
                    <span className="legend-item"><span className="legend-dot nouveau"></span> Nouveau RDV</span>
                    <span className="legend-item"><span className="legend-dot absent"></span> Absent RDV</span>
                    <span className="legend-item"><span className="legend-color" style={{background: '#22c55e'}}></span> Excellent (≥90)</span>
                    <span className="legend-item"><span className="legend-color" style={{background: '#3b82f6'}}></span> Conforme (75-89)</span>
                    <span className="legend-item"><span className="legend-color" style={{background: '#f59e0b'}}></span> À améliorer (60-74)</span>
                    <span className="legend-item"><span className="legend-color" style={{background: '#ef4444'}}></span> Non conforme (&lt;60)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Points forts et faibles par type */}
            <div className="strengths-weaknesses-container">
              {/* Nouveau RDV */}
              <div className="type-analysis">
                <h4 className="subsection-title">📞 Évaluation Nouveau RDV</h4>
                <div className="analysis-grid">
                  <div className="strengths-box">
                    <h5>💪 Points forts</h5>
                    {agentStrengths.nouveauRdv.length === 0 ? (
                      <p className="no-items">Aucune donnée disponible</p>
                    ) : (
                      <ul>
                        {agentStrengths.nouveauRdv.map((critere, index) => (
                          <li key={index}>
                            <span className="critere-name">{critere.label}</span>
                            <span className="critere-score" style={{background: '#22c55e'}}>{critere.moyenne.toFixed(1)}/{critere.maxPoints}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="weaknesses-box">
                    <h5>⚠️ Points à améliorer</h5>
                    {agentWeaknesses.nouveauRdv.length === 0 ? (
                      <p className="no-items">Aucune donnée disponible</p>
                    ) : (
                      <ul>
                        {agentWeaknesses.nouveauRdv.map((critere, index) => (
                          <li key={index}>
                            <span className="critere-name">{critere.label}</span>
                            <span className="critere-score" style={{background: '#ef4444'}}>{critere.moyenne.toFixed(1)}/{critere.maxPoints}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Absent RDV */}
              <div className="type-analysis">
                <h4 className="subsection-title">📅 Évaluation Absent RDV</h4>
                <div className="analysis-grid">
                  <div className="strengths-box">
                    <h5>💪 Points forts</h5>
                    {agentStrengths.absentRdv.length === 0 ? (
                      <p className="no-items">Aucune donnée disponible</p>
                    ) : (
                      <ul>
                        {agentStrengths.absentRdv.map((critere, index) => (
                          <li key={index}>
                            <span className="critere-name">{critere.label}</span>
                            <span className="critere-score" style={{background: '#22c55e'}}>{critere.moyenne.toFixed(1)}/{critere.maxPoints}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="weaknesses-box">
                    <h5>⚠️ Points à améliorer</h5>
                    {agentWeaknesses.absentRdv.length === 0 ? (
                      <p className="no-items">Aucune donnée disponible</p>
                    ) : (
                      <ul>
                        {agentWeaknesses.absentRdv.map((critere, index) => (
                          <li key={index}>
                            <span className="critere-name">{critere.label}</span>
                            <span className="critere-score" style={{background: '#ef4444'}}>{critere.moyenne.toFixed(1)}/{critere.maxPoints}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Placeholder pour les autres sections */}
      <div className="stats-section coming-soon">
        <h3 className="section-title">
          <span className="section-icon">🚀</span>
          Autres statistiques à venir...
        </h3>
        <p className="coming-soon-text">D'autres sections seront ajoutées ici</p>
      </div>
    </div>
  );
}

export default Stats;
