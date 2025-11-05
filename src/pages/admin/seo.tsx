import React from 'react';
import { SEODashboard } from '@/components/Admin/SEODashboard';
import SEOManager from '@/components/SEO/SEOManager';

export default function AdminSEO() {
  return (
    <div className="space-y-8">
      <SEOManager metadata={{
        title: 'SEO Dashboard - Admin AIMindset',
        description: 'Gerencie metadados, títulos e performance SEO do site.',
        keywords: ['seo', 'metadados', 'open graph', 'twitter card', 'admin'],
        canonicalUrl: 'https://aimindset.com.br/admin/seo',
        type: 'webpage',
        language: 'pt-BR',
        robots: 'noindex, nofollow',
        breadcrumbs: [
          { name: 'Admin', url: 'https://aimindset.com.br/admin', position: 1 },
          { name: 'SEO', url: 'https://aimindset.com.br/admin/seo', position: 2 }
        ]
      }} />
      <SEODashboard />
    </div>
  );
}