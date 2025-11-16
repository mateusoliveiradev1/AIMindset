import React from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { supabaseUser, isAuthenticated, updateUserName } = useAuth();
  const [name, setName] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    const meta: any = supabaseUser?.user_metadata || {};
    const initial = meta.name || meta.full_name || supabaseUser?.email?.split('@')[0] || '';
    setName(initial);
  }, [supabaseUser]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setMessage('');
    const ok = await updateUserName(name.trim());
    setSaving(false);
    setMessage(ok ? 'Nome atualizado com sucesso.' : 'Falha ao atualizar nome.');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-surface flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-2">Perfil</h2>
          <p className="text-futuristic-gray mb-4">Entre para acessar seu perfil.</p>
          <Link to="/admin/login" className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-neon-purple/30 text-white bg-dark-surface/50 hover:bg-dark-surface/70">
            Entrar
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-surface flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Meu Perfil</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-futuristic-gray mb-1">Email</label>
            <input
              value={supabaseUser?.email || ''}
              readOnly
              className="w-full px-3 py-2 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-futuristic-gray mb-1">Nome exibido</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white"
              placeholder="Seu nome"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
          {message && (
            <p className="text-center text-futuristic-gray">{message}</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Profile;