-- Teste completo do fluxo de boas-vindas

-- 1. Criar um template de boas-vindas se não existir
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
  '550e8400-e29b-41d4-a716-446655440001',
  'Boas-vindas - AIMindset',
  'Template de email de boas-vindas para novos inscritos',
  'Bem-vindo à AIMindset! 🎉',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à AIMindset</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 40px; }
    .welcome-text { font-size: 18px; color: #333; line-height: 1.6; margin-bottom: 30px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
    .features { background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 30px 0; }
    .features h3 { color: #333; margin-top: 0; }
    .features ul { color: #666; line-height: 1.8; }
    .footer { background: #333; color: white; padding: 30px; text-align: center; font-size: 14px; }
    @media (max-width: 600px) {
      .header, .content { padding: 20px; }
      .header h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 Bem-vindo à AIMindset!</h1>
      <p>Sua jornada com Inteligência Artificial começa agora</p>
    </div>
    
    <div class="content">
      <div class="welcome-text">
        <p>Olá <strong>{{nome}}</strong>,</p>
        <p>É com grande alegria que damos as boas-vindas à nossa comunidade! Você agora faz parte de uma plataforma dedicada a explorar o incrível mundo da Inteligência Artificial de forma acessível e prática.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="https://aimindset.com.br" class="cta-button">Explorar a Plataforma</a>
      </div>
      
      <div class="features">
        <h3>🚀 O que você pode esperar:</h3>
        <ul>
          <li>Artigos sobre IA e tecnologia em português</li>
          <li>Tutoriais práticos e exemplos de código</li>
          <li>Análises das últimas tendências em IA</li>
          <li>Comunidade engajada e colaborativa</li>
        </ul>
      </div>
      
      <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; border-left: 4px solid #667eea;">
        <p><strong>💡 Dica:</strong> Comece explorando nossos artigos mais populares sobre Machine Learning e Deep Learning. Temos conteúdo para todos os níveis!</p>
      </div>
      
      <p>Se tiver alguma dúvida, não hesite em entrar em contato. Estamos aqui para ajudar!</p>
      
      <p>Atenciosamente,<br>
      <strong>Equipe AIMindset</strong></p>
    </div>
    
    <div class="footer">
      <p>Este é um email automático de boas-vindas.</p>
      <p>© 2025 AIMindset - Todos os direitos reservados</p>
      <p><a href="https://aimindset.com.br" style="color: #ccc;">www.aimindset.com.br</a></p>
    </div>
  </div>
</body>
</html>',
  'welcome',
  '["nome", "email"]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Criar automação de boas-vindas se não existir
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
  '550e8400-e29b-41d4-a716-446655440002',
  'Automação de Boas-vindas',
  'Envia email de boas-vindas automaticamente para novos inscritos',
  'welcome',
  '{"event": "subscriber_added", "status": "active"}',
  '550e8400-e29b-41d4-a716-446655440001',
  'Bem-vindo à AIMindset! 🎉',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à AIMindset</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 40px; }
    .welcome-text { font-size: 18px; color: #333; line-height: 1.6; margin-bottom: 30px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
    .features { background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 30px 0; }
    .features h3 { color: #333; margin-top: 0; }
    .features ul { color: #666; line-height: 1.8; }
    .footer { background: #333; color: white; padding: 30px; text-align: center; font-size: 14px; }
    @media (max-width: 600px) {
      .header, .content { padding: 20px; }
      .header h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 Bem-vindo à AIMindset!</h1>
      <p>Sua jornada com Inteligência Artificial começa agora</p>
    </div>
    
    <div class="content">
      <div class="welcome-text">
        <p>Olá <strong>{{nome}}</strong>,</p>
        <p>É com grande alegria que damos as boas-vindas à nossa comunidade! Você agora faz parte de uma plataforma dedicada a explorar o incrível mundo da Inteligência Artificial de forma acessível e prática.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="https://aimindset.com.br" class="cta-button">Explorar a Plataforma</a>
      </div>
      
      <div class="features">
        <h3>🚀 O que você pode esperar:</h3>
        <ul>
          <li>Artigos sobre IA e tecnologia em português</li>
          <li>Tutoriais práticos e exemplos de código</li>
          <li>Análises das últimas tendências em IA</li>
          <li>Comunidade engajada e colaborativa</li>
        </ul>
      </div>
      
      <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; border-left: 4px solid #667eea;">
        <p><strong>💡 Dica:</strong> Comece explorando nossos artigos mais populares sobre Machine Learning e Deep Learning. Temos conteúdo para todos os níveis!</p>
      </div>
      
      <p>Se tiver alguma dúvida, não hesite em entrar em contato. Estamos aqui para ajudar!</p>
      
      <p>Atenciosamente,<br>
      <strong>Equipe AIMindset</strong></p>
    </div>
    
    <div class="footer">
      <p>Este é um email automático de boas-vindas.</p>
      <p>© 2025 AIMindset - Todos os direitos reservados</p>
      <p><a href="https://aimindset.com.br" style="color: #ccc;">www.aimindset.com.br</a></p>
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
  'Template' as tipo,
  id::text as id,
  name as nome,
  CASE WHEN is_active THEN 'Ativo' ELSE 'Inativo' END as status
FROM email_templates 
WHERE template_type = 'welcome'
UNION ALL
SELECT 
  'Automação',
  id::text,
  name,
  CASE WHEN is_active THEN 'Ativa' ELSE 'Inativa' END
FROM email_automations 
WHERE trigger_type = 'welcome';