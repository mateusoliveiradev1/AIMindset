import React from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AvatarImage } from '../components/Performance/ImageOptimizer';
import { supabase } from '../lib/supabase';

const Profile: React.FC = () => {
  const { supabaseUser, isAuthenticated, updateUserName, updateUserAvatar, removeUserAvatar } = useAuth();
  const [name, setName] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState('');
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

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

  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setAvatarError('');
    setAvatarPreview(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Selecione uma imagem.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Imagem até 2MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file || !supabaseUser) return;
    setAvatarUploading(true);
    setAvatarError('');
    try {
      const ext = (file.name.split('.').pop() || 'webp').toLowerCase();
      const path = `avatars/${supabaseUser.id}/avatar-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('avatars').upload(path, file, { cacheControl: '3600', upsert: true });
      if (error) {
        throw error;
      }
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = pub.publicUrl;
      const ok = await updateUserAvatar(url);
      if (!ok) {
        setAvatarError('Falha ao atualizar avatar.');
      }
      setMessage('Avatar atualizado.');
    } catch (err: any) {
      const m = err?.message || 'Erro no upload.';
      if (typeof m === 'string' && m.toLowerCase().includes('bucket')) {
        try {
          const { supabaseServiceClient } = await import('../lib/supabase-admin');
          await supabaseServiceClient.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: '2MB',
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
          });
          const ext = (file!.name.split('.').pop() || 'webp').toLowerCase();
          const path = `avatars/${supabaseUser!.id}/avatar-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from('avatars').upload(path, file!, { cacheControl: '3600', upsert: true });
          if (upErr) throw upErr;
          const { data: pub2 } = supabase.storage.from('avatars').getPublicUrl(path);
          const url2 = pub2.publicUrl;
          const ok2 = await updateUserAvatar(url2);
          if (!ok2) {
            setAvatarError('Falha ao atualizar avatar.');
          } else {
            setMessage('Avatar atualizado.');
            setAvatarError('');
          }
        } catch (createErr: any) {
          setAvatarError(createErr?.message || m);
        }
      } else {
        setAvatarError(m);
      }
    } finally {
      setAvatarUploading(false);
    }
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
          <div className="flex items-center gap-4">
            <div className="w-16 h-16">
              {avatarPreview ? (
                <AvatarImage src={avatarPreview} alt="Avatar" size={64} />
              ) : (
                supabaseUser?.user_metadata?.avatar_url ? (
                  <AvatarImage src={supabaseUser.user_metadata.avatar_url} alt="Avatar" size={64} />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-neon-purple/30 to-neon-blue/30 rounded-full border border-neon-purple/30" />
                )
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm text-futuristic-gray mb-1">Avatar</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} className="w-full text-sm text-futuristic-gray" />
              <div className="mt-2 flex gap-2">
                <Button onClick={async () => {
                  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                  const f = input?.files?.[0] || null;
                  await handleAvatarUpload(f);
                }} disabled={avatarUploading}>
                  {avatarUploading ? 'Enviando...' : 'Enviar avatar'}
                </Button>
                <Button onClick={async () => {
                  setAvatarError('');
                  const ok = await removeUserAvatar();
                  if (!ok) {
                    setAvatarError('Falha ao remover avatar.');
                  } else {
                    setAvatarPreview(null);
                    setMessage('Avatar removido.');
                  }
                }} variant="outline" disabled={avatarUploading}>
                  Remover avatar
                </Button>
              </div>
              {avatarError && <p className="text-red-400 text-sm mt-2">{avatarError}</p>}
            </div>
          </div>
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