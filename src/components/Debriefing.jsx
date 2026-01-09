import React, { useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';
import './Debriefing.css';

function Debriefing() {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [dateDebriefing, setDateDebriefing] = useState(new Date().toISOString().split('T')[0]);
  const [commentaireDebrief, setCommentaireDebrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      fetchEvaluations(selectedAgentId);
    } else {
      setEvaluations([]);
      setFilteredEvaluations([]);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    filterEvaluations();
  }, [searchTerm, evaluations]);

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

  const fetchEvaluations = async (agentId) => {
    setLoading(true);
    try {
      // Récupérer les évaluations Nouveau RDV
      const { data: nouveauRdvData, error: error1 } = await supabase
        .from('evaluations_appels')
        .select('*')
        .eq('agent_id', agentId)
        .order('date_evaluation', { ascending: false });

      // Récupérer les évaluations Absent RDV
      const { data: absentRdvData, error: error2 } = await supabase
        .from('evaluations_absent_rdv')
        .select('*')
        .eq('agent_id', agentId)
        .order('date_evaluation', { ascending: false });

      if (error1) throw error1;
      if (error2) throw error2;

      const allEvaluations = [
        ...(nouveauRdvData || []).map(e => ({ ...e, type_evaluation: 'nouveau_rdv' })),
        ...(absentRdvData || []).map(e => ({ ...e, type_evaluation: 'absent_rdv' }))
      ].sort((a, b) => new Date(b.date_evaluation) - new Date(a.date_evaluation));

      setEvaluations(allEvaluations);
      setFilteredEvaluations(allEvaluations);
    } catch (error) {
      console.error('Erreur chargement évaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvaluations = () => {
    if (!searchTerm.trim()) {
      setFilteredEvaluations(evaluations);
      return;
    }

    const search = searchTerm.toLowerCase();
    const filtered = evaluations.filter(evaluation => {
      const nomClient = (evaluation.nom_client || '').toLowerCase();
      const telephone = (evaluation.telephone_client || '').toLowerCase();
      return nomClient.includes(search) || telephone.includes(search);
    });
    setFilteredEvaluations(filtered);
  };

  const selectEvaluation = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setCommentaireDebrief(evaluation.commentaire_debrief || '');
    setSuccess('');
    setError('');
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

  const getCriteres = () => {
    if (!selectedEvaluation) return [];
    return selectedEvaluation.type_evaluation === 'nouveau_rdv' 
      ? CRITERES_NOUVEAU_RDV 
      : CRITERES_ABSENT_RDV;
  };

  const saveDebriefing = async () => {
    if (!selectedEvaluation) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const table = selectedEvaluation.type_evaluation === 'nouveau_rdv' 
        ? 'evaluations_appels' 
        : 'evaluations_absent_rdv';

      const { error } = await supabase
        .from(table)
        .update({ 
          commentaire_debrief: commentaireDebrief,
          date_debriefing: dateDebriefing
        })
        .eq('id', selectedEvaluation.id);

      if (error) throw error;

      setSuccess('Debriefing enregistré avec succès !');
      
      // Mettre à jour l'évaluation dans la liste
      setEvaluations(prev => prev.map(e => 
        e.id === selectedEvaluation.id 
          ? { ...e, commentaire_debrief: commentaireDebrief, date_debriefing: dateDebriefing }
          : e
      ));
      setSelectedEvaluation(prev => ({ 
        ...prev, 
        commentaire_debrief: commentaireDebrief,
        date_debriefing: dateDebriefing
      }));

    } catch (error) {
      console.error('Erreur sauvegarde debriefing:', error);
      setError('Erreur lors de la sauvegarde du debriefing');
    } finally {
      setSaving(false);
    }
  };

  const getAgentName = () => {
    const agent = agents.find(a => a.id === selectedAgentId);
    return agent ? `${agent.prenom} ${agent.nom}` : '';
  };

  return (
    <div className="debriefing-container">
      <h2>Debriefing</h2>

      {/* Sélection agent et date */}
      <div className="debriefing-header">
        <div className="header-row">
          <div className="form-group">
            <label>Agent</label>
            <select 
              value={selectedAgentId} 
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                setSelectedEvaluation(null);
                setCommentaireDebrief('');
              }}
              className="agent-select"
            >
              <option value="">-- Sélectionner un agent --</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.prenom} {agent.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date de debriefing</label>
            <input
              type="date"
              value={dateDebriefing}
              onChange={(e) => setDateDebriefing(e.target.value)}
              className="date-input"
            />
          </div>
        </div>

        {selectedAgentId && (
          <div className="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              placeholder="Rechercher par nom ou numéro client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="debriefing-content">
        {/* Liste des évaluations */}
        <div className="evaluations-panel">
          <h3>Appels à débriefer ({filteredEvaluations.length})</h3>
          
          {!selectedAgentId ? (
            <div className="empty-state">
              <p>Sélectionnez un agent pour voir ses évaluations</p>
            </div>
          ) : loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement...</p>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="empty-state">
              <p>Aucune évaluation trouvée</p>
            </div>
          ) : (
            <div className="evaluations-list">
              {filteredEvaluations.map(evaluation => (
                <div 
                  key={`${evaluation.type_evaluation}-${evaluation.id}`}
                  className={`evaluation-item ${selectedEvaluation?.id === evaluation.id ? 'selected' : ''} ${evaluation.commentaire_debrief ? 'debriefed' : ''}`}
                  onClick={() => selectEvaluation(evaluation)}
                >
                  <div className="eval-header">
                    <span className={`type-badge ${evaluation.type_evaluation}`}>
                      {evaluation.type_evaluation === 'nouveau_rdv' ? 'Nouveau RDV' : 'Absent RDV'}
                    </span>
                    <span className="eval-date">{formatDate(evaluation.date_evaluation)}</span>
                  </div>
                  <div className="eval-client">
                    <strong>{evaluation.nom_client || 'Client inconnu'}</strong>
                    {evaluation.telephone_client && (
                      <span className="client-phone">{evaluation.telephone_client}</span>
                    )}
                  </div>
                  <div className="eval-footer">
                    <span 
                      className="score-badge"
                      style={{ background: getScoreColor(evaluation.note_finale) }}
                    >
                      {evaluation.note_finale} pts
                    </span>
                    {evaluation.commentaire_debrief && (
                      <span className="debriefed-badge">✓ Débriefé</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Détails et debriefing */}
        <div className="debrief-panel">
          {!selectedEvaluation ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <p>Sélectionnez une évaluation pour voir le récapitulatif et ajouter un commentaire de debriefing</p>
            </div>
          ) : (
            <>
              {/* Récapitulatif de l'évaluation */}
              <div className="recap-section">
                <h3>Récapitulatif de l'évaluation</h3>
                
                <div className="recap-header">
                  <div className="recap-score" style={{ background: getScoreColor(selectedEvaluation.note_finale) }}>
                    <span className="score-value">{selectedEvaluation.note_finale}</span>
                    <span className="score-label">{getScoreLabel(selectedEvaluation.note_finale)}</span>
                  </div>
                  <div className="recap-info">
                    <p><strong>Client :</strong> {selectedEvaluation.nom_client || '-'}</p>
                    <p><strong>Téléphone :</strong> {selectedEvaluation.telephone_client || '-'}</p>
                    <p><strong>Date évaluation :</strong> {formatDate(selectedEvaluation.date_evaluation)}</p>
                    <p><strong>Type :</strong> {selectedEvaluation.type_evaluation === 'nouveau_rdv' ? 'Nouveau RDV' : 'Absent RDV'}</p>
                  </div>
                </div>

                {selectedEvaluation.recapitulatif && (
                  <div className="recap-text">
                    <h4>Récapitulatif de l'appel</h4>
                    <p>{selectedEvaluation.recapitulatif}</p>
                  </div>
                )}

                {/* Audio de l'appel */}
                {selectedEvaluation.audio_url && (
                  <div className="audio-section">
                    <h4>🎧 Audio de l'appel</h4>
                    <div className="audio-player-container">
                      <audio controls className="audio-player">
                        <source src={selectedEvaluation.audio_url} type="audio/mpeg" />
                        Votre navigateur ne supporte pas le lecteur audio.
                      </audio>
                      <a 
                        href={selectedEvaluation.audio_url} 
                        download={`audio_${selectedEvaluation.nom_client || 'appel'}.mp3`}
                        className="btn-download-audio"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Télécharger
                      </a>
                    </div>
                  </div>
                )}

                {/* Grille des notes */}
                <div className="notes-grid-section">
                  <h4>📋 Détail des notes</h4>
                  <div className="notes-grid">
                    {getCriteres().map(critere => {
                      const note = selectedEvaluation[`note_${critere.id}`] || 0;
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

              {/* Commentaire de debriefing */}
              <div className="debrief-section">
                <h3>Commentaire de debriefing</h3>
                
                {success && <div className="success-message">{success}</div>}
                {error && <div className="error-message">{error}</div>}

                <textarea
                  value={commentaireDebrief}
                  onChange={(e) => setCommentaireDebrief(e.target.value)}
                  placeholder="Écrivez votre commentaire de debriefing ici..."
                  rows="8"
                  className="debrief-textarea"
                />

                <button 
                  className="btn-save"
                  onClick={saveDebriefing}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer le debriefing'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Debriefing;
