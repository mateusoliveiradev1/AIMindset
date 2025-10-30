import { Resend } from 'resend';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

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

// Templates de email para diferentes tipos de alerta
const getEmailTemplate = (alertData: AlertEmailData): EmailTemplate => {
  const { type, source, message, details, timestamp } = alertData;
  
  const baseStyle = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; }
      .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
      .header { background: linear-gradient(90deg, #00d4ff 0%, #9333ea 100%); padding: 20px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 24px; }
      .content { padding: 30px; color: #e5e7eb; }
      .alert-box { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .alert-box.warning { background: rgba(245, 158, 11, 0.1); border-color: #f59e0b; }
      .alert-box.info { background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; }
      .details { background: #1f2937; border-radius: 8px; padding: 15px; margin: 15px 0; font-family: monospace; font-size: 14px; }
      .footer { background: #111827; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
      .timestamp { color: #6b7280; font-size: 14px; }
    </style>
  `;

  let alertClass = 'alert-box';
  let alertIcon = '🚨';
  let alertTitle = 'Alerta do Sistema';

  switch (type) {
    case 'error':
    case 'app_error':
      alertClass = 'alert-box';
      alertIcon = '❌';
      alertTitle = 'Erro Crítico Detectado';
      break;
    case 'security':
      alertClass = 'alert-box';
      alertIcon = '🔒';
      alertTitle = 'Alerta de Segurança';
      break;
    case 'warning':
      alertClass = 'alert-box warning';
      alertIcon = '⚠️';
      alertTitle = 'Aviso do Sistema';
      break;
    case 'test':
      alertClass = 'alert-box info';
      alertIcon = '🧪';
      alertTitle = 'Teste do Sistema de Alertas';
      break;
    default:
      alertClass = 'alert-box info';
      alertIcon = 'ℹ️';
      alertTitle = 'Notificação do Sistema';
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AIMindset - ${alertTitle}</title>
      ${baseStyle}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤖 AIMindset</h1>
          <p style="margin: 5px 0 0 0; color: #e5e7eb;">Sistema de Monitoramento</p>
        </div>
        
        <div class="content">
          <div class="${alertClass}">
            <h2 style="margin: 0 0 15px 0; color: white; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">${alertIcon}</span>
              ${alertTitle}
            </h2>
            
            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.5;">
              <strong>Mensagem:</strong> ${message}
            </p>
            
            <p style="margin: 0 0 10px 0;">
              <strong>Origem:</strong> ${source}
            </p>
            
            <p class="timestamp">
              <strong>Data/Hora:</strong> ${new Date(timestamp).toLocaleString('pt-BR', { 
                timeZone: 'America/Sao_Paulo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
          
          ${details ? `
            <div class="details">
              <strong>Detalhes Técnicos:</strong><br>
              <pre style="margin: 10px 0 0 0; white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(details, null, 2)}</pre>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding: 20px; background: #374151; border-radius: 8px;">
            <h3 style="margin: 0 0 15px 0; color: #10b981;">📋 Próximos Passos</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Verifique os logs detalhados no painel administrativo</li>
              <li>Analise o contexto do erro para identificar a causa</li>
              <li>Implemente correções se necessário</li>
              <li>Monitore o sistema para verificar se o problema foi resolvido</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p>Este é um email automático do sistema de monitoramento AIMindset.</p>
          <p>Para gerenciar suas notificações, acesse o painel administrativo.</p>
          <p style="margin-top: 15px;">
            <strong>AIMindset</strong> - Inteligência Artificial para o Futuro<br>
            © ${new Date().getFullYear()} - Todos os direitos reservados
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
AIMindset - ${alertTitle}

${alertIcon} ${alertTitle}

Mensagem: ${message}
Origem: ${source}
Data/Hora: ${new Date(timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

${details ? `Detalhes Técnicos:\n${JSON.stringify(details, null, 2)}` : ''}

Próximos Passos:
- Verifique os logs detalhados no painel administrativo
- Analise o contexto do erro para identificar a causa
- Implemente correções se necessário
- Monitore o sistema para verificar se o problema foi resolvido

---
Este é um email automático do sistema de monitoramento AIMindset.
Para gerenciar suas notificações, acesse o painel administrativo.

AIMindset - Inteligência Artificial para o Futuro
© ${new Date().getFullYear()} - Todos os direitos reservados
  `;

  return {
    subject: `[AIMindset] ${alertTitle} - ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
    html,
    text
  };
};

// Função principal para enviar emails de alerta
export const sendAlertEmail = async (
  recipients: string[],
  alertData: AlertEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    console.log('📧 Enviando email de alerta:', {
      recipients,
      type: alertData.type,
      source: alertData.source
    });

    const template = getEmailTemplate(alertData);

    // Envio com domínio verificado aimindset.com.br
    const { data, error } = await resend.emails.send({
      from: 'AIMindset <noreply@aimindset.com.br>',
      to: recipients,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('❌ Erro ao enviar email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email enviado com sucesso via domínio verificado:', data?.id);
    return { success: true, messageId: data?.id };

  } catch (error: any) {
    console.error('💥 Erro inesperado ao enviar email:', error);
    return { success: false, error: error.message };
  }
};

// Função para testar o envio de email
export const testEmailSystem = async (): Promise<{ success: boolean; error?: string }> => {
  const testAlert: AlertEmailData = {
    type: 'test',
    source: 'email_service_test',
    message: 'Teste do sistema de emails - Funcionando sem Docker!',
    details: {
      test_id: `test_${Date.now()}`,
      environment: 'development',
      docker_required: false
    },
    timestamp: new Date().toISOString()
  };

  const result = await sendAlertEmail(['delivered@resend.dev'], testAlert);
  return result;
};