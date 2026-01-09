import React, { useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';
import './ListeDebriefings.css';

function ListeDebriefings() {
  const [debriefings, setDebriefings] = useState([]);
  const [filteredDebriefings, setFilteredDebriefings] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedDebrief, setSelectedDebrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    agentId: '',
    dateDebut: '',
    dateFin: ''
  });

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
    fetchAgents();
    fetchDebriefings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, debriefings]);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('nom', { ascending: true });
      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    }
  };

  const fetchDebriefings = async () => {
    setLoading(true);
    try {
      // Récupérer les évaluations avec debriefing - Nouveau RDV
      const { data: nouveauRdvData, error: error1 } = await supabase
        .from('evaluations_appels')
        .select('*, agents(id, nom, prenom)')
        .not('commentaire_debrief', 'is', null)
        .order('date_debriefing', { ascending: false });

      // Récupérer les évaluations avec debriefing - Absent RDV
      const { data: absentRdvData, error: error2 } = await supabase
        .from('evaluations_absent_rdv')
        .select('*, agents(id, nom, prenom)')
        .not('commentaire_debrief', 'is', null)
        .order('date_debriefing', { ascending: false });

      if (error1) throw error1;
      if (error2) throw error2;

      const allDebriefings = [
        ...(nouveauRdvData || []).map(e => ({ ...e, type_evaluation: 'nouveau_rdv' })),
        ...(absentRdvData || []).map(e => ({ ...e, type_evaluation: 'absent_rdv' }))
      ].filter(e => e.commentaire_debrief && e.commentaire_debrief.trim() !== '')
       .sort((a, b) => new Date(b.date_debriefing || b.date_evaluation) - new Date(a.date_debriefing || a.date_evaluation));

      setDebriefings(allDebriefings);
      setFilteredDebriefings(allDebriefings);
    } catch (error) {
      console.error('Erreur chargement debriefings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...debriefings];

    if (filters.agentId) {
      filtered = filtered.filter(d => d.agent_id === filters.agentId);
    }

    if (filters.dateDebut) {
      filtered = filtered.filter(d => {
        const dateDebrief = d.date_debriefing || d.date_evaluation;
        return dateDebrief >= filters.dateDebut;
      });
    }

    if (filters.dateFin) {
      filtered = filtered.filter(d => {
        const dateDebrief = d.date_debriefing || d.date_evaluation;
        return dateDebrief <= filters.dateFin;
      });
    }

    setFilteredDebriefings(filtered);
  };

  const resetFilters = () => {
    setFilters({
      agentId: '',
      dateDebut: '',
      dateFin: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getScoreColor = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 90) return '#22c55e';
    if (numScore >= 75) return '#3b82f6';
    if (numScore >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 90) return 'Excellent';
    if (numScore >= 75) return 'Conforme';
    if (numScore >= 60) return 'À améliorer';
    return 'Non conforme';
  };

  const getNoteColor = (note, maxPoints) => {
    const percentage = (note / maxPoints) * 100;
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getCriteres = (debrief) => {
    if (!debrief) return [];
    return debrief.type_evaluation === 'nouveau_rdv' 
      ? CRITERES_NOUVEAU_RDV 
      : CRITERES_ABSENT_RDV;
  };

  const getAgentName = (debrief) => {
    if (debrief.agents) {
      return `${debrief.agents.prenom} ${debrief.agents.nom}`;
    }
    return 'Agent inconnu';
  };

  return (
    <div className="liste-debriefings-container">
      <div className="liste-header">
        <h2>Liste des Debriefings</h2>
        <span className="debrief-count">{filteredDebriefings.length} debriefing(s)</span>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Agent</label>
            <select 
              value={filters.agentId} 
              onChange={(e) => setFilters(prev => ({ ...prev, agentId: e.target.value }))}
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
              value={filters.dateDebut}
              onChange={(e) => setFilters(prev => ({ ...prev, dateDebut: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label>Date fin</label>
            <input
              type="date"
              value={filters.dateFin}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFin: e.target.value }))}
            />
          </div>

          <button className="btn-reset" onClick={resetFilters}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="debriefings-content">
        {/* Liste des debriefings */}
        <div className="debriefings-list-panel">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement...</p>
            </div>
          ) : filteredDebriefings.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <p>Aucun debriefing trouvé</p>
            </div>
          ) : (
            <div className="debriefings-list">
              {filteredDebriefings.map(debrief => (
                <div 
                  key={`${debrief.type_evaluation}-${debrief.id}`}
                  className={`debrief-item ${selectedDebrief?.id === debrief.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDebrief(debrief)}
                >
                  <div className="debrief-item-header">
                    <span className={`type-badge ${debrief.type_evaluation}`}>
                      {debrief.type_evaluation === 'nouveau_rdv' ? 'Nouveau RDV' : 'Absent RDV'}
                    </span>
                    <span className="debrief-date">
                      {formatDate(debrief.date_debriefing || debrief.date_evaluation)}
                    </span>
                  </div>
                  <div className="debrief-item-agent">
                    <strong>{getAgentName(debrief)}</strong>
                  </div>
                  <div className="debrief-item-client">
                    {debrief.nom_client || 'Client inconnu'}
                  </div>
                  <div className="debrief-item-footer">
                    <span 
                      className="score-badge"
                      style={{ background: getScoreColor(debrief.note_finale) }}
                    >
                      {debrief.note_finale} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Détails du debriefing */}
        <div className="debrief-details-panel">
          {!selectedDebrief ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <line x1="9" y1="10" x2="15" y2="10"/>
                <line x1="12" y1="7" x2="12" y2="13"/>
              </svg>
              <p>Sélectionnez un debriefing pour voir les détails</p>
            </div>
          ) : (
            <div className="debrief-details">
              {/* En-tête */}
              <div className="details-header">
                <div className="details-score" style={{ background: getScoreColor(selectedDebrief.note_finale) }}>
                  <span className="score-value">{selectedDebrief.note_finale}</span>
                  <span className="score-label">{getScoreLabel(selectedDebrief.note_finale)}</span>
                </div>
                <div className="details-info">
                  <h3>{getAgentName(selectedDebrief)}</h3>
                  <p><strong>Client :</strong> {selectedDebrief.nom_client || '-'}</p>
                  <p><strong>Téléphone :</strong> {selectedDebrief.telephone_client || '-'}</p>
                  <p><strong>Date évaluation :</strong> {formatDate(selectedDebrief.date_evaluation)}</p>
                  <p><strong>Date debriefing :</strong> {formatDate(selectedDebrief.date_debriefing)}</p>
                  <p><strong>Type :</strong> {selectedDebrief.type_evaluation === 'nouveau_rdv' ? 'Nouveau RDV' : 'Absent RDV'}</p>
                </div>
              </div>

              {/* Commentaire de debriefing */}
              <div className="details-section">
                <h4>💬 Commentaire de debriefing</h4>
                <div className="debrief-comment">
                  {selectedDebrief.commentaire_debrief}
                </div>
              </div>

              {/* Récapitulatif de l'appel */}
              {selectedDebrief.recapitulatif && (
                <div className="details-section">
                  <h4>📝 Récapitulatif de l'appel</h4>
                  <div className="recap-content">
                    {selectedDebrief.recapitulatif}
                  </div>
                </div>
              )}

              {/* Audio */}
              {selectedDebrief.audio_url && (
                <div className="details-section">
                  <h4>🎧 Audio de l'appel</h4>
                  <div className="audio-container">
                    <audio controls className="audio-player">
                      <source src={selectedDebrief.audio_url} type="audio/mpeg" />
                    </audio>
                    <a 
                      href={selectedDebrief.audio_url} 
                      download
                      className="btn-download"
                    >
                      Télécharger
                    </a>
                  </div>
                </div>
              )}

              {/* Grille des notes */}
              <div className="details-section">
                <h4>📋 Détail des notes</h4>
                <div className="notes-grid">
                  {getCriteres(selectedDebrief).map(critere => {
                    const note = selectedDebrief[`note_${critere.id}`] || 0;
                    return (
                      <div key={critere.id} className="note-item">
                        <span className="note-label">{critere.label}</span>
                        <span 
                          className="note-value"
                          style={{ background: getNoteColor(note, critere.maxPoints) }}
                        >
                          {note}/{critere.maxPoints}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListeDebriefings;
