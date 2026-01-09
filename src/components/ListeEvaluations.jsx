import React, { useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';
import './ListeEvaluations.css';

function ListeEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [telepros, setTelepros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  // Filtres
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    agentId: '',
    typeEvaluation: '',
    recherche: '',
    categorieNote: ''
  });

  useEffect(() => {
    fetchAgents();
    fetchTelepros();
    fetchEvaluations();
  }, []);

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

  const fetchTelepros = async () => {
    try {
      const { data, error } = await supabase
        .from('telepros')
        .select('*')
        .order('nom', { ascending: true });
      if (error) throw error;
      setTelepros(data || []);
    } catch (error) {
      console.error('Erreur chargement télépros:', error);
    }
  };

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      // Récupérer les évaluations Nouveau RDV
      const { data: nouveauRdvData, error: nouveauRdvError } = await supabase
        .from('evaluations_appels')
        .select('*')
        .order('created_at', { ascending: false });

      if (nouveauRdvError) throw nouveauRdvError;

      // Récupérer les évaluations Absent RDV
      const { data: absentRdvData, error: absentRdvError } = await supabase
        .from('evaluations_absent_rdv')
        .select('*')
        .order('created_at', { ascending: false });

      if (absentRdvError) throw absentRdvError;

      // Ajouter le type à chaque évaluation et fusionner
      const nouveauRdv = (nouveauRdvData || []).map(e => ({ ...e, type_evaluation: 'nouveau_rdv' }));
      const absentRdv = (absentRdvData || []).map(e => ({ ...e, type_evaluation: 'absent_rdv' }));

      // Fusionner et trier par date de création
      const allEvaluations = [...nouveauRdv, ...absentRdv].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      setEvaluations(allEvaluations);
    } catch (error) {
      console.error('Erreur chargement évaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      dateDebut: '',
      dateFin: '',
      agentId: '',
      typeEvaluation: '',
      recherche: '',
      categorieNote: ''
    });
  };

  const getCategorieNote = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 90) return 'excellent';
    if (numScore >= 75) return 'conforme';
    if (numScore >= 60) return 'ameliorer';
    return 'non-conforme';
  };

  const getTypeLabel = (type) => {
    if (type === 'absent_rdv') return 'Absent RDV';
    return 'Nouveau RDV';
  };

  const getTypeBadgeClass = (type) => {
    if (type === 'absent_rdv') return 'type-absent';
    return 'type-nouveau';
  };

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.prenom} ${agent.nom}` : '-';
  };

  const getTeleprosName = (teleproId) => {
    const telepro = telepros.find(t => t.id === teleproId);
    return telepro ? telepro.nom : '-';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatDuree = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score) => {
    const numScore = parseFloat(score);
    // Nouveaux seuils
    if (numScore >= 90) return 'score-excellent';    // 90-100 : Excellent (vert)
    if (numScore >= 75) return 'score-conforme';     // 75-89 : Conforme (bleu)
    if (numScore >= 60) return 'score-ameliorer';    // 60-74 : À améliorer (orange)
    return 'score-non-conforme';                      // <60 : Non conforme (rouge)
  };

  const getScoreLabel = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 90) return 'Excellent';
    if (numScore >= 75) return 'Conforme';
    if (numScore >= 60) return 'À améliorer';
    return 'Non conforme';
  };

  // Filtrer les évaluations
  const filteredEvaluations = evaluations.filter(evaluation => {
    // Filtre par date début
    if (filters.dateDebut && evaluation.date_evaluation) {
      if (new Date(evaluation.date_evaluation) < new Date(filters.dateDebut)) {
        return false;
      }
    }

    // Filtre par date fin
    if (filters.dateFin && evaluation.date_evaluation) {
      if (new Date(evaluation.date_evaluation) > new Date(filters.dateFin)) {
        return false;
      }
    }

    // Filtre par agent
    if (filters.agentId && evaluation.agent_id !== filters.agentId) {
      return false;
    }

    // Filtre par type d'évaluation
    if (filters.typeEvaluation) {
      const evalType = evaluation.type_evaluation || 'nouveau_rdv';
      if (filters.typeEvaluation !== evalType) {
        return false;
      }
    }

    // Filtre par recherche (nom client, téléphone)
    if (filters.recherche) {
      const searchLower = filters.recherche.toLowerCase();
      const nomClient = (evaluation.nom_client || '').toLowerCase();
      const telephone = (evaluation.telephone_client || '').toLowerCase();
      const agentName = getAgentName(evaluation.agent_id).toLowerCase();
      const teleproName = getTeleprosName(evaluation.telepro_id).toLowerCase();
      
      if (!nomClient.includes(searchLower) && 
          !telephone.includes(searchLower) &&
          !agentName.includes(searchLower) &&
          !teleproName.includes(searchLower)) {
        return false;
      }
    }

    // Filtre par catégorie de note
    if (filters.categorieNote) {
      const categorie = getCategorieNote(evaluation.note_finale);
      if (filters.categorieNote !== categorie) {
        return false;
      }
    }

    return true;
  });

  const openDetails = (evaluation) => {
    setSelectedEvaluation(evaluation);
  };

  const closeDetails = () => {
    setSelectedEvaluation(null);
  };

  const deleteEvaluation = async (id, typeEvaluation) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette évaluation ?')) {
      return;
    }

    try {
      // Déterminer la table selon le type d'évaluation
      const tableName = typeEvaluation === 'absent_rdv' ? 'evaluations_absent_rdv' : 'evaluations_appels';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEvaluations(prev => prev.filter(e => e.id !== id));
      setSelectedEvaluation(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const printEvaluation = (evaluation) => {
    const printWindow = window.open('', '_blank');
    
    const totalPoints = CRITERES.reduce((sum, c) => sum + (evaluation[`note_${c.id}`] || 0), 0);
    const maxTotal = CRITERES.reduce((sum, c) => sum + c.maxPoints, 0);
    
    const getScoreColorHex = (score) => {
      const numScore = parseFloat(score);
      if (numScore >= 90) return '#22c55e';  // Vert - Excellent
      if (numScore >= 75) return '#3b82f6';  // Bleu - Conforme
      if (numScore >= 60) return '#f59e0b';  // Orange - À améliorer
      return '#ef4444';                       // Rouge - Non conforme
    };

    const getScoreLabelPrint = (score) => {
      const numScore = parseFloat(score);
      if (numScore >= 90) return 'Excellent';
      if (numScore >= 75) return 'Conforme';
      if (numScore >= 60) return 'À améliorer';
      return 'Non conforme';
    };

    const getCritereColor = (note, maxPoints) => {
      const percentage = (note / maxPoints) * 100;
      if (percentage >= 90) return '#22c55e';  // Vert
      if (percentage >= 75) return '#3b82f6';  // Bleu
      if (percentage >= 60) return '#f59e0b';  // Orange
      return '#ef4444';                         // Rouge
    };

    const getCritereBgColor = (note, maxPoints) => {
      const percentage = (note / maxPoints) * 100;
      if (percentage >= 90) return '#dcfce7';  // Vert clair
      if (percentage >= 75) return '#dbeafe';  // Bleu clair
      if (percentage >= 60) return '#fef3c7';  // Orange clair
      return '#fee2e2';                         // Rouge clair
    };

    const criteresHtml = CRITERES.map((critere, index) => {
      const note = evaluation[`note_${critere.id}`] || 0;
      const commentaire = evaluation[`commentaire_${critere.id}`] || '';
      const percentage = (note / critere.maxPoints) * 100;
      const critereColor = getCritereColor(note, critere.maxPoints);
      const critereBgColor = getCritereBgColor(note, critere.maxPoints);
      
      return `
        <div style="margin-bottom: 12px; padding: 12px; background: ${critereBgColor}; border-radius: 8px; border: 2px solid ${critereColor};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 24px; height: 24px; background: ${critereColor}; color: white; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${index + 1}</span>
              <span style="font-weight: 600; color: #1e293b;">${critere.label}</span>
            </div>
            <span style="font-weight: 700; color: ${critereColor}; background: white; padding: 4px 10px; border-radius: 12px;">${note} / ${critere.maxPoints}</span>
          </div>
          <div style="height: 8px; background: rgba(255,255,255,0.7); border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${percentage}%; background: ${critereColor}; border-radius: 4px;"></div>
          </div>
          ${commentaire ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #475569; font-style: italic; padding-top: 8px; border-top: 1px dashed ${critereColor};">${commentaire}</p>` : ''}
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Évaluation - ${evaluation.nom_client || 'Sans nom'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #1e293b; }
          .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; }
          .logo { font-size: 28px; font-weight: 800; color: #6366f1; margin-bottom: 8px; }
          .title { font-size: 20px; color: #64748b; }
          .score-section { text-align: center; margin-bottom: 40px; }
          .score-circle { width: 140px; height: 140px; background: ${getScoreColorHex(evaluation.note_finale)}; border-radius: 50%; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; color: white; }
          .score-value { font-size: 36px; font-weight: 800; }
          .score-label { font-size: 14px; opacity: 0.9; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 8px; }
          .section-title::before { content: ''; width: 6px; height: 6px; background: #6366f1; border-radius: 50%; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .info-item { background: #f8fafc; padding: 12px; border-radius: 8px; }
          .info-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .info-value { font-size: 15px; font-weight: 600; color: #1e293b; }
          .recap { background: #f8fafc; padding: 16px; border-radius: 8px; line-height: 1.6; color: #475569; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">QualityCall</div>
          <div class="title">Évaluation d'appel - Nouveau RDV</div>
        </div>

        <div class="score-section">
          <div class="score-circle">
            <span class="score-value">${evaluation.note_finale}</span>
            <span class="score-label">/ ${maxTotal} pts</span>
          </div>
          <p style="margin-top: 15px; padding: 10px 20px; background: ${getScoreColorHex(evaluation.note_finale)}; color: white; border-radius: 20px; display: inline-block; font-weight: 700; font-size: 16px;">${getScoreLabelPrint(evaluation.note_finale)}</p>
        </div>

        <div class="section">
          <h3 class="section-title">Informations générales</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Agent</div>
              <div class="info-value">${getAgentName(evaluation.agent_id)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Télépro</div>
              <div class="info-value">${getTeleprosName(evaluation.telepro_id)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date évaluation</div>
              <div class="info-value">${formatDate(evaluation.date_evaluation)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date prise RDV</div>
              <div class="info-value">${formatDate(evaluation.date_prise_rdv)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date RDV</div>
              <div class="info-value">${formatDate(evaluation.date_rdv)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Durée appel</div>
              <div class="info-value">${formatDuree(evaluation.duree_appel)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Client</div>
              <div class="info-value">${evaluation.nom_client || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Téléphone</div>
              <div class="info-value">${evaluation.telephone_client || '-'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Grille d'évaluation</h3>
          ${criteresHtml}
        </div>

        ${evaluation.recapitulatif ? `
          <div class="section">
            <h3 class="section-title">Récapitulatif</h3>
            <div class="recap">${evaluation.recapitulatif}</div>
          </div>
        ` : ''}

        <div class="footer">
          <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>QualityCall - Système d'évaluation des appels</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const CRITERES = [
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

  return (
    <div className="liste-evaluations-container">
      <div className="liste-header">
        <h2>Liste des Évaluations - Nouveau RDV</h2>
        <span className="evaluation-count">{filteredEvaluations.length} évaluation(s)</span>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Date début</label>
            <input
              type="date"
              name="dateDebut"
              value={filters.dateDebut}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>Date fin</label>
            <input
              type="date"
              name="dateFin"
              value={filters.dateFin}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>Agent</label>
            <select
              name="agentId"
              value={filters.agentId}
              onChange={handleFilterChange}
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
            <label>Type d'évaluation</label>
            <select
              name="typeEvaluation"
              value={filters.typeEvaluation}
              onChange={handleFilterChange}
            >
              <option value="">Tous les types</option>
              <option value="nouveau_rdv">Nouveau RDV</option>
              <option value="absent_rdv">Absent RDV</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Catégorie note</label>
            <select
              name="categorieNote"
              value={filters.categorieNote}
              onChange={handleFilterChange}
            >
              <option value="">Toutes les notes</option>
              <option value="excellent">Excellent (≥90)</option>
              <option value="conforme">Conforme (75-89)</option>
              <option value="ameliorer">À améliorer (60-74)</option>
              <option value="non-conforme">Non conforme (&lt;60)</option>
            </select>
          </div>

          <div className="filter-group search-group">
            <label>Recherche</label>
            <div className="search-input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                name="recherche"
                value={filters.recherche}
                onChange={handleFilterChange}
                placeholder="Nom client, téléphone, agent..."
              />
            </div>
          </div>
        </div>

        <button className="btn-reset" onClick={resetFilters}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Réinitialiser
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des évaluations...</p>
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <div className="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <h3>Aucune évaluation trouvée</h3>
          <p>Modifiez vos filtres ou créez une nouvelle évaluation</p>
        </div>
      ) : (
        <div className="evaluations-table-wrapper">
          <table className="evaluations-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Date évaluation</th>
                <th>Agent</th>
                <th>Télépro</th>
                <th>Client</th>
                <th>Durée</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvaluations.map(evaluation => (
                <tr key={evaluation.id}>
                  <td>
                    <span className={`type-badge ${getTypeBadgeClass(evaluation.type_evaluation)}`}>
                      {getTypeLabel(evaluation.type_evaluation)}
                    </span>
                  </td>
                  <td>{formatDate(evaluation.date_evaluation)}</td>
                  <td>{getAgentName(evaluation.agent_id)}</td>
                  <td>{getTeleprosName(evaluation.telepro_id)}</td>
                  <td>
                    <div className="client-info">
                      <span className="client-name">{evaluation.nom_client || '-'}</span>
                      {evaluation.telephone_client && (
                        <span className="client-phone">{evaluation.telephone_client}</span>
                      )}
                    </div>
                  </td>
                  <td>{formatDuree(evaluation.duree_appel)}</td>
                  <td>
                    <span className={`score-badge ${getScoreColor(evaluation.note_finale)}`}>
                      {evaluation.note_finale} pts - {getScoreLabel(evaluation.note_finale)}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button 
                        className="btn-action btn-view"
                        onClick={() => openDetails(evaluation)}
                        title="Voir les détails"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-action btn-print"
                        onClick={() => printEvaluation(evaluation)}
                        title="Imprimer PDF"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 6 2 18 2 18 9"/>
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                          <rect x="6" y="14" width="12" height="8"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-action btn-delete"
                        onClick={() => deleteEvaluation(evaluation.id, evaluation.type_evaluation)}
                        title="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal détails */}
      {selectedEvaluation && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détails de l'évaluation</h3>
              <button className="btn-close" onClick={closeDetails}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-score-header">
                <div className={`score-circle-modal ${getScoreColor(selectedEvaluation.note_finale)}`}>
                  <span className="score-value">{selectedEvaluation.note_finale}%</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Informations générales</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Agent</span>
                    <span className="detail-value">{getAgentName(selectedEvaluation.agent_id)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Télépro</span>
                    <span className="detail-value">{getTeleprosName(selectedEvaluation.telepro_id)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date évaluation</span>
                    <span className="detail-value">{formatDate(selectedEvaluation.date_evaluation)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date prise RDV</span>
                    <span className="detail-value">{formatDate(selectedEvaluation.date_prise_rdv)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date RDV</span>
                    <span className="detail-value">{formatDate(selectedEvaluation.date_rdv)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Durée appel</span>
                    <span className="detail-value">{formatDuree(selectedEvaluation.duree_appel)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Client</span>
                    <span className="detail-value">{selectedEvaluation.nom_client || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Téléphone</span>
                    <span className="detail-value">{selectedEvaluation.telephone_client || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Audio de l'appel</h4>
                {selectedEvaluation.audio_url ? (
                  <div className="audio-section">
                    <audio controls className="audio-player">
                      <source src={selectedEvaluation.audio_url} type="audio/mpeg" />
                      Votre navigateur ne supporte pas l'audio.
                    </audio>
                    <a 
                      href={selectedEvaluation.audio_url} 
                      download={`audio_evaluation_${selectedEvaluation.nom_client || 'appel'}.mp3`}
                      className="btn-download-audio"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Télécharger l'audio
                    </a>
                  </div>
                ) : (
                  <div className="no-audio-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"/>
                      <circle cx="6" cy="18" r="3"/>
                      <circle cx="18" cy="16" r="3"/>
                    </svg>
                    <p>Aucun fichier audio n'a été uploadé pour cette évaluation</p>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4>Grille d'évaluation</h4>
                <div className="criteres-detail-list">
                  {CRITERES.map((critere, index) => {
                    const note = selectedEvaluation[`note_${critere.id}`] || 0;
                    const commentaire = selectedEvaluation[`commentaire_${critere.id}`];
                    const percentage = (note / critere.maxPoints) * 100;
                    
                    return (
                      <div key={critere.id} className="critere-detail-item">
                        <div className="critere-detail-header">
                          <span className="critere-detail-number">{index + 1}</span>
                          <span className="critere-detail-label">{critere.label}</span>
                          <span className="critere-detail-score">
                            {note} / {critere.maxPoints}
                          </span>
                        </div>
                        <div className="critere-progress-bar">
                          <div 
                            className="critere-progress-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {commentaire && (
                          <p className="critere-detail-comment">{commentaire}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedEvaluation.recapitulatif && (
                <div className="detail-section">
                  <h4>Récapitulatif</h4>
                  <p className="recap-text">{selectedEvaluation.recapitulatif}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeDetails}>
                Fermer
              </button>
              <button 
                className="btn-print-modal"
                onClick={() => printEvaluation(selectedEvaluation)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Imprimer PDF
              </button>
              <button 
                className="btn-danger"
                onClick={() => deleteEvaluation(selectedEvaluation.id, selectedEvaluation.type_evaluation)}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListeEvaluations;
