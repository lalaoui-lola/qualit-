import React, { useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';
import './Agents.css';

function Agents() {
  const [agents, setAgents] = useState([]);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
      setError('Erreur lors du chargement des agents');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.nom.trim() || !formData.prenom.trim()) {
      setError('Le nom et le prénom sont requis');
      setLoading(false);
      return;
    }

    if (formData.email.trim() && !validateEmail(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('agents')
        .insert([{
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          email: formData.email.trim() ? formData.email.trim().toLowerCase() : null
        }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Cet email est déjà utilisé');
        }
        throw error;
      }

      setSuccess('Agent créé avec succès');
      setFormData({ nom: '', prenom: '', email: '' });
      fetchAgents();
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message || 'Erreur lors de la création de l\'agent');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Agent supprimé avec succès');
      fetchAgents();
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la suppression');
    }
  };

  return (
    <div className="agents-container">
      <h2>Gestion des Agents</h2>

      <div className="agents-form-card">
        <h3>Ajouter un agent</h3>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nom">Nom</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Nom de famille"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="prenom">Prénom</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Prénom"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email <span className="optional-label">(optionnel)</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@exemple.com"
              disabled={loading}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Ajout en cours...' : 'Ajouter l\'agent'}
          </button>
        </form>
      </div>

      <div className="agents-list">
        <h3>Liste des agents ({agents.length})</h3>
        
        {agents.length === 0 ? (
          <p className="empty-message">Aucun agent enregistré pour le moment</p>
        ) : (
          <div className="agents-table-container">
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Date de création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td>{agent.nom}</td>
                    <td>{agent.prenom}</td>
                    <td>{agent.email || '-'}</td>
                    <td>{new Date(agent.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="delete-btn"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Agents;
