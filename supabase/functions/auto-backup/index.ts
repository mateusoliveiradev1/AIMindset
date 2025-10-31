import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Iniciando backup automático diário...')

    // Log início do backup
    await supabase.from('system_logs').insert({
      type: 'auto_backup',
      message: 'Backup automático iniciado',
      context: {
        timestamp: new Date().toISOString(),
        triggered_by: 'cron_job'
      }
    })

    // Executar a função de backup
    const { data: backupResult, error: backupError } = await supabase
      .rpc('backup_all_data')

    if (backupError) {
      console.error('❌ Erro no backup:', backupError)
      
      // Log erro do backup
      await supabase.from('system_logs').insert({
        type: 'auto_backup_error',
        message: `Falha no backup automático: ${backupError.message}`,
        context: {
          error: backupError,
          timestamp: new Date().toISOString()
        }
      })

      // Enviar alerta de falha
      try {
        const { data: alertResult, error: alertError } = await supabase
          .rpc('test_alert_system', {
            alert_type: 'backup_failure',
            test_message: `Falha no backup automático: ${backupError.message}`
          })

        if (alertError) {
          console.error('❌ Erro ao enviar alerta:', alertError)
        } else {
          console.log('📧 Alerta de falha enviado com sucesso')
        }
      } catch (alertErr) {
        console.error('❌ Erro crítico ao enviar alerta:', alertErr)
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: backupError.message,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Backup concluído com sucesso:', backupResult)

    // Log sucesso do backup
    await supabase.from('system_logs').insert({
      type: 'auto_backup_success',
      message: 'Backup automático concluído com sucesso',
      context: {
        backup_id: backupResult?.backup_id,
        tables_backed_up: backupResult?.tables_count,
        timestamp: new Date().toISOString()
      }
    })

    // Verificar se há backups antigos para limpar (manter apenas os últimos 30 dias)
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { error: cleanupError } = await supabase
        .from('backup_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())

      if (cleanupError) {
        console.warn('⚠️ Aviso na limpeza de backups antigos:', cleanupError)
      } else {
        console.log('🧹 Limpeza de backups antigos concluída')
      }
    } catch (cleanupErr) {
      console.warn('⚠️ Erro na limpeza de backups antigos:', cleanupErr)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup automático executado com sucesso',
        backup_id: backupResult?.backup_id,
        tables_backed_up: backupResult?.tables_count,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Erro crítico no backup automático:', error)

    // Tentar registrar erro crítico
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      await supabase.from('system_logs').insert({
        type: 'auto_backup_critical_error',
        message: `Erro crítico no backup automático: ${error.message}`,
        context: {
          error: error.toString(),
          timestamp: new Date().toISOString()
        }
      })

      // Tentar enviar alerta crítico
      await supabase.rpc('test_alert_system', {
        alert_type: 'critical_backup_failure',
        test_message: `ERRO CRÍTICO no backup automático: ${error.message}`
      })
    } catch (logError) {
      console.error('❌ Falha ao registrar erro crítico:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})