import React from 'react';
import { FeedbackDashboard } from '@/components/Admin/FeedbackDashboard';
import SEOManager from '@/components/SEO/SEOManager';

export default function AdminFeedback() {
  return (
    <div className="space-y-6">
      <SEOManager
        metadata={{
          title: 'Feedbacks dos Usuários - Admin AIMindset',
          description: 'Analise feedbacks dos usuários, métricas e melhorias sugeridas.',
          keywords: ['admin', 'feedback', 'usuários', 'métricas', 'análise', 'aimindset'],
          canonicalUrl: 'https://aimindset.com.br/admin/feedback',
          type: 'webpage',
          language: 'pt-BR',
          robots: 'noindex, nofollow',
          breadcrumbs: [
            { name: 'Admin', url: 'https://aimindset.com.br/admin', position: 1 },
            { name: 'Feedback', url: 'https://aimindset.com.br/admin/feedback', position: 2 }
          ]
        }}
      />
      <FeedbackDashboard />
    </div>
  );
}