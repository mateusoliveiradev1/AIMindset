import express from 'express';
import cors from 'cors';
import path from 'path';
import { generateSitemap, generateRobotsTxt } from './sitemap';
import { sendAlertEmail, testEmailSystem, AlertEmailData } from './emailService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../dist')));

// Rotas SEO
app.get('/sitemap.xml', generateSitemap);
app.get('/robots.txt', generateRobotsTxt);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Endpoint para envio de emails de alerta
app.post('/api/send-alert-email', async (req, res) => {
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

    // Enviar email
    const result = await sendAlertEmail(recipients, alertData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        messageId: result.messageId,
        message: 'Email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }

  } catch (error: any) {
    console.error('Erro no endpoint de email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Endpoint para testar o sistema de emails
app.post('/api/test-email-system', async (req, res) => {
  try {
    const result = await testEmailSystem();
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }

  } catch (error: any) {
    console.error('Erro no teste de email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;