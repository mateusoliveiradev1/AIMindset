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
      alertIcon = '🚨';
      alertTitle = 'Erro de Aplicação';
      break;
    case 'security':
      alertClass = 'alert-box';
      alertIcon = '🔒';
      alertTitle = 'Alerta de Segurança';
      break;
    case 'performance':
      alertClass = 'alert-box warning';
      alertIcon = '⚡';
      alertTitle = 'Alerta de Performance';
      break;
    case 'test':
    case 'test_direct':
    case 'production_test':
      alertClass = 'alert-box info';
      alertIcon = '🧪';
      alertTitle = 'Teste do Sistema';
      break;
    default:
      alertClass = 'alert-box info';
      alertIcon = '📢';
      alertTitle = 'Notificação do Sistema';
  }

  const formattedTimestamp = new Date(timestamp).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${alertTitle} - AIMindset</title>
      ${baseStyle}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${alertIcon} ${alertTitle}</h1>
        </div>
        <div class="content">
          <div class="${alertClass}">
            <h2 style="margin-top: 0; color: #f3f4f6;">${message}</h2>
            <p><strong>Origem:</strong> ${source}</p>
            <p><strong>Tipo:</strong> ${type}</p>
            <p class="timestamp"><strong>Data/Hora:</strong> ${formattedTimestamp}</p>
          </div>
          
          ${details ? `
          <div class="details">
            <strong>Detalhes Técnicos:</strong><br>
            <pre>${JSON.stringify(details, null, 2)}</pre>
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Este é um alerta automático do sistema AIMindset.</p>
          <p>Não responda a este email - ele é enviado automaticamente.</p>
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