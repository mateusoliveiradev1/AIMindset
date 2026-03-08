// scripts/database/migrate_pSEO.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback credentials
const EMERGENCY_SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabaseUrl = process.env.SUPABASE_URL || EMERGENCY_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('🚀 Iniciando migração pSEO...');

    try {
        const sqlPath = path.join(__dirname, 'create_programmatic_pages.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('1. Lendo SQL e dividindo em comandos...');
        const commands = sql
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0);

        console.log(`📊 Total de comandos para executar: ${commands.length}`);

        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];
            console.log(`Executing [${i + 1}/${commands.length}]...`);

            const { error } = await supabase.rpc('execute_sql', { sql_query: cmd });

            if (error) {
                // Ignorar erro se a tabela já existir em caso de re-execução
                if (error.message.includes('already exists')) {
                    console.warn(`⚠️ Aviso no comando ${i + 1}: ${error.message}`);
                } else {
                    console.error(`❌ Erro no comando ${i + 1}:`, error.message);
                    throw error;
                }
            } else {
                console.log(`✅ Comando ${i + 1} executado.`);
            }
        }

        console.log('🎉 Migração concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro inesperado:', error.message);
    }
}

migrate();
