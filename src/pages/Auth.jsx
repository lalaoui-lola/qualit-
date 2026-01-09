import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabaseClient';
import Lottie from 'react-lottie-player';
import './Auth.css';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [animationData, setAnimationData] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetch('/lottie/anim.json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Erreur de chargement de l\'animation:', error));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-content">
          {animationData && (
            <Lottie
              loop
              animationData={animationData}
              play
              style={{ width: '100%', height: '300px' }}
            />
          )}
          <h2>Bienvenue sur notre plateforme qualité secure academy</h2>
          <p>Connectez-vous pour accéder à votre espace personnel</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-card">
            <h1>Connexion</h1>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Adresse email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-options">
                <div className="remember-me">
                  <input type="checkbox" id="remember" />
                  <label htmlFor="remember">Se souvenir de moi</label>
                </div>
                <a href="#" className="forgot-password">Mot de passe oublié?</a>
              </div>
              
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Chargement...' : 'Se connecter'}
              </button>
              
              <div className="signup-link">
                <p>Pas encore de compte? <a href="#">S'inscrire</a></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
