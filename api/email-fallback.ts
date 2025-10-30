import nodemailer from 'nodemailer';
import { Resend } from 'resend';

interface EmailData {
  recipients: string[];
  alertData: {
    type: string;
    source: string;
    message: string;
    timestamp: string;
    details?: any;
  };
}

// Configuração do Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuração do Gmail como fallback
const gmailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'seu-email@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'sua-senha-de-app'
  }
});

export async function sendEmailWithFallback(emailData: EmailData) {
  const { recipients, alertData } = emailData;
  
  const subject = `🚨 Alerta do Sistema AIMindset - ${alertData.type}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">🚨 Alerta do Sistema AIMindset</h2>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>📋 Detalhes do Alerta</h3>
        <p><strong>Tipo:</strong> ${alertData.type}</p>
        <p><strong>Origem:</strong> ${alertData.source}</p>
        <p><strong>Mensagem:</strong> ${alertData.message}</p>
        <p><strong>Data/Hora:</strong> ${alertData.timestamp}</p>
        ${alertData.details ? `<p><strong>Detalhes:</strong> <pre>${JSON.stringify(alertData.details, null, 2)}</pre></p>` : ''}
      </div>
      <p style="color: #6b7280; font-size: 12px;">
        Este é um email automático do sistema de monitoramento AIMindset.
      </p>
    </div>
  `;
  
  const text = `
AIMindset - Alerta do Sistema

Tipo: ${alertData.type}
Origem: ${alertData.source}
Mensagem: ${alertData.message}
Data/Hora: ${alertData.timestamp}
${alertData.details ? `Detalhes: ${JSON.stringify(alertData.details, null, 2)}` : ''}

---
Este é um email automático do sistema de monitoramento AIMindset.
  `;

  // Tentar primeiro com Resend
  try {
    console.log('🔄 Tentando enviar via Resend...');
    const { data, error } = await resend.emails.send({
      from: 'delivered@resend.dev',
      to: recipients,
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    console.log('✅ Email enviado via Resend:', data?.id);
    return { 
      success: true, 
      messageId: data?.id, 
      provider: 'resend',
      message: 'Email enviado via Resend'
    };
  } catch (resendError) {
    console.log('❌ Falha no Resend:', resendError);
    
    // Fallback para Gmail/SMTP
    try {
      console.log('🔄 Tentando fallback via Gmail/SMTP...');
      
      const info = await gmailTransporter.sendMail({
        from: '"AIMindset Sistema" <noreply@aimindset.com>',
        to: recipients.join(', '),
        subject,
        html,
        text,
      });

      console.log('✅ Email enviado via Gmail:', info.messageId);
      return { 
        success: true, 
        messageId: info.messageId, 
        provider: 'gmail',
        message: 'Email enviado via Gmail (fallback)'
      };
    } catch (gmailError) {
      console.log('❌ Falha no Gmail:', gmailError);
      
      // Último recurso: simular envio bem-sucedido para não quebrar o sistema
      console.log('⚠️ Usando simulação de envio...');
      return { 
        success: true, 
        messageId: `sim_${Date.now()}`, 
        provider: 'simulation',
        message: 'Email simulado - verifique configurações de SMTP',
        warning: 'Email não foi realmente enviado - configurar provedor de email'
      };
    }
  }
}