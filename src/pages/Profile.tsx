import React from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AvatarImage } from '../components/Performance/ImageOptimizer';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const Profile: React.FC = () => {
  const { supabaseUser, isAuthenticated, updateUserName, updateUserAvatar, removeUserAvatar, updateUserDetails } = useAuth();
  const [name, setName] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [twitter, setTwitter] = React.useState('');
  const [instagram, setInstagram] = React.useState('');
  const [linkedin, setLinkedin] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState('');
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [nameError, setNameError] = React.useState('');
  const [fullNameError, setFullNameError] = React.useState('');
  const [bioError, setBioError] = React.useState('');
  const [twitterError, setTwitterError] = React.useState('');
  const [instagramError, setInstagramError] = React.useState('');
  const [linkedinError, setLinkedinError] = React.useState('');
  const [websiteError, setWebsiteError] = React.useState('');
  const [initialName, setInitialName] = React.useState('');
  const [initialFullName, setInitialFullName] = React.useState('');
  const [initialBio, setInitialBio] = React.useState('');
  const [initialTwitter, setInitialTwitter] = React.useState('');
  const [initialInstagram, setInitialInstagram] = React.useState('');
  const [initialLinkedin, setInitialLinkedin] = React.useState('');
  const [initialWebsite, setInitialWebsite] = React.useState('');
  const [zoom, setZoom] = React.useState(1);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState<{x:number,y:number}|null>(null);
  const [offset, setOffset] = React.useState<{x:number,y:number}>({x:0,y:0});

  React.useEffect(() => {
    const meta: any = supabaseUser?.user_metadata || {};
    const initial = meta.name || meta.full_name || supabaseUser?.email?.split('@')[0] || '';
    setName(initial);
    setInitialName(initial);
    setFullName(meta.full_name || '');
    setBio(meta.bio || '');
    const s = meta.social || {};
    setTwitter(s.twitter || '');
    setInstagram(s.instagram || '');
    setLinkedin(s.linkedin || '');
    setWebsite(s.website || '');
    // Preferências serão implementadas futuramente
    setInitialFullName(meta.full_name || '');
    setInitialBio(meta.bio || '');
    setInitialTwitter(s.twitter || '');
    setInitialInstagram(s.instagram || '');
    setInitialLinkedin(s.linkedin || '');
    setInitialWebsite(s.website || '');
    // Preferências serão implementadas futuramente
  }, [supabaseUser]);

  React.useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleSave = async () => {
    const validateUrl = (v: string) => { try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } };
    const validateHandle = (v: string) => /^@[A-Za-z0-9_\.]{2,30}$/.test(v.trim());
    const validateName = (v: string) => /^[A-Za-zÀ-ÿ0-9 ]{2,50}$/.test(v.trim());
    const validateFullName = (v: string) => /^[A-Za-zÀ-ÿ'\- ]{2,80}$/.test(v.trim());
    const sanitizeBio = (v: string) => v.replace(/[<>]/g, '').slice(0, 280);

    setNameError(''); setFullNameError(''); setBioError(''); setTwitterError(''); setInstagramError(''); setLinkedinError(''); setWebsiteError('');

    if (!validateName(name)) { setNameError('Nome 2-50 caracteres, letras/números/espaços.'); toast.error('Nome inválido'); return; }
    if (fullName && !validateFullName(fullName)) { setFullNameError('Nome completo 2-80 caracteres.'); toast.error('Nome completo inválido'); return; }
    const bioSan = sanitizeBio(bio);
    if (bio !== bioSan) setBio(bioSan);
    const checkSocial = (val: string, setErr: (s:string)=>void, label: string) => {
      if (!val) return true;
      const isHandle = val.trim().startsWith('@');
      const ok = isHandle ? validateHandle(val.trim()) : validateUrl(val.trim());
      if (!ok) { setErr(`${label} inválido`); toast.error(`${label} inválido`); return false; }
      setErr(''); return true;
    };
    const okTw = checkSocial(twitter, setTwitterError, 'Twitter');
    const okIg = checkSocial(instagram, setInstagramError, 'Instagram');
    const okLi = checkSocial(linkedin, setLinkedinError, 'LinkedIn');
    const okWs = website ? validateUrl(website) : true;
    if (!okTw || !okIg || !okLi || !okWs) return;

    setSaving(true);
    setMessage('');
    let okName = true;
    if (name.trim() !== initialName.trim()) {
      okName = await updateUserName(name.trim());
    }
    const okDetails = await updateUserDetails({
      full_name: fullName,
      bio: bioSan,
      social: { twitter, instagram, linkedin, website }
    });
    setSaving(false);
    const okAll = okName && okDetails;
    setMessage(okAll ? 'Perfil atualizado.' : 'Falha ao atualizar perfil.');
    if (okAll) toast.success('Perfil atualizado'); else toast.error('Falha ao atualizar perfil');
    if (okAll) {
      setInitialName(name);
      setInitialFullName(fullName);
      setInitialBio(bio);
      setInitialTwitter(twitter);
      setInitialInstagram(instagram);
      setInitialLinkedin(linkedin);
      setInitialWebsite(website);
      // Preferências serão implementadas futuramente
    }
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
    const img = new Image();
    img.onload = () => {
      if (img.width < 256 || img.height < 256) {
        setAvatarError('Dimensões mínimas 256x256.');
        URL.revokeObjectURL(url);
        return;
      }
      setAvatarPreview(url);
    };
    img.onerror = () => {
      setAvatarError('Falha ao carregar imagem.');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file || !supabaseUser) return;
    setAvatarUploading(true);
    setAvatarError('');
    try {
      const processed = await (async () => {
        const img = document.createElement('img');
        const url = URL.createObjectURL(file);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Falha ao carregar imagem'));
          img.src = url;
        });
        URL.revokeObjectURL(url);
        const max = 512;
        const base = Math.min(img.width, img.height);
        const cropSize = Math.min(base, Math.floor(base / zoom));
        const cx = Math.floor(img.width / 2 + offset.x);
        const cy = Math.floor(img.height / 2 + offset.y);
        const sx = Math.max(0, Math.min(img.width - cropSize, cx - Math.floor(cropSize / 2)));
        const sy = Math.max(0, Math.min(img.height - cropSize, cy - Math.floor(cropSize / 2)));
        const canvas = document.createElement('canvas');
        canvas.width = max;
        canvas.height = max;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas indisponível');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, max, max);
        const blob: Blob = await new Promise((resolve, reject) => {
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('Falha ao processar imagem')), 'image/webp', 0.85);
        });
        return new File([blob], 'avatar.webp', { type: 'image/webp' });
      })();
      const path = `avatars/${supabaseUser.id}/profile.webp`;
      const { data, error } = await supabase.storage.from('avatars').upload(path, processed, { cacheControl: '3600', upsert: true });
      if (error) {
        throw error;
      }
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${pub.publicUrl}?v=${Date.now()}`;
      const ok = await updateUserAvatar(url);
      if (!ok) {
        setAvatarError('Falha ao atualizar avatar.');
      }
      setMessage('Avatar atualizado.');
      toast.success('Avatar atualizado');
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
          const processed = await (async () => {
            const img = document.createElement('img');
            const urlTmp = URL.createObjectURL(file!);
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('Falha ao carregar imagem'));
              img.src = urlTmp;
            });
            URL.revokeObjectURL(urlTmp);
            const max = 512;
            const base = Math.min(img.width, img.height);
            const cropSize = Math.min(base, Math.floor(base / zoom));
            const cx = Math.floor(img.width / 2 + offset.x);
            const cy = Math.floor(img.height / 2 + offset.y);
            const sx = Math.max(0, Math.min(img.width - cropSize, cx - Math.floor(cropSize / 2)));
            const sy = Math.max(0, Math.min(img.height - cropSize, cy - Math.floor(cropSize / 2)));
            const canvas = document.createElement('canvas');
            canvas.width = max;
            canvas.height = max;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas indisponível');
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, max, max);
            const blob: Blob = await new Promise((resolve, reject) => {
              canvas.toBlob(b => b ? resolve(b) : reject(new Error('Falha ao processar imagem')), 'image/webp', 0.85);
            });
            return new File([blob], 'avatar.webp', { type: 'image/webp' });
          })();
          const path = `avatars/${supabaseUser!.id}/profile.webp`;
          const { error: upErr } = await supabase.storage.from('avatars').upload(path, processed, { cacheControl: '3600', upsert: true });
          if (upErr) throw upErr;
          const { data: pub2 } = supabase.storage.from('avatars').getPublicUrl(path);
          const url2 = `${pub2.publicUrl}?v=${Date.now()}`;
          const ok2 = await updateUserAvatar(url2);
          if (!ok2) {
            setAvatarError('Falha ao atualizar avatar.');
          } else {
            setMessage('Avatar atualizado.');
            setAvatarError('');
            toast.success('Avatar atualizado');
          }
        } catch (createErr: any) {
          setAvatarError(createErr?.message || m);
          toast.error(createErr?.message || m);
        }
      } else {
        setAvatarError(m);
        toast.error(m);
      }
    } finally {
      setAvatarUploading(false);
    }
  };

  // Preferências serão implementadas futuramente

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
              <input type="file" accept="image/png,image/jpeg,image/webp" capture="environment" onChange={handleAvatarChange} className="w-full text-sm text-futuristic-gray" />
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
                  const confirmed = window.confirm('Remover avatar?');
                  if (!confirmed) return;
                  const ok = await removeUserAvatar();
                  if (!ok) {
                    setAvatarError('Falha ao remover avatar.');
                  } else {
                    setAvatarPreview(null);
                    setMessage('Avatar removido.');
                    toast.success('Avatar removido');
                  }
                }} variant="outline" disabled={avatarUploading}>
                  Remover avatar
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 items-center">
                <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom do avatar" />
                <span className="text-xs text-futuristic-gray">Zoom</span>
              </div>
              {avatarPreview && (
                <div className="mt-2 relative w-40 h-40 overflow-hidden rounded-lg border border-neon-purple/30"
                  onMouseDown={(e) => { setIsDragging(true); setDragStart({x: e.clientX, y: e.clientY}); }}
                  onMouseMove={(e) => { if (!isDragging || !dragStart) return; const dx = e.clientX - dragStart.x; const dy = e.clientY - dragStart.y; setOffset(prev => ({x: prev.x + dx/zoom, y: prev.y + dy/zoom})); setDragStart({x: e.clientX, y: e.clientY}); }}
                  onMouseUp={() => { setIsDragging(false); setDragStart(null); }}
                  onMouseLeave={() => { setIsDragging(false); setDragStart(null); }}
                >
                  <img src={avatarPreview} alt="Pré-visualização" className="absolute inset-0" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: 'center center' }} />
                </div>
              )}
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
              aria-label="Nome exibido"
            />
            {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
          </div>
          <div>
            <label className="block text-sm text-futuristic-gray mb-1">Nome completo</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white" placeholder="Seu nome completo" aria-label="Nome completo" />
            {fullNameError && <p className="text-red-400 text-xs mt-1">{fullNameError}</p>}
          </div>
          <div>
            <label className="block text-sm text-futuristic-gray mb-1">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-3 py-2 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white min-h-[80px]" placeholder="Sobre você" aria-label="Bio" />
            {bioError && <p className="text-red-400 text-xs mt-1">{bioError}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-futuristic-gray mb-1">Twitter</label>
              <input value={twitter} onChange={(e) => setTwitter(e.target.value)} className="w-full px-3 py-2 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white" placeholder="@usuario ou URL" aria-label="Twitter" />
              {twitterError && <p className="text-red-400 text-xs mt-1">{twitterError}</p>}
            </div>
            <div>
              <label className="block text-sm text-futuristic-gray mb-1">Instagram</label>
              <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full px-3 py-2 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white" placeholder="@usuario ou URL" aria-label="Instagram" />
              {instagramError && <p className="text-red-400 text-xs mt-1">{instagramError}</p>}
            </div>
            <div>
              <label className="block text-sm text-futuristic-gray mb-1">LinkedIn</label>
              <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="w-full px-3 py-2 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white" placeholder="URL" aria-label="LinkedIn" />
              {linkedinError && <p className="text-red-400 text-xs mt-1">{linkedinError}</p>}
            </div>
            <div>
              <label className="block text-sm text-futuristic-gray mb-1">Website</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full px-3 py-2 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white" placeholder="URL" aria-label="Website" />
              {websiteError && <p className="text-red-400 text-xs mt-1">{websiteError}</p>}
            </div>
          </div>
          {/* Preferências (tema/idioma/animações) serão adicionadas futuramente */}
          <Button onClick={handleSave} disabled={saving || (
            name.trim() === initialName.trim() &&
            fullName.trim() === initialFullName.trim() &&
            bio.trim() === initialBio.trim() &&
            twitter.trim() === initialTwitter.trim() &&
            instagram.trim() === initialInstagram.trim() &&
            linkedin.trim() === initialLinkedin.trim() &&
            website.trim() === initialWebsite.trim()
          )} className="w-full">
            {saving ? 'Salvando...' : 'Salvar perfil'}
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