import React from 'react';
import NewsletterLogs from '@/components/Admin/NewsletterLogs';
import SEOManager from '@/components/SEO/SEOManager';

export default function AdminNewsletter() {
  return (
    <div className="space-y-8">
      <SEOManager metadata={{
        title: 'Newsletter - Admin AIMindset',
        description: 'Acompanhe envio, inscrições e métricas de newsletter.',
        keywords: ['newsletter', 'inscritos', 'envios', 'admin'],
        canonicalUrl: 'https://aimindset.com.br/admin/newsletter',
        type: 'webpage',
        language: 'pt-BR',
        robots: 'noindex, nofollow',
        breadcrumbs: [
          { name: 'Admin', url: 'https://aimindset.com.br/admin', position: 1 },
          { name: 'Newsletter', url: 'https://aimindset.com.br/admin/newsletter', position: 2 }
        ]
      }} />
      <NewsletterLogs />
    </div>
  );
}