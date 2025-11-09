#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas. Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function line(title = '') {
  const base = '='.repeat(70);
  return title ? `${base}\n${title}\n${base}` : base;
}

function fmtDate(d) {
  try {
    if (!d) return '—';
    const dt = typeof d === 'string' ? new Date(d) : d;
    return `${dt.toISOString()} (local: ${dt.toLocaleString()})`;
  } catch {
    return String(d);
  }
}

function nextUtcMinute(date = new Date()) {
  const ms = date.getTime();
  const next = new Date(Math.ceil((ms + 1000) / 60000) * 60000); // próximo minuto, segundos 00
  return next;
}

async function pickTemplateArticle() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, author_id, category_id, title')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

async function createTestArticle(template) {
  const now = new Date();
  const slugSuffix = `${now.getUTCFullYear()}${(now.getUTCMonth()+1).toString().padStart(2,'0')}${now.getUTCDate().toString().padStart(2,'0')}-${now.getUTCHours().toString().padStart(2,'0')}${now.getUTCMinutes().toString().padStart(2,'0')}${now.getUTCSeconds().toString().padStart(2,'0')}`;

  const content = 'Conteúdo de teste para validar cron de publicação automática. Este artigo foi criado automaticamente para verificar se o agendamento no minuto exato funciona e se o publish_due_articles() está ativo via pg_cron.';
  const excerpt = content.slice(0, 160);

  const insertPayload = {
    title: `Teste agendamento automático ${slugSuffix}`,
    content,
    excerpt,
    slug: `teste-agendamento-${slugSuffix}`,
    published: false,
    // Herdar para evitar violar constraints
    author_id: template?.author_id || null,
    category_id: template?.category_id || null
  };

  const { data, error } = await supabase
    .from('articles')
    .insert(insertPayload)
    .select('id, title, slug, author_id, category_id')
    .single();

  if (error) throw error;
  return data;
}

async function getAnyUserId() {
  // Buscar um usuário válido no schema auth para preencher scheduled_by
  try {
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);
    if (error) return null;
    return data?.[0]?.id || null;
  } catch {
    return null;
  }
}

async function scheduleArticleRPC(articleId, scheduledFor) {
  const { data, error } = await supabase.rpc('schedule_article', {
    article_id: articleId,
    scheduled_date: scheduledFor.toISOString(),
    reason: 'Teste de cron automático (RPC)',
    metadata: { source: 'script_test_schedule_and_publish' }
  });
  if (error) throw error;
  if (data?.success === false) {
    throw new Error(`schedule_article falhou: ${data?.error || 'motivo desconhecido'}`);
  }
}

async function scheduleArticleDirect(articleId, scheduledFor) {
  const userId = await getAnyUserId();
  const payload = {
    scheduled_for: scheduledFor.toISOString(),
    scheduling_status: 'scheduled',
    scheduling_reason: 'Teste de cron automático (direct)',
    scheduled_by: userId,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase
    .from('articles')
    .update(payload)
    .eq('id', articleId);
  if (error) throw error;
}

async function getArticle(articleId) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, published, scheduling_status, scheduled_for, updated_at, original_publish_date')
    .eq('id', articleId)
    .single();
  if (error) throw error;
  return data;
}

async function refreshPostgrestSchema() {
  try {
    const { data, error } = await supabase.rpc('refresh_postgrest_schema');
    if (error) {
      console.warn('⚠️ Falha ao atualizar schema do PostgREST:', error.message || error);
      return null;
    }
    console.log('🔄 Schema do PostgREST atualizado.');
    return data;
  } catch (e) {
    console.warn('⚠️ Exceção ao atualizar schema do PostgREST:', e.message || e);
    return null;
  }
}

async function maybePublishDueArticles() {
  try {
    const { data, error } = await supabase.rpc('publish_due_articles');
    if (error) {
      console.warn('⚠️ Erro ao chamar publish_due_articles:', error.message || error);
      return null;
    }
    console.log(`🔄 publish_due_articles() executado, publicados=${data}`);
    return data;
  } catch (e) {
    console.warn('⚠️ Exceção ao chamar publish_due_articles:', e.message || e);
    return null;
  }
}

async function monitorUntilPublished(articleId, timeoutMs = 3 * 60 * 1000, intervalMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const a = await getArticle(articleId);
    console.log(`• status=${a.status} | published=${a.published} | scheduling_status=${a.scheduling_status} | scheduled_for=${fmtDate(a.scheduled_for)} | updated_at=${fmtDate(a.updated_at)}`);
    if (a.published === true || a.scheduling_status === 'published') {
      return a;
    }
    // tenta disparar manualmente após passar do horário
    const now = new Date();
    if (a.scheduled_for && new Date(a.scheduled_for) <= now) {
      await maybePublishDueArticles();
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return await getArticle(articleId);
}

async function main() {
  console.log(line('🧪 TESTE DE AGENDAMENTO E PUBLICAÇÃO AUTOMÁTICA'));
  console.log(`SUPABASE_URL=${supabaseUrl}`);

  const template = await pickTemplateArticle();
  console.log(`Template de artigo usado: ${template ? template.title : 'Nenhum (inserção direta com mínimos campos)'}`);

  await refreshPostgrestSchema();
  const article = await createTestArticle(template);
  console.log(`✅ Artigo criado: ${article.id} | ${article.title}`);

  const scheduledFor = nextUtcMinute(new Date());
  console.log(`⏱️ Agendando para: ${fmtDate(scheduledFor)} (UTC minuto exato)`);
  try {
    await scheduleArticleRPC(article.id, scheduledFor);
  } catch (e) {
    console.warn(`⚠️ Falha na RPC schedule_article (${e.message || e}). Tentando via update direto com service role...`);
    await scheduleArticleDirect(article.id, scheduledFor);
  }
  console.log(line('👀 Monitorando publicação automática'));
  const final = await monitorUntilPublished(article.id);

  console.log(line('📌 Resultado'));
  console.log(`ID: ${final.id}`);
  console.log(`Title: ${final.title}`);
  console.log(`published: ${final.published}`);
  console.log(`scheduling_status: ${final.scheduling_status}`);
  console.log(`scheduled_for: ${fmtDate(final.scheduled_for)}`);
  console.log(`published_at: ${fmtDate(final.published_at)}`);
  console.log(`original_publish_date: ${fmtDate(final.original_publish_date)}`);

  if (final.published === true) {
    console.log('✅ Publicado automaticamente com sucesso. Hero deve atualizar em tempo real.');
  } else {
    console.log('❌ Ainda não publicado após janela de monitoramento. Verificar cron e função.');
  }
}

main().catch(err => {
  console.error('❌ Erro no teste de agendamento:', err);
  process.exit(1);
});