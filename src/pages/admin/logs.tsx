import React from 'react';
import { LogsTab } from '@/components/Admin/LogsTab';
import SEOManager from '@/components/SEO/SEOManager';

export default function AdminLogs() {
  return (
    <div className="space-y-8">
      <SEOManager metadata={{
        title: 'Logs do Sistema - Admin AIMindset',
        description: 'Monitore eventos, erros e atividades do sistema em tempo real.',
        keywords: ['logs', 'monitoramento', 'erros', 'atividades', 'admin'],
        canonicalUrl: 'https://aimindset.com.br/admin/logs',
        type: 'webpage',
        language: 'pt-BR',
        robots: 'noindex, nofollow',
        breadcrumbs: [
          { name: 'Admin', url: 'https://aimindset.com.br/admin', position: 1 },
          { name: 'Logs', url: 'https://aimindset.com.br/admin/logs', position: 2 }
        ]
      }} />
      <LogsTab />
    </div>
  );
}