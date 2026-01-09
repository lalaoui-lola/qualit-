import React, { useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';
import './EvaluationAbsentRdv.css';

const CRITERES = [
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

const MAX_TOTAL = CRITERES.reduce((sum, c) => sum + c.maxPoints, 0);

function EvaluationAbsentRdv() {
  const [agents, setAgents] = useState([]);
  const [telepros, setTelepros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [noteFinale, setNoteFinale] = useState(0);

  const [formData, setFormData] = useState({
    agent_id: '',
    telepro_id: '',
    date_evaluation: new Date().toISOString().split('T')[0],
    date_prise_rdv: '',
    date_rdv: '',
    nom_client: '',
    telephone_client: '',
    duree_appel_minutes: '',
    duree_appel_secondes: '',
    audio_file: null,
    recapitulatif: '',
  });

  const [notes, setNotes] = useState(
    CRITERES.reduce((acc, c) => {
      acc[c.id] = { note: 0, commentaire: '' };
      return acc;
    }, {})
  );

  useEffect(() => {
    fetchAgents();
    fetchTelepros();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, audio_file: file }));
  };

  const handleNoteChange = (critereId, value) => {
    const critere = CRITERES.find(c => c.id === critereId);
    const noteValue = Math.min(Math.max(0, parseInt(value) || 0), critere.maxPoints);
    setNotes(prev => ({
      ...prev,
      [critereId]: { ...prev[critereId], note: noteValue }
    }));
  };

  const handleCommentaireChange = (critereId, value) => {
    setNotes(prev => ({
      ...prev,
      [critereId]: { ...prev[critereId], commentaire: value }
    }));
  };

  const calculateTotal = () => {
    return CRITERES.reduce((sum, c) => sum + (notes[c.id]?.note || 0), 0);
  };

  const calculatePercentage = () => {
    return ((calculateTotal() / MAX_TOTAL) * 100).toFixed(1);
  };

  const getScoreColor = () => {
    const total = calculateTotal();
    if (total >= 90) return '#22c55e';  // Vert - Excellent
    if (total >= 75) return '#3b82f6';  // Bleu - Conforme
    if (total >= 60) return '#f59e0b';  // Orange - À améliorer
    return '#ef4444';                    // Rouge - Non conforme
  };

  const getScoreLabel = () => {
    const total = calculateTotal();
    if (total >= 90) return 'Excellent';
    if (total >= 75) return 'Conforme';
    if (total >= 60) return 'À améliorer';
    return 'Non conforme';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    
    try {
      let audioUrl = null;

      if (formData.audio_file) {
        const fileExt = formData.audio_file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audios')
          .upload(fileName, formData.audio_file);

        if (uploadError) {
          console.warn('Erreur upload audio:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('audios')
            .getPublicUrl(fileName);
          audioUrl = urlData?.publicUrl;
        }
      }

      const dureeMinutes = parseInt(formData.duree_appel_minutes) || 0;
      const dureeSecondes = parseInt(formData.duree_appel_secondes) || 0;
      const dureeTotaleSecondes = (dureeMinutes * 60) + dureeSecondes;

      const evaluationData = {
        agent_id: formData.agent_id || null,
        telepro_id: formData.telepro_id || null,
        date_evaluation: formData.date_evaluation || null,
        date_prise_rdv: formData.date_prise_rdv || null,
        date_rdv: formData.date_rdv || null,
        nom_client: formData.nom_client || null,
        telephone_client: formData.telephone_client || null,
        duree_appel: dureeTotaleSecondes > 0 ? dureeTotaleSecondes : null,
        audio_url: audioUrl,
        recapitulatif: formData.recapitulatif || null,
        note_finale: calculateTotal(),
      };

      CRITERES.forEach(c => {
        evaluationData[`note_${c.id}`] = notes[c.id].note;
        evaluationData[`commentaire_${c.id}`] = notes[c.id].commentaire || null;
      });

      const { error: insertError } = await supabase
        .from('evaluations_absent_rdv')
        .insert([evaluationData]);

      if (insertError) throw insertError;

      setNoteFinale(calculateTotal());
      setShowResult(true);
      setSuccess('Évaluation enregistrée avec succès !');

    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      agent_id: '',
      telepro_id: '',
      date_evaluation: new Date().toISOString().split('T')[0],
      date_prise_rdv: '',
      date_rdv: '',
      nom_client: '',
      telephone_client: '',
      duree_appel_minutes: '',
      duree_appel_secondes: '',
      audio_file: null,
      recapitulatif: '',
    });
    setNotes(
      CRITERES.reduce((acc, c) => {
        acc[c.id] = { note: 0, commentaire: '' };
        return acc;
      }, {})
    );
    setShowResult(false);
    setSuccess('');
    setError('');
  };

  if (showResult) {
    return (
      <div className="evaluation-container">
        <div className="result-card">
          <div className="result-icon">✅</div>
          <h2>Évaluation enregistrée !</h2>
          <div className="result-score">
            <div className="score-circle">
              <span className="score-value">{noteFinale} / {MAX_TOTAL}</span>
              <span className="score-label">Note finale</span>
            </div>
          </div>
          <div className="result-details">
            <p><strong>Total des points :</strong> {calculateTotal()} / {MAX_TOTAL}</p>
            <p><strong>Agent :</strong> {agents.find(a => a.id === formData.agent_id)?.prenom} {agents.find(a => a.id === formData.agent_id)?.nom}</p>
            <p><strong>Client :</strong> {formData.nom_client}</p>
          </div>
          <button onClick={resetForm} className="btn-primary">
            Nouvelle évaluation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="evaluation-container">
      <h2>Évaluation Appel - Absent RDV</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Informations générales</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="agent_id">Agent</label>
              <select
                id="agent_id"
                name="agent_id"
                value={formData.agent_id}
                onChange={handleChange}
              >
                <option value="">Sélectionner un agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.prenom} {agent.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="telepro_id">Télépro</label>
              <select
                id="telepro_id"
                name="telepro_id"
                value={formData.telepro_id}
                onChange={handleChange}
              >
                <option value="">Sélectionner un télépro</option>
                {telepros.map(telepro => (
                  <option key={telepro.id} value={telepro.id}>
                    {telepro.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date_evaluation">Date d'évaluation</label>
              <input
                type="date"
                id="date_evaluation"
                name="date_evaluation"
                value={formData.date_evaluation}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_prise_rdv">Date de prise RDV</label>
              <input
                type="date"
                id="date_prise_rdv"
                name="date_prise_rdv"
                value={formData.date_prise_rdv}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_rdv">Date RDV</label>
              <input
                type="date"
                id="date_rdv"
                name="date_rdv"
                value={formData.date_rdv}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="nom_client">Nom client</label>
              <input
                type="text"
                id="nom_client"
                name="nom_client"
                value={formData.nom_client}
                onChange={handleChange}
                placeholder="Nom du client"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telephone_client">Téléphone client</label>
              <input
                type="tel"
                id="telephone_client"
                name="telephone_client"
                value={formData.telephone_client}
                onChange={handleChange}
                placeholder="Numéro de téléphone"
              />
            </div>

            <div className="form-group">
              <label>Durée de l'appel</label>
              <div className="duree-input-group">
                <div className="duree-field">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    name="duree_appel_minutes"
                    value={formData.duree_appel_minutes}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <span>min</span>
                </div>
                <div className="duree-field">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    name="duree_appel_secondes"
                    value={formData.duree_appel_secondes}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <span>sec</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="audio_file">Fichier audio</label>
              <div className="file-upload-wrapper">
                <input
                  type="file"
                  id="audio_file"
                  name="audio_file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="file-input-hidden"
                />
                <label htmlFor="audio_file" className="file-upload-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {formData.audio_file ? formData.audio_file.name : 'Choisir un fichier audio'}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Grille d'évaluation</h3>
          <div className="score-summary">
            <span>Score actuel :</span>
            <strong>{calculateTotal()} / {MAX_TOTAL} ({calculatePercentage()}%)</strong>
          </div>

          <div className="criteres-list">
            {CRITERES.map((critere, index) => (
              <div key={critere.id} className="critere-card">
                <div className="critere-header">
                  <span className="critere-number">{index + 1}</span>
                  <span className="critere-label">{critere.label}</span>
                  <span className="critere-max">/ {critere.maxPoints} pts</span>
                </div>
                
                <div className="critere-content">
                  <div className="note-input-group">
                    <label>Note :</label>
                    <input
                      type="number"
                      min="0"
                      max={critere.maxPoints}
                      value={notes[critere.id].note}
                      onChange={(e) => handleNoteChange(critere.id, e.target.value)}
                      className="note-input"
                    />
                    <div className="note-buttons">
                      {[...Array(critere.maxPoints + 1)].map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`note-btn ${notes[critere.id].note === i ? 'active' : ''}`}
                          onClick={() => handleNoteChange(critere.id, i)}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="commentaire-group">
                    <label>Commentaire :</label>
                    <textarea
                      value={notes[critere.id].commentaire}
                      onChange={(e) => handleCommentaireChange(critere.id, e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Récapitulatif de l'appel</h3>
          <div className="form-group">
            <textarea
              name="recapitulatif"
              value={formData.recapitulatif}
              onChange={handleChange}
              placeholder="Résumé général de l'appel, points forts, points à améliorer..."
              rows="6"
              className="recap-textarea"
            />
          </div>
        </div>

        <div className="form-actions">
          <div className="final-score" style={{ backgroundColor: getScoreColor(), color: 'white', padding: '1rem 2rem', borderRadius: '1rem' }}>
            <span>Note finale :</span>
            <strong>{calculateTotal()} / {MAX_TOTAL} - {getScoreLabel()}</strong>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Enregistrement...' : "Enregistrer l'évaluation"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EvaluationAbsentRdv;
