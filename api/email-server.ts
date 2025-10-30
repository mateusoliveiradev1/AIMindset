import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendAlertEmail, testEmailSystem, AlertEmailData } from './emailService';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.EMAIL_SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'email-server',
    port: PORT
  });
});

// Endpoint para envio de emails de alerta
app.post('/api/send-alert-email', async (req, res) => {
  try {
    const { recipients, alertData } = req.body;

    console.log('📧 Recebida solicitação de envio de email:', {
      recipients: recipients?.length || 0,
      alertType: alertData?.type,
      alertSource: alertData?.source
    });

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

    // Enviar email
    const result = await sendAlertEmail(recipients, alertData);
    
    if (result.success) {
      console.log('✅ Email enviado com sucesso:', result.messageId);
      res.json({ 
        success: true, 
        messageId: result.messageId,
        message: 'Email sent successfully via Node.js (no Docker required)' 
      });
    } else {
      console.error('❌ Falha no envio do email:', result.error);
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }

  } catch (error: any) {
    console.error('💥 Erro no endpoint de email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Endpoint para testar o sistema de emails
app.post('/api/test-email-system', async (req, res) => {
  try {
    console.log('🧪 Iniciando teste do sistema de emails...');
    
    const result = await testEmailSystem();
    
    if (result.success) {
      console.log('✅ Teste de email realizado com sucesso');
      res.json({ 
        success: true, 
        message: 'Test email sent successfully via Node.js (no Docker required)' 
      });
    } else {
      console.error('❌ Falha no teste de email:', result.error);
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }

  } catch (error: any) {
    console.error('💥 Erro no teste de email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Endpoint para verificar configuração
app.get('/api/email-config', (req, res) => {
  res.json({
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 8) + '...',
    port: PORT,
    dockerRequired: false,
    service: 'nodejs-email-server'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de emails rodando na porta ${PORT}`);
  console.log(`📧 Endpoint: http://localhost:${PORT}/api/send-alert-email`);
  console.log(`🧪 Teste: http://localhost:${PORT}/api/test-email-system`);
  console.log(`❌ Docker: NÃO NECESSÁRIO`);
  console.log(`✅ Resend API: ${process.env.RESEND_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
});

export default app;