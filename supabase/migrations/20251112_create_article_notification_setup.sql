-- Template de notificação para novos artigos

-- 1. Criar template de email para notificação de artigos
INSERT INTO email_templates (
  id,
  name,
  description,
  subject,
  content,
  template_type,
  variables,
  is_active,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'Novo Artigo - AIMindset',
  'Template de email para notificar sobre novos artigos publicados',
  '📰 Novo Artigo: {{titulo}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Artigo - AIMindset</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
    .header-icon { font-size: 48px; margin-bottom: 10px; display: block; }
    .content { padding: 40px; }
    .article-preview { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #667eea; }
    .article-title { font-size: 22px; color: #333; margin: 0 0 15px 0; font-weight: bold; }
    .article-excerpt { font-size: 16px; color: #666; line-height: 1.6; margin: 15px 0; }
    .article-meta { display: flex; align-items: center; gap: 15px; margin: 20px 0; font-size: 14px; color: #888; }
    .meta-item { display: flex; align-items: center; gap: 5px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 20px 0; transition: all 0.3s ease; }
    .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
    .features { background: #e8f4fd; padding: 25px; border-radius: 12px; margin: 30px 0; }
    .features h3 { color: #333; margin-top: 0; font-size: 18px; }
    .features ul { color: #555; line-height: 1.8; margin: 0; padding-left: 20px; }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; font-size: 14px; }
    .social-links { margin: 20px 0; }
    .social-links a { color: #667eea; text-decoration: none; margin: 0 10px; font-size: 18px; }
    .highlight { background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%); padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    @media (max-width: 600px) {
      .header { padding: 20px; }
      .content { padding: 25px; }
      .header h1 { font-size: 20px; }
      .article-title { font-size: 18px; }
      .article-meta { flex-direction: column; align-items: flex-start; gap: 8px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="header-icon">📰</span>
      <h1>Novo Artigo Publicado!</h1>
      <p>Confira o conteúdo mais recente da AIMindset</p>
    </div>
    
    <div class="content">
      <p>Olá <strong>{{nome}}</strong>,</p>
      
      <p>Temos uma <span class="highlight">novidade incrível</span> para você! Publicamos um artigo fresquinho sobre <strong>{{categoria}}</strong> que vai expandir seus conhecimentos em IA.</p>
      
      <div class="article-preview">
        <h2 class="article-title">{{titulo}}</h2>
        <div class="article-excerpt">{{resumo}}</div>
        <div class="article-meta">
          <span class="meta-item">📅 {{data_publicacao}}</span>
          <span class="meta-item">⏱️ {{tempo_leitura}} min de leitura</span>
          <span class="meta-item">👤 Por {{autor}}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="{{url_artigo}}" class="cta-button">📖 Ler Artigo Completo</a>
      </div>
      
      <div class="features">
        <h3>🚀 Por que vale a pena ler:</h3>
        <ul>
          <li>Conteúdo <strong>100% em português</strong> e fácil de entender</li>
          <li>Exemplos práticos e códigos que você pode usar hoje mesmo</li>
          <li>Explicações claras sobre conceitos complexos de IA</li>
          <li>Dicas para aplicar IA no seu dia a dia ou projetos</li>
        </ul>
      </div>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 10px; border-left: 4px solid #ffc107; margin: 25px 0;">
        <p><strong>💡 Não perca tempo!</strong> Artigos sobre IA ficam desatualizados rapidamente. Aproveite para estar sempre um passo à frente.</p>
      </div>
      
      <p>Esperamos que você aproveite bastante este conteúdo! Se tiver alguma dúvida ou quiser sugerir temas para próximos artigos, é só responder este email.</p>
      
      <p>Até a próxima,<br>
      <strong>Equipe AIMindset</strong> 🤖</p>
      
      <div class="social-links">
        <a href="#">📧 Email</a>
        <a href="#">💬 Discord</a>
        <a href="#">🐦 Twitter</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Você está recebendo este email por ser assinante da AIMindset.</p>
      <p>© 2025 AIMindset - Todos os direitos reservados</p>
      <p><a href="https://aimindset.com.br" style="color: #667eea;">www.aimindset.com.br</a></p>
    </div>
  </div>
</body>
</html>',
  'notification',
  '["nome", "titulo", "resumo", "categoria", "data_publicacao", "tempo_leitura", "autor", "url_artigo"]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Criar automação para notificar sobre novos artigos
INSERT INTO email_automations (
  id,
  name,
  description,
  trigger_type,
  trigger_conditions,
  email_template_id,
  email_subject,
  email_content,
  delay_hours,
  is_active,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  'Notificação de Novo Artigo',
  'Envia notificação por email quando um novo artigo é publicado',
  'article_published',
  '{"event": "article_published", "status": "published"}',
  '550e8400-e29b-41d4-a716-446655440003',
  '📰 Novo Artigo: {{titulo}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Artigo - AIMindset</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
    .header-icon { font-size: 48px; margin-bottom: 10px; display: block; }
    .content { padding: 40px; }
    .article-preview { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #667eea; }
    .article-title { font-size: 22px; color: #333; margin: 0 0 15px 0; font-weight: bold; }
    .article-excerpt { font-size: 16px; color: #666; line-height: 1.6; margin: 15px 0; }
    .article-meta { display: flex; align-items: center; gap: 15px; margin: 20px 0; font-size: 14px; color: #888; }
    .meta-item { display: flex; align-items: center; gap: 5px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 20px 0; transition: all 0.3s ease; }
    .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
    .features { background: #e8f4fd; padding: 25px; border-radius: 12px; margin: 30px 0; }
    .features h3 { color: #333; margin-top: 0; font-size: 18px; }
    .features ul { color: #555; line-height: 1.8; margin: 0; padding-left: 20px; }
    .footer { background: #2c3e50; color: white; padding: 30px; text-align: center; font-size: 14px; }
    .social-links { margin: 20px 0; }
    .social-links a { color: #667eea; text-decoration: none; margin: 0 10px; font-size: 18px; }
    .highlight { background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%); padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    @media (max-width: 600px) {
      .header { padding: 20px; }
      .content { padding: 25px; }
      .header h1 { font-size: 20px; }
      .article-title { font-size: 18px; }
      .article-meta { flex-direction: column; align-items: flex-start; gap: 8px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="header-icon">📰</span>
      <h1>Novo Artigo Publicado!</h1>
      <p>Confira o conteúdo mais recente da AIMindset</p>
    </div>
    
    <div class="content">
      <p>Olá <strong>{{nome}}</strong>,</p>
      
      <p>Temos uma <span class="highlight">novidade incrível</span> para você! Publicamos um artigo fresquinho sobre <strong>{{categoria}}</strong> que vai expandir seus conhecimentos em IA.</p>
      
      <div class="article-preview">
        <h2 class="article-title">{{titulo}}</h2>
        <div class="article-excerpt">{{resumo}}</div>
        <div class="article-meta">
          <span class="meta-item">📅 {{data_publicacao}}</span>
          <span class="meta-item">⏱️ {{tempo_leitura}} min de leitura</span>
          <span class="meta-item">👤 Por {{autor}}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="{{url_artigo}}" class="cta-button">📖 Ler Artigo Completo</a>
      </div>
      
      <div class="features">
        <h3>🚀 Por que vale a pena ler:</h3>
        <ul>
          <li>Conteúdo <strong>100% em português</strong> e fácil de entender</li>
          <li>Exemplos práticos e códigos que você pode usar hoje mesmo</li>
          <li>Explicações claras sobre conceitos complexos de IA</li>
          <li>Dicas para aplicar IA no seu dia a dia ou projetos</li>
        </ul>
      </div>
      
      <div style="background: #fff3cd; padding: 20px; border-radius: 10px; border-left: 4px solid #ffc107; margin: 25px 0;">
        <p><strong>💡 Não perca tempo!</strong> Artigos sobre IA ficam desatualizados rapidamente. Aproveite para estar sempre um passo à frente.</p>
      </div>
      
      <p>Esperamos que você aproveite bastante este conteúdo! Se tiver alguma dúvida ou quiser sugerir temas para próximos artigos, é só responder este email.</p>
      
      <p>Até a próxima,<br>
      <strong>Equipe AIMindset</strong> 🤖</p>
      
      <div class="social-links">
        <a href="#">📧 Email</a>
        <a href="#">💬 Discord</a>
        <a href="#">🐦 Twitter</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Você está recebendo este email por ser assinante da AIMindset.</p>
      <p>© 2025 AIMindset - Todos os direitos reservados</p>
      <p><a href="https://aimindset.com.br" style="color: #667eea;">www.aimindset.com.br</a></p>
    </div>
  </div>
</body>
</html>',
  0,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Verificar configuração atual
SELECT 
  'Template de Artigo' as tipo,
  id::text as id,
  name as nome,
  subject as assunto,
  CASE WHEN is_active THEN 'Ativo' ELSE 'Inativo' END as status
FROM email_templates 
WHERE template_type = 'notification' AND name = 'Novo Artigo - AIMindset'
UNION ALL
SELECT 
  'Automação de Artigo',
  id::text,
  name,
  email_subject,
  CASE WHEN is_active THEN 'Ativa' ELSE 'Inativa' END
FROM email_automations 
WHERE trigger_type = 'article_published';