#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Preferir service role para evitar bloqueios de RLS ao monitorar estados e RPCs
const useKey = serviceRoleKey || anonKey;

if (!supabaseUrl || !useKey) {
  console.error('❌ Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, useKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ARTICLE_ID = process.env.ARTICLE_ID; // obrigatório
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '240000', 10); // 4 minutos
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '10000', 10); // 10s

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

async function getArticle(articleId) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, published, scheduling_status, scheduled_for, published_at, updated_at, original_publish_date')
    .eq('id', articleId)
    .single();
  if (error) throw error;
  return data;
}

async function checkCronRuns(limit = 5) {
  try {
    const { data, error } = await supabase.rpc('get_cron_runs', { limit_count: limit });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

async function main() {
  console.log(line('🔎 MONITOR DE ARTIGO AGENDADO'));
  if (!ARTICLE_ID) {
    console.error('❌ ARTICLE_ID não informado. Use: ARTICLE_ID=<uuid> node scripts/debug/monitor_scheduled_article.mjs');
    process.exit(1);
  }
  console.log(`ARTICLE_ID=${ARTICLE_ID}`);

  const start = Date.now();
  let lastStatus = '';

  while (Date.now() - start < TIMEOUT_MS) {
    const a = await getArticle(ARTICLE_ID);
    const statusStr = `status=${a.scheduling_status} | published=${a.published} | scheduled_for=${fmtDate(a.scheduled_for)} | updated_at=${fmtDate(a.updated_at)}`;
    if (statusStr !== lastStatus) {
      console.log('• ' + statusStr);
      lastStatus = statusStr;
    }

    if (a.published === true || a.scheduling_status === 'published') {
      console.log('\n' + line('✅ PUBLICADO AUTOMATICAMENTE'));
      console.log(`published_at: ${fmtDate(a.published_at)}`);
      console.log(`original_publish_date: ${fmtDate(a.original_publish_date)}`);
      const runs = await checkCronRuns(3);
      if (runs.length > 0) {
        const latest = runs[0];
        console.log(`Última execução cron: status=${latest.status} started=${fmtDate(latest.run_started)} return='${latest.return_message}'`);
      }
      console.log('Hero deve refletir +1 artigo publicado e destaque em tempo real.');
      process.exit(0);
    }

    await new Promise(r => setTimeout(r, INTERVAL_MS));
  }

  console.log('\n' + line('❌ NÃO PUBLICOU NO PRAZO'));
  const runs = await checkCronRuns(5);
  runs.forEach(r => console.log(`cron run: status=${r.status} started=${fmtDate(r.run_started)} return='${r.return_message}'`));
  process.exit(1);
}

main().catch(err => {
  console.error('❌ Erro no monitor:', err);
  process.exit(1);
});