import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { useToast } from '../hooks/useToast';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // REMOVIDO COMPLETAMENTE O useEffect PROBLEMÁTICO QUE CAUSAVA LOOP INFINITO

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      const success = await login(email, password);
      
      if (success) {
        console.log('🎯 LOGIN SUCESSO - FORÇANDO REDIRECIONAMENTO ABSOLUTO...');
        showToast('success', 'Login realizado com sucesso!');
        
        // SOLUÇÃO DEFINITIVA: window.location.replace (força redirecionamento absoluto)
        console.log('🚨 USANDO window.location.replace("/admin") - REDIRECIONAMENTO FORÇADO!');
        window.location.replace('/admin');
        
      } else {
        setError('Credenciais inválidas ou usuário não é administrador');
        showToast('error', 'Acesso negado');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError(`Erro no login: ${error.message || 'Erro interno'}`);
      showToast('error', `Erro: ${error.message || 'Erro interno'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-dark-surface to-darker-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-darker-surface/90 backdrop-blur-sm border border-neon-purple/20">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-neon-gradient rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-orbitron font-bold gradient-text">
              Admin Portal
            </h1>
            <p className="text-futuristic-gray text-sm">
              Acesse o painel administrativo
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-surface/50 border border-neon-purple/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all duration-200 text-white placeholder-futuristic-gray"
                  placeholder="admin@exemplo.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-surface/50 border border-neon-purple/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all duration-200 text-white placeholder-futuristic-gray"
                  placeholder="••••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-neon-gradient hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:scale-[1.02] shadow-lg hover:shadow-neon-purple/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </div>
              ) : (
                'Entrar no Painel'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-futuristic-gray">
              © 2024 AIMindset. Acesso restrito a administradores.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;