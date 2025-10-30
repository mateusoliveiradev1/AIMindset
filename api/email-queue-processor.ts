// Processador de fila de emails - monitora logs pendentes e envia emails automaticamente
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

interface PendingEmailLog {
  id: number;
  recipients: any[];
  alert_data: any;
  queued_at: string;
}

class EmailQueueProcessor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Processador já está rodando');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Iniciando processador de fila de emails...');
    
    // Processar imediatamente
    await this.processQueue();
    
    // Processar a cada 5 segundos
    this.intervalId = setInterval(async () => {
      await this.processQueue();
    }, 5000);
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Processador de fila de emails parado');
  }

  private async processQueue() {
    try {
      // Buscar logs pendentes
      const { data: pendingLogs, error } = await supabase.rpc('get_pending_email_logs');
      
      if (error) {
        console.error('❌ Erro ao buscar logs pendentes:', error);
        return;
      }

      if (!pendingLogs || pendingLogs.length === 0) {
        // Não há logs pendentes - não fazer log para evitar spam
        return;
      }

      console.log(`📧 Processando ${pendingLogs.length} emails pendentes...`);

      for (const log of pendingLogs as PendingEmailLog[]) {
        await this.processEmailLog(log);
      }

    } catch (error) {
      console.error('❌ Erro no processamento da fila:', error);
    }
  }

  private async processEmailLog(log: PendingEmailLog) {
    try {
      console.log(`📤 Enviando email para log ID ${log.id}...`);

      // Fazer chamada para o servidor de email
      const response = await fetch('http://localhost:3001/api/send-alert-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: log.recipients,
          alertData: log.alert_data
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Email enviado com sucesso para log ID ${log.id}`);
        
        // Marcar como processado com sucesso
        await supabase.rpc('mark_email_log_processed', {
          log_id: log.id,
          success: true
        });

        // Registrar sucesso nos logs
        await supabase.from('system_logs').insert({
          type: 'email_success',
          message: 'Email enviado com sucesso via processador de fila',
          context: {
            log_id: log.id,
            recipients_count: log.recipients.length,
            method: 'queue_processor',
            processed_at: new Date().toISOString()
          }
        });

      } else {
        const errorText = await response.text();
        console.error(`❌ Erro HTTP ao enviar email para log ID ${log.id}:`, response.status, errorText);
        
        // Marcar como processado com erro
        await supabase.rpc('mark_email_log_processed', {
          log_id: log.id,
          success: false,
          error_message: `HTTP ${response.status}: ${errorText}`
        });
      }

    } catch (error) {
      console.error(`❌ Erro ao processar email para log ID ${log.id}:`, error);
      
      // Marcar como processado com erro
      await supabase.rpc('mark_email_log_processed', {
        log_id: log.id,
        success: false,
        error_message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}

// Inicializar processador
const processor = new EmailQueueProcessor();

// Capturar sinais de interrupção
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido SIGINT, parando processador...');
  await processor.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido SIGTERM, parando processador...');
  await processor.stop();
  process.exit(0);
});

// Iniciar processador
processor.start().catch(console.error);

console.log('📧 Processador de fila de emails iniciado. Pressione Ctrl+C para parar.');