import express from 'express';
import cors from 'cors';
import path from 'path';
import { generateSitemap, generateRobotsTxt } from './sitemap';

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

// Fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;