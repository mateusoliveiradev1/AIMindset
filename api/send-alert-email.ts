import { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface AlertEmailData {
  type: string;
  source: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Interface para configuração de alertas
interface AlertConfig {
  icon: string;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  actionText?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Templates de email para diferentes tipos de alerta
const getEmailTemplate = (alertData: AlertEmailData): EmailTemplate => {
  const { type, source, message, details, timestamp } = alertData;
  
  // Configurações avançadas por tipo de alerta
  const alertConfigs: Record<string, AlertConfig> = {
    // Erros críticos
    'critical_error': {
      icon: '🔥',
      title: 'Erro Crítico do Sistema',
      color: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.1)',
      borderColor: '#dc2626',
      priority: 'critical',
      actionText: 'Verificar Sistema',
      actionUrl: 'https://aimindset.com.br/admin'
    },
    'error': {
      icon: '🚨',
      title: 'Erro de Aplicação',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: '#ef4444',
      priority: 'high'
    },
    'app_error': {
      icon: '⚠️',
      title: 'Erro de Aplicação',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: '#ef4444',
      priority: 'high'
    },
    
    // Segurança
    'security': {
      icon: '🔒',
      title: 'Alerta de Segurança',
      color: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.1)',
      borderColor: '#dc2626',
      priority: 'critical',
      actionText: 'Revisar Logs',
      actionUrl: 'https://aimindset.com.br/admin/security'
    },
    
    // Performance
    'performance': {
      icon: '⚡',
      title: 'Alerta de Performance',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: '#f59e0b',
      priority: 'medium'
    },
    'performance_warning': {
      icon: '📊',
      title: 'Aviso de Performance',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: '#f59e0b',
      priority: 'medium'
    },
    
    // Backup
    'backup_success': {
      icon: '✅',
      title: 'Backup Realizado com Sucesso',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: '#10b981',
      priority: 'low'
    },
    'backup_failure': {
      icon: '❌',
      title: 'Falha no Backup',
      color: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.1)',
      borderColor: '#dc2626',
      priority: 'critical',
      actionText: 'Verificar Backup',
      actionUrl: 'https://aimindset.com.br/admin/backup'
    },
    
    // Sistema
    'system_maintenance': {
      icon: '🔧',
      title: 'Manutenção do Sistema',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: '#3b82f6',
      priority: 'medium'
    },
    
    // Testes
    'test': {
      icon: '🧪',
      title: 'Teste do Sistema',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      borderColor: '#8b5cf6',
      priority: 'low'
    },
    'test_direct': {
      icon: '🔬',
      title: 'Teste Direto',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      borderColor: '#8b5cf6',
      priority: 'low'
    },
    'production_test': {
      icon: '🚀',
      title: 'Teste em Produção',
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.1)',
      borderColor: '#06b6d4',
      priority: 'medium'
    }
  };

  // Configuração padrão
  const defaultConfig: AlertConfig = {
    icon: '📢',
    title: 'Notificação do Sistema',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: '#6b7280',
    priority: 'medium'
  };

  const config = alertConfigs[type] || defaultConfig;

  const formattedTimestamp = new Date(timestamp).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Prioridade visual
  const priorityBadge = {
    'critical': { text: 'CRÍTICO', color: '#dc2626', bg: '#fef2f2' },
    'high': { text: 'ALTO', color: '#ea580c', bg: '#fff7ed' },
    'medium': { text: 'MÉDIO', color: '#d97706', bg: '#fffbeb' },
    'low': { text: 'BAIXO', color: '#059669', bg: '#f0fdf4' }
  }[config.priority];

  // CSS moderno e responsivo
  const modernStyle = `
    <style>
      * { box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        margin: 0; 
        padding: 0; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        line-height: 1.6;
      }
      
      .email-wrapper {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        min-height: 100vh;
      }
      
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      
      .header { 
        background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%);
        padding: 30px 20px;
        text-align: center;
        position: relative;
      }
      
      .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        opacity: 0.3;
      }
      
      .logo {
        display: inline-block;
        background: linear-gradient(45deg, #00d4ff, #9333ea);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 28px;
        font-weight: 800;
        margin-bottom: 10px;
        position: relative;
        z-index: 1;
      }
      
      .header h1 { 
        color: white; 
        margin: 0; 
        font-size: 24px; 
        font-weight: 600;
        position: relative;
        z-index: 1;
      }
      
      .priority-badge {
        display: inline-block;
        background: ${priorityBadge.bg};
        color: ${priorityBadge.color};
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        margin-top: 10px;
        border: 1px solid ${priorityBadge.color}20;
      }
      
      .content { 
        padding: 40px 30px; 
        background: #ffffff;
      }
      
      .alert-card { 
        background: ${config.bgColor};
        border: 2px solid ${config.borderColor};
        border-radius: 12px; 
        padding: 25px; 
        margin: 25px 0;
        position: relative;
        overflow: hidden;
      }
      
      .alert-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: ${config.color};
      }
      
      .alert-header {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
      }
      
      .alert-icon {
        font-size: 32px;
        margin-right: 15px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      }
      
      .alert-title {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      
      .alert-message {
        font-size: 16px;
        color: #374151;
        margin: 15px 0;
        line-height: 1.6;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin: 20px 0;
      }
      
      .info-item {
        background: #f9fafb;
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid ${config.color};
      }
      
      .info-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      
      .info-value {
        font-size: 14px;
        color: #1f2937;
        font-weight: 500;
      }
      
      .details-section { 
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px; 
        padding: 20px; 
        margin: 25px 0;
      }
      
      .details-title {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
      }
      
      .details-content {
        background: #1e293b;
        color: #e2e8f0;
        padding: 15px;
        border-radius: 8px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
        overflow-x: auto;
      }
      
      .action-button {
        display: inline-block;
        background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        margin-top: 20px;
        box-shadow: 0 4px 12px ${config.color}40;
        transition: all 0.3s ease;
      }
      
      .footer { 
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        padding: 30px; 
        text-align: center;
        border-top: 1px solid #e2e8f0;
      }
      
      .footer-brand {
        font-size: 18px;
        font-weight: 700;
        background: linear-gradient(45deg, #1e40af, #7c3aed);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 10px;
      }
      
      .footer-text { 
        color: #64748b; 
        font-size: 14px;
        margin: 5px 0;
      }
      
      .footer-links {
        margin-top: 20px;
      }
      
      .footer-link {
        color: #3b82f6;
        text-decoration: none;
        margin: 0 10px;
        font-size: 14px;
      }
      
      /* Responsividade */
      @media (max-width: 600px) {
        .email-wrapper { padding: 10px; }
        .container { margin: 0; border-radius: 0; }
        .content { padding: 20px 15px; }
        .info-grid { grid-template-columns: 1fr; }
        .alert-header { flex-direction: column; text-align: center; }
        .alert-icon { margin-right: 0; margin-bottom: 10px; }
      }
    </style>
  `;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>${config.title} - AIMindset</title>
      ${modernStyle}
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <div class="logo">🧠 AIMindset</div>
            <h1>${config.icon} ${config.title}</h1>
            <div class="priority-badge">${priorityBadge.text}</div>
          </div>
          
          <div class="content">
            <div class="alert-card">
              <div class="alert-header">
                <div class="alert-icon">${config.icon}</div>
                <h2 class="alert-title">${config.title}</h2>
              </div>
              
              <div class="alert-message">${message}</div>
              
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Origem</div>
                  <div class="info-value">${source}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Tipo</div>
                  <div class="info-value">${type}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Prioridade</div>
                  <div class="info-value">${priorityBadge.text}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Data/Hora</div>
                  <div class="info-value">${formattedTimestamp}</div>
                </div>
              </div>
              
              ${config.actionText && config.actionUrl ? `
                <a href="${config.actionUrl}" class="action-button">
                  ${config.actionText} →
                </a>
              ` : ''}
            </div>
            
            ${details ? `
            <div class="details-section">
              <div class="details-title">
                🔍 Detalhes Técnicos
              </div>
              <div class="details-content">${JSON.stringify(details, null, 2)}</div>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <div class="footer-brand">🧠 AIMindset</div>
            <div class="footer-text">Sistema de Monitoramento Inteligente</div>
            <div class="footer-text">Este é um alerta automático. Não responda a este email.</div>
            <div class="footer-links">
              <a href="https://aimindset.com.br" class="footer-link">Site</a>
              <a href="https://aimindset.com.br/admin" class="footer-link">Admin</a>
              <a href="https://aimindset.com.br/contact" class="footer-link">Suporte</a>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${alertIcon} ${alertTitle}

${message}

Origem: ${source}
Tipo: ${type}
Data/Hora: ${formattedTimestamp}

${details ? `Detalhes: ${JSON.stringify(details, null, 2)}` : ''}

---
Este é um alerta automático do sistema AIMindset.
  `;

  return {
    subject: `${alertIcon} ${alertTitle} - AIMindset`,
    html,
    text
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { recipients, alertData } = req.body;

    // Validação básica
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipients array is required and must not be empty' 
      });
    }

    if (!alertData || !alertData.type || !alertData.source || !alertData.message) {
      return res.status(400).json({ 
        success: false, 
        error: 'AlertData with type, source, and message is required' 
      });
    }

    // Verificar se a API key do Resend está configurada
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY não configurada');
      return res.status(500).json({ 
        success: false, 
        error: 'Email service not configured' 
      });
    }

    // Gerar template do email
    const template = getEmailTemplate(alertData);

    // Enviar email
    const emailResult = await resend.emails.send({
      from: 'AIMindset Alerts <alerts@aimindset.com.br>',
      to: recipients,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    console.log('✅ Email enviado com sucesso:', {
      messageId: emailResult.data?.id,
      recipients: recipients.length,
      type: alertData.type
    });

    return res.status(200).json({ 
      success: true, 
      messageId: emailResult.data?.id,
      message: 'Email sent successfully via Vercel Function',
      recipients: recipients.length
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}