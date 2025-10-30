import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testando se o erro "message" foi corrigido...\n');

// Simular a função logEvent
async function testLogEvent() {
    try {
        console.log('📝 Testando inserção de log de erro...');
        
        const { data, error } = await supabase.rpc('insert_app_log', {
            p_level: 'error',
            p_source: 'test_component',
            p_action: 'test_error_button',
            p_details: {
                message: 'Teste do botão de erro após correção',
                timestamp: new Date().toISOString(),
                test: true
            },
            p_user_id: null
        });

        if (error) {
            console.error('❌ ERRO AINDA PERSISTE:', error);
            return false;
        } else {
            console.log('✅ Log inserido com sucesso! ID:', data);
            return true;
        }
    } catch (err) {
        console.error('💥 Erro na função:', err.message);
        return false;
    }
}

// Executar teste
const success = await testLogEvent();

if (success) {
    console.log('\n🎉 SUCESSO! O erro "message" foi corrigido!');
    console.log('✅ A função logEvent agora funciona corretamente');
} else {
    console.log('\n❌ FALHA! O erro ainda persiste');
    console.log('🔧 Precisa de mais investigação');
}