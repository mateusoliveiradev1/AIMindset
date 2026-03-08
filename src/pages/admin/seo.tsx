import React from 'react';
import { SEODashboard } from '@/components/Admin/SEODashboard';
import { PSEOManager } from '@/components/Admin/PSEOManager';
import SEOManager from '@/components/SEO/SEOManager';

export default function AdminSEO() {
  return (
    <div className="space-y-12 pb-20">
      <SEOManager metadata={{
        title: 'SEO Dashboard - Admin AIMindset',
        description: 'Gerencie metadados, títulos e performance SEO do site.',
        keywords: ['seo', 'metadados', 'open graph', 'twitter card', 'admin', 'pseo'],
        canonicalUrl: 'https://aimindset.com.br/admin/seo',
        type: 'webpage',
        language: 'pt-BR',
        robots: 'noindex, nofollow',
        breadcrumbs: [
          { name: 'Admin', url: 'https://aimindset.com.br/admin', position: 1 },
          { name: 'SEO', url: 'https://aimindset.com.br/admin/seo', position: 2 }
        ]
      }} />

      <section>
        <PSEOManager />
      </section>

      <section className="pt-8 border-t border-white/5">
        <h2 className="text-xl font-bold text-white mb-6">Métricas de SEO Estático</h2>
        <SEODashboard />
      </section>
    </div>
  );
}