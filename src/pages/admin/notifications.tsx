import React from 'react';
import NotificationCenter from '@/components/Admin/NotificationCenter';
import SEOManager from '@/components/SEO/SEOManager';

export default function AdminNotifications() {
  return (
    <div className="space-y-8">
      <SEOManager metadata={{
        title: 'Notificações - Admin AIMindset',
        description: 'Centro de notificações administrativas: eventos, alertas e atividades.',
        keywords: ['notificações', 'admin', 'alertas', 'eventos'],
        canonicalUrl: 'https://aimindset.com.br/admin/notifications',
        type: 'webpage',
        language: 'pt-BR',
        robots: 'noindex, nofollow',
        breadcrumbs: [
          { name: 'Admin', url: 'https://aimindset.com.br/admin', position: 1 },
          { name: 'Notificações', url: 'https://aimindset.com.br/admin/notifications', position: 2 }
        ]
      }} />
      <NotificationCenter />
    </div>
  );
}