-- Criar tabela para automações de email
CREATE TABLE IF NOT EXISTS email_automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('welcome', 'onboarding', 'article_published', 'inactive_user', 'birthday')),
  trigger_conditions JSONB DEFAULT '{}',
  email_template_id VARCHAR(255),
  email_subject VARCHAR(500),
  email_content TEXT,
  delay_hours INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  stats JSONB DEFAULT '{"total_sent": 0, "total_opened": 0, "total_clicked": 0, "last_sent": null}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_email_automations_trigger_type ON email_automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_email_automations_is_active ON email_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_email_automations_created_at ON email_automations(created_at);

-- Inserir automações padrão
INSERT INTO email_automations (name, description, trigger_type, email_subject, email_content, delay_hours, is_active) VALUES
(
  'Email de Boas-vindas',
  'Enviado automaticamente quando um usuário se inscreve na newsletter',
  'welcome',
  'Bem-vindo(a) ao AIMindset! 🚀',
  '<h1>Bem-vindo(a) ao AIMindset!</h1>
   <p>Olá {{name}},</p>
   <p>É com grande alegria que te damos as boas-vindas à nossa comunidade de entusiastas de Inteligência Artificial!</p>
   <p>Aqui você encontrará:</p>
   <ul>
     <li>📚 Artigos exclusivos sobre IA e tecnologia</li>
     <li>🔬 Análises aprofundadas das últimas tendências</li>
     <li>💡 Insights práticos para aplicar IA no seu dia a dia</li>
     <li>🎯 Conteúdo curado especialmente para você</li>
   </ul>
   <p>Fique atento(a) ao seu email - em breve você receberá nosso primeiro conteúdo exclusivo!</p>
   <p>Abraços,<br>Equipe AIMindset</p>',
  0,
  true
),
(
  'Sequência de Onboarding - Dia 1',
  'Primeiro email da sequência de onboarding enviado 24h após inscrição',
  'onboarding',
  'Sua jornada na IA começa agora! 🤖',
  '<h1>Sua jornada na IA começa agora!</h1>
   <p>Olá {{name}},</p>
   <p>Esperamos que esteja animado(a) para começar sua jornada no mundo da Inteligência Artificial!</p>
   <p>Para começar bem, preparamos alguns recursos especiais:</p>
   <h3>🎯 Guia do Iniciante em IA</h3>
   <p>Um guia completo com os conceitos fundamentais que todo iniciante precisa saber.</p>
   <h3>📖 Artigos Recomendados</h3>
   <p>Uma seleção dos nossos melhores artigos para você começar:</p>
   <ul>
     <li>O que é Inteligência Artificial?</li>
     <li>Machine Learning vs Deep Learning</li>
     <li>IA no cotidiano: exemplos práticos</li>
   </ul>
   <p>Continue acompanhando - nos próximos dias você receberá mais conteúdos exclusivos!</p>
   <p>Abraços,<br>Equipe AIMindset</p>',
  24,
  true
),
(
  'Notificação de Novo Artigo',
  'Enviado quando um novo artigo é publicado no blog',
  'article_published',
  'Novo artigo publicado: {{article_title}} 📝',
  '<h1>Novo artigo publicado!</h1>
   <p>Olá {{name}},</p>
   <p>Temos uma novidade fresquinha para você! Acabamos de publicar um novo artigo:</p>
   <h2>{{article_title}}</h2>
   <p>{{article_excerpt}}</p>
   <p>Este artigo aborda temas importantes sobre {{article_category}} e traz insights valiosos para sua jornada na IA.</p>
   <p><a href="{{article_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ler Artigo Completo</a></p>
   <p>Não perca essa oportunidade de expandir seus conhecimentos!</p>
   <p>Abraços,<br>Equipe AIMindset</p>',
  1,
  false
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_email_automations_updated_at 
    BEFORE UPDATE ON email_automations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();