import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 Verificando dados nas tabelas...\n');
  
  try {
    // Feedbacks
    const { data: feedbacks, error: feedbacksError } = await supabase.from('feedbacks').select('*');
    console.log('📝 Feedbacks:', feedbacks?.length || 0);
    if (feedbacksError) console.log('   Error:', feedbacksError.message);
    
    // Articles
    const { data: articles, error: articlesError } = await supabase.from('articles').select('*');
    console.log('📰 Articles:', articles?.length || 0);
    if (articlesError) console.log('   Error:', articlesError.message);
    
    // Comments
    const { data: comments, error: commentsError } = await supabase.from('comments').select('*');
    console.log('💬 Comments:', comments?.length || 0);
    if (commentsError) console.log('   Error:', commentsError.message);
    
    // User profiles
    const { data: users, error: usersError } = await supabase.from('user_profiles').select('*');
    console.log('👤 User Profiles:', users?.length || 0);
    if (usersError) console.log('   Error:', usersError.message);
    
    // App logs
    const { data: appLogs, error: appLogsError } = await supabase.from('app_logs').select('*');
    console.log('📊 App Logs:', appLogs?.length || 0);
    if (appLogsError) console.log('   Error:', appLogsError.message);
    
    // System logs
    const { data: systemLogs, error: systemLogsError } = await supabase.from('system_logs').select('*');
    console.log('🔧 System Logs:', systemLogs?.length || 0);
    if (systemLogsError) console.log('   Error:', systemLogsError.message);
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkTables();