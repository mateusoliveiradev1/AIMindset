#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const useKey = serviceRoleKey || anonKey;

if (!supabaseUrl || !useKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas. Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_ANON_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, useKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ARTICLE_ID = process.env.ARTICLE_ID || null;
const RUN_MANUAL_PUBLISH = (process.env.RUN_MANUAL_PUBLISH || 'false').toLowerCase() === 'true';

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

function secondsComponent(d) {
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.getUTCSeconds();
  } catch {
    return null;
  }
}

async function checkCronJobs() {
  console.log(line('🔧 CRON JOBS'));
  const { data: jobs, error: jobsError } = await supabase.rpc('get_cron_jobs');
  if (jobsError) {
    console.error('❌ Erro ao buscar cron jobs:', jobsError.message || jobsError);
  } else {
    if (!jobs || jobs.length === 0) {
      console.log('⚠️ Nenhum job encontrado em cron.job');
    } else {
      jobs.forEach(j => {
        console.log(`• Job ${j.id} | active=${j.active} | schedule='${j.schedule}' | command='${j.command}'`);
      });
    }
  }

  console.log('\n🔎 Últimas execuções:');
  const { data: runs, error: runsError } = await supabase.rpc('get_cron_runs', { limit_count: 25 });
  if (runsError) {
    console.error('❌ Erro ao buscar cron runs:', runsError.message || runsError);
  } else {
    if (!runs || runs.length === 0) {
      console.log('⚠️ Nenhuma execução registrada em cron.job_run_details');
    } else {
      runs.slice(0, 10).forEach(r => {
        console.log(`• Job ${r.jobid} | status=${r.status} | started=${fmtDate(r.run_started)} | ended=${fmtDate(r.run_ended)} | return='${r.return_message}'`);
      });
    }
  }
}

async function checkScheduledArticles() {
  console.log('\n' + line('🗓️ ARTIGOS AGENDADOS'));
  const now = new Date();
  console.log(`Agora (UTC): ${new Date().toISOString()} | Local: ${now.toLocaleString()}`);

  // Buscar artigos com status 'scheduled'
  const query = supabase
    .from('articles')
    .select('id, title, published, scheduling_status, scheduled_for, original_publish_date, updated_at')
    .eq('scheduling_status', 'scheduled')
    .order('scheduled_for', { ascending: true });

  const { data: scheduled, error } = await query;
  if (error) {
    console.error('❌ Erro ao buscar artigos agendados:', error.message || error);
    return { scheduled: [], due: [], pastDue: [] };
  }

  if (!scheduled || scheduled.length === 0) {
    console.log('ℹ️ Nenhum artigo com status scheduled encontrado.');
    return { scheduled: [], due: [], pastDue: [] };
  }

  console.log(`📊 Total agendados: ${scheduled.length}`);

  const due = scheduled.filter(a => a.scheduled_for && new Date(a.scheduled_for) <= now && !a.published);
  const pastDue = scheduled.filter(a => a.scheduled_for && new Date(a.scheduled_for) < now && !a.published);

  scheduled.slice(0, 10).forEach(a => {
    const secs = secondsComponent(a.scheduled_for);
    console.log(`• ${a.title} (${a.id}) | scheduled_for=${fmtDate(a.scheduled_for)} | secs=${secs} | status=${a.scheduling_status} | published=${a.published}`);
  });

  console.log(`\n⏱️ Agendados vencidos e não publicados: ${pastDue.length}`);
  pastDue.slice(0, 10).forEach(a => console.log(`  - ${a.title} (${a.id})`));

  return { scheduled, due, pastDue };
}

async function checkArticleLogs(articleId) {
  console.log('\n' + line('🧾 LOGS DE AGENDAMENTO'));
  let q = supabase
    .from('article_scheduling_logs')
    .select('article_id, action, old_status, new_status, old_scheduled_for, new_scheduled_for, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  if (articleId) q = q.eq('article_id', articleId);

  const { data: logs, error } = await q;
  if (error) {
    console.error('❌ Erro ao buscar logs:', error.message || error);
    return [];
  }
  if (!logs || logs.length === 0) {
    console.log(articleId ? `ℹ️ Nenhum log para artigo ${articleId}` : 'ℹ️ Nenhum log recente.');
    return [];
  }
  logs.forEach(l => {
    const secs = secondsComponent(l.new_scheduled_for);
    console.log(`• ${l.action} | artigo=${l.article_id} | old_status=${l.old_status} -> new_status=${l.new_status} | new_scheduled_for=${fmtDate(l.new_scheduled_for)} | secs=${secs} | at=${fmtDate(l.created_at)} | reason='${l.reason || ''}'`);
  });
  return logs;
}

async function maybeRunManualPublish() {
  if (!RUN_MANUAL_PUBLISH) return null;
  console.log('\n' + line('🚀 EXECUÇÃO MANUAL publish_due_articles()'));
  try {
    const { data, error } = await supabase.rpc('publish_due_articles');
    if (error) {
      console.error('❌ Erro ao executar publish_due_articles:', error.message || error);
      return null;
    }
    console.log(`✅ publish_due_articles executado. Publicados: ${data}`);
    return data;
  } catch (e) {
    console.error('❌ Exceção ao executar publish_due_articles:', e.message || e);
    return null;
  }
}

async function main() {
  console.log(line('🔎 DIAGNÓSTICO: AGENDAMENTO E CRON'));
  console.log(`SUPABASE_URL=${supabaseUrl}`);
  console.log(`Chave usada: ${serviceRoleKey ? 'service_role' : 'anon'}`);

  await checkCronJobs();
  const { pastDue } = await checkScheduledArticles();
  await checkArticleLogs(ARTICLE_ID);
  await maybeRunManualPublish();

  console.log('\n' + line('📌 CONCLUSÃO'));
  if (pastDue && pastDue.length > 0) {
    console.log('❗ Existem artigos vencidos (scheduled_for <= agora) e não publicados. Possíveis causas:');
    console.log('  - Job do cron inativo ou não agendado corretamente.');
    console.log('  - publish_due_articles() com permissão incorreta (deve ter SECURITY DEFINER e GRANT para postgres/service_role).');
    console.log('  - Diferença de fuso horário: verifique se scheduled_for está arredondado ao minuto e em UTC.');
    console.log('  - RLS bloqueando updates (função deve atualizar independentemente de RLS).');
  } else {
    console.log('✅ Não há artigos vencidos e não publicados no momento, ou o cron está funcionando e publicando corretamente.');
  }

  console.log('\nFim.');
}

main().catch(err => {
  console.error('❌ Erro inesperado no diagnóstico:', err);
  process.exit(1);
});