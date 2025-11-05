import React from 'react';
import SEOManager from '@/components/SEO/SEOManager';
import { Card, CardContent } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Settings, User, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminSettings() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      <SEOManager metadata={{
        title: 'Configurações - Admin AIMindset',
        description: 'Ajustes e preferências do painel administrativo.',
        keywords: ['configurações', 'admin', 'preferências'],
        canonicalUrl: 'https://aimindset.com.br/admin/settings',
        type: 'webpage',
        language: 'pt-BR',
        robots: 'noindex, nofollow',
        breadcrumbs: [
          { name: 'Admin', url: 'https://aimindset.com.br/admin', position: 1 },
          { name: 'Configurações', url: 'https://aimindset.com.br/admin/settings', position: 2 }
        ]
      }} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="neon">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-neon-purple" />
                <h2 className="text-lg font-semibold text-white">Preferências do Admin</h2>
              </div>
              <Button onClick={() => navigate('/')} variant="secondary" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Ir para Home
              </Button>
            </div>
            <p className="text-futuristic-gray mt-3">Em breve: tema, idioma, notificações, integrações e mais.</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-lime-green" />
              <h2 className="text-lg font-semibold text-white">Perfil</h2>
            </div>
            <p className="text-futuristic-gray mt-3">Gerencie dados de perfil e segurança da conta.</p>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
                Abrir Usuários
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}