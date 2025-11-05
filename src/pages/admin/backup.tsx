import React from 'react';
import { BackupTab } from '@/components/Admin/BackupTab';
import SEOManager from '@/components/SEO/SEOManager';

export default function AdminBackup() {
  return (
    <div className="space-y-8">
      <SEOManager
        metadata={{
          title: 'Sistema de Backup - Admin AIMindset',
          description: 'Gerencie backups, restaurações e integridade dos dados da plataforma.',
          keywords: ['admin', 'backup', 'restauração', 'dados', 'segurança', 'aimindset'],
          canonicalUrl: 'https://aimindset.com.br/admin/backup',
          type: 'webpage',
          language: 'pt-BR',
          robots: 'noindex, nofollow',
          breadcrumbs: [
            { name: 'Admin', url: 'https://aimindset.com.br/admin', position: 1 },
            { name: 'Backup', url: 'https://aimindset.com.br/admin/backup', position: 2 }
          ]
        }}
      />
      <BackupTab />
    </div>
  );
}