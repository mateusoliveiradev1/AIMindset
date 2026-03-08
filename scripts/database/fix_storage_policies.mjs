// scripts/database/fix_storage_policies.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const EMERGENCY_SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabaseUrl = process.env.SUPABASE_URL || EMERGENCY_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStoragePolicies() {
    console.log('🚀 Iniciando correção de políticas de Storage...');

    const queries = [
        // 1. Garantir que o bucket exista e seja público
        `INSERT INTO storage.buckets (id, name, public) 
     VALUES ('articles', 'articles', true) 
     ON CONFLICT (id) DO UPDATE SET public = true;`,

        // 2. Remover políticas antigas para evitar conflitos
        `DROP POLICY IF EXISTS "Allow authenticated users to upload to articles bucket" ON storage.objects;`,
        `DROP POLICY IF EXISTS "Allow public read access to articles bucket" ON storage.objects;`,
        `DROP POLICY IF EXISTS "Allow authenticated users to update articles bucket" ON storage.objects;`,
        `DROP POLICY IF EXISTS "Allow authenticated users to delete from articles bucket" ON storage.objects;`,
        `DROP POLICY IF EXISTS "Public Access" ON storage.objects;`,

        // 3. Criar nova política de upload (Autenticado)
        `CREATE POLICY "Allow authenticated users to upload to articles bucket" 
     ON storage.objects FOR INSERT TO authenticated 
     WITH CHECK (bucket_id = 'articles');`,

        // 4. Criar nova política de leitura (Pública)
        `CREATE POLICY "Allow public read access to articles bucket" 
     ON storage.objects FOR SELECT TO public 
     USING (bucket_id = 'articles');`,

        // 5. Criar políticas de manutenção (Admin/Autenticado)
        `CREATE POLICY "Allow authenticated users to update articles bucket" 
     ON storage.objects FOR UPDATE TO authenticated 
     USING (bucket_id = 'articles') WITH CHECK (bucket_id = 'articles');`,

        `CREATE POLICY "Allow authenticated users to delete from articles bucket" 
     ON storage.objects FOR DELETE TO authenticated 
     USING (bucket_id = 'articles');`
    ];

    for (let i = 0; i < queries.length; i++) {
        console.log(`Executing query ${i + 1}/${queries.length}...`);
        const { error } = await supabase.rpc('execute_sql', { sql_query: queries[i] });

        if (error) {
            console.error(`❌ Erro na query ${i + 1}:`, error.message);
        } else {
            console.log(`✅ Query ${i + 1} executada com sucesso.`);
        }
    }

    console.log('🎉 Todas as políticas de Storage foram atualizadas!');
}

fixStoragePolicies();
