import React, { useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';
import './Telepros.css';

function Telepros() {
  const [telepros, setTelepros] = useState([]);
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTelepros();
  }, []);

  const fetchTelepros = async () => {
    try {
      const { data, error } = await supabase
        .from('telepros')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTelepros(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des télépros:', error);
      setError('Erreur lors du chargement des télépros');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!nom.trim()) {
      setError('Le nom est requis');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('telepros')
        .insert([{ nom: nom.trim() }]);

      if (error) throw error;

      setSuccess('Télépro créé avec succès');
      setNom('');
      fetchTelepros();
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message || 'Erreur lors de la création du télépro');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce télépro ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('telepros')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Télépro supprimé avec succès');
      fetchTelepros();
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la suppression');
    }
  };

  return (
    <div className="telepros-container">
      <h2>Gestion des Télépros</h2>

      <div className="telepros-form-card">
        <h3>Ajouter un télépro</h3>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nom">Nom du télépro</label>
            <input
              type="text"
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Entrez le nom du télépro"
              disabled={loading}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Ajout en cours...' : 'Ajouter le télépro'}
          </button>
        </form>
      </div>

      <div className="telepros-list">
        <h3>Liste des télépros ({telepros.length})</h3>
        
        {telepros.length === 0 ? (
          <p className="empty-message">Aucun télépro enregistré pour le moment</p>
        ) : (
          <div className="telepros-grid">
            {telepros.map((telepro) => (
              <div key={telepro.id} className="telepro-card">
                <div className="telepro-info">
                  <h4>{telepro.nom}</h4>
                  <p className="telepro-date">
                    Créé le {new Date(telepro.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(telepro.id)}
                  className="delete-btn"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Telepros;
