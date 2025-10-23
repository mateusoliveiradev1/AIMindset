const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Ler variáveis de ambiente do arquivo .env
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/"/g, '');
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function debugNewsletterRLS() {
  console.log('=== DEBUG NEWSLETTER RLS ===');
  console.log('URL:', envVars.VITE_SUPABASE_URL);
  console.log('Service Role Key:', envVars.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'NÃO CONFIGURADO');
  
  try {
    // Testar consulta básica de subscribers
    console.log('\n=== TESTANDO newsletter_subscribers ===');
    const { data: subscribers, error: subError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .limit(5);
    
    console.log('Subscribers encontrados:', subscribers?.length || 0);
    if (subError) {
      console.log('ERRO subscribers:', subError);
    } else {
      console.log('Primeiros subscribers:', subscribers);
    }
    
    // Testar consulta com filtro status
    console.log('\n=== TESTANDO newsletter_subscribers com status=active ===');
    const { data: activeSubscribers, error: activeError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('status', 'active')
      .limit(5);
    
    console.log('Subscribers ativos:', activeSubscribers?.length || 0);
    if (activeError) {
      console.log('ERRO subscribers ativos:', activeError);
    }
    
    // Testar consulta básica de campaigns
    console.log('\n=== TESTANDO newsletter_campaigns ===');
    const { data: campaigns, error: campError } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .limit(5);
    
    console.log('Campaigns encontradas:', campaigns?.length || 0);
    if (campError) {
      console.log('ERRO campaigns:', campError);
    } else {
      console.log('Primeiras campaigns:', campaigns);
    }
    
    // Testar consulta com filtro de data
    console.log('\n=== TESTANDO newsletter_campaigns com filtro de data ===');
    const { data: recentCampaigns, error: recentError } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .gte('created_at', '2025-10-01T00:00:00.000Z')
      .limit(5);
    
    console.log('Campaigns recentes:', recentCampaigns?.length || 0);
    if (recentError) {
      console.log('ERRO campaigns recentes:', recentError);
    }
    
  } catch (error) {
    console.error('ERRO GERAL:', error);
  }
}

debugNewsletterRLS();