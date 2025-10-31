import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testContactsSystem() {
  console.log('\n🔍 Testando Sistema de Contatos...');
  let successCount = 0;
  let totalTests = 0;

  // Teste 1: Criar contato
  totalTests++;
  try {
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        name: 'João Silva',
        email: 'joao@teste.com',
        subject: 'Teste de Contato',
        message: 'Esta é uma mensagem de teste'
      })
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Criar contato: OK');
    successCount++;
    
    // Teste 2: Ler contato
    totalTests++;
    const { data: readContact, error: readError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contact.id)
      .single();

    if (readError) throw readError;
    console.log('✅ Ler contato: OK');
    successCount++;

    // Teste 3: Atualizar status do contato
    totalTests++;
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ status: 'read' })
      .eq('id', contact.id);

    if (updateError) throw updateError;
    console.log('✅ Atualizar status do contato: OK');
    successCount++;

    // Teste 4: Listar contatos
    totalTests++;
    const { data: contacts, error: listError } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (listError) throw listError;
    console.log('✅ Listar contatos: OK');
    successCount++;

    // Teste 5: Deletar contato
    totalTests++;
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contact.id);

    if (deleteError) throw deleteError;
    console.log('✅ Deletar contato: OK');
    successCount++;

  } catch (error) {
    console.log(`❌ Erro no sistema de contatos: ${error.message}`);
  }

  return { successCount, totalTests };
}

async function testNewsletterSystem() {
  console.log('\n🔍 Testando Sistema de Newsletter...');
  let successCount = 0;
  let totalTests = 0;

  // Teste 1: Criar subscriber
  totalTests++;
  try {
    const { data: subscriber, error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: 'newsletter@teste.com',
        name: 'Teste Newsletter',
        source: 'website'
      })
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Criar subscriber: OK');
    successCount++;

    // Teste 2: Ler subscriber
    totalTests++;
    const { data: readSubscriber, error: readError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('id', subscriber.id)
      .single();

    if (readError) throw readError;
    console.log('✅ Ler subscriber: OK');
    successCount++;

    // Teste 3: Atualizar subscriber
    totalTests++;
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({ 
        status: 'active',
        tags: ['teste', 'newsletter']
      })
      .eq('id', subscriber.id);

    if (updateError) throw updateError;
    console.log('✅ Atualizar subscriber: OK');
    successCount++;

    // Teste 4: Listar subscribers
    totalTests++;
    const { data: subscribers, error: listError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (listError) throw listError;
    console.log('✅ Listar subscribers: OK');
    successCount++;

    // Teste 5: Criar template de newsletter
    totalTests++;
    const { data: template, error: templateError } = await supabase
      .from('newsletter_templates')
      .insert({
        name: 'Template Teste',
        subject: 'Newsletter de Teste',
        content: '<h1>Olá!</h1><p>Esta é uma newsletter de teste.</p>',
        preview_text: 'Newsletter de teste'
      })
      .select()
      .single();

    if (templateError) throw templateError;
    console.log('✅ Criar template de newsletter: OK');
    successCount++;

    // Teste 6: Criar campanha de newsletter
    totalTests++;
    const { data: campaign, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .insert({
        name: 'Campanha Teste',
        subject: 'Campanha de Teste',
        content: '<h1>Campanha de Teste</h1>',
        status: 'draft',
        template_id: template.id
      })
      .select()
      .single();

    if (campaignError) throw campaignError;
    console.log('✅ Criar campanha de newsletter: OK');
    successCount++;

    // Teste 7: Criar template de email
    totalTests++;
    const { data: emailTemplate, error: emailTemplateError } = await supabase
      .from('email_templates')
      .insert({
        name: 'Template Email Teste',
        subject: 'Email de Teste',
        content: '<h1>Email de Teste</h1>',
        template_type: 'custom'
      })
      .select()
      .single();

    if (emailTemplateError) throw emailTemplateError;
    console.log('✅ Criar template de email: OK');
    successCount++;

    // Limpeza
    await supabase.from('newsletter_campaigns').delete().eq('id', campaign.id);
    await supabase.from('newsletter_templates').delete().eq('id', template.id);
    await supabase.from('email_templates').delete().eq('id', emailTemplate.id);
    await supabase.from('newsletter_subscribers').delete().eq('id', subscriber.id);

  } catch (error) {
    console.log(`❌ Erro no sistema de newsletter: ${error.message}`);
  }

  return { successCount, totalTests };
}

async function testNewsletterStats() {
  console.log('\n🔍 Testando Estatísticas de Newsletter...');
  let successCount = 0;
  let totalTests = 0;

  // Teste 1: Contar subscribers ativos
  totalTests++;
  try {
    const { count, error } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) throw error;
    console.log('✅ Contar subscribers ativos: OK');
    successCount++;
  } catch (error) {
    console.log(`❌ Erro ao contar subscribers: ${error.message}`);
  }

  // Teste 2: Contar campanhas por status
  totalTests++;
  try {
    const { count, error } = await supabase
      .from('newsletter_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent');

    if (error) throw error;
    console.log('✅ Contar campanhas enviadas: OK');
    successCount++;
  } catch (error) {
    console.log(`❌ Erro ao contar campanhas: ${error.message}`);
  }

  // Teste 3: Listar templates ativos
  totalTests++;
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    console.log('✅ Listar templates ativos: OK');
    successCount++;
  } catch (error) {
    console.log(`❌ Erro ao listar templates: ${error.message}`);
  }

  return { successCount, totalTests };
}

async function main() {
  console.log('🚀 Iniciando testes do Sistema de Contatos e Newsletter...\n');

  const contactsResult = await testContactsSystem();
  const newsletterResult = await testNewsletterSystem();
  const statsResult = await testNewsletterStats();

  const totalSuccess = contactsResult.successCount + newsletterResult.successCount + statsResult.successCount;
  const totalTests = contactsResult.totalTests + newsletterResult.totalTests + statsResult.totalTests;
  const successRate = ((totalSuccess / totalTests) * 100).toFixed(1);

  console.log('\n📊 RESUMO DOS TESTES:');
  console.log(`Sistema de Contatos: ${contactsResult.successCount}/${contactsResult.totalTests} (${((contactsResult.successCount / contactsResult.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Sistema de Newsletter: ${newsletterResult.successCount}/${newsletterResult.totalTests} (${((newsletterResult.successCount / newsletterResult.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Estatísticas: ${statsResult.successCount}/${statsResult.totalTests} (${((statsResult.successCount / statsResult.totalTests) * 100).toFixed(1)}%)`);
  console.log(`\n🎯 TOTAL: ${totalSuccess}/${totalTests} testes passaram (${successRate}%)`);

  if (successRate === '100.0') {
    console.log('✅ Todos os sistemas estão funcionando perfeitamente!');
  } else {
    console.log('⚠️  Alguns sistemas precisam de atenção.');
  }
}

main().catch(console.error);