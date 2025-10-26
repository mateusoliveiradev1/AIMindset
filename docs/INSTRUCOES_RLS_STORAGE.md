# 🚨 INSTRUÇÕES PARA CORRIGIR RLS POLICY NO SUPABASE STORAGE

## ❌ PROBLEMA IDENTIFICADO
O erro `relation "storage.policies" does not exist` indica que o SQL anterior não funcionou porque a tabela `storage.policies` não existe ou não é acessível diretamente.

## ✅ SOLUÇÃO CORRETA - VIA PAINEL WEB

### PASSO 1: Acessar o Painel do Supabase
1. Vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto **AIMindset**

### PASSO 2: Configurar Políticas de Storage
1. No menu lateral, clique em **"Storage"**
2. Clique em **"Policies"** (ou "Políticas")
3. Você verá a tabela `storage.objects`

### PASSO 3: Criar Política de UPLOAD (INSERT)
1. Clique em **"New Policy"** na seção `storage.objects`
2. Selecione **"For full customization"**
3. Preencha os campos:
   - **Policy Name**: `Allow authenticated users to upload to articles bucket`
   - **Allowed operation**: Selecione **INSERT**
   - **Target roles**: Selecione **authenticated**
   - **USING expression**: Deixe vazio
   - **WITH CHECK expression**: `bucket_id = 'articles'`
4. Clique em **"Save policy"**

### PASSO 4: Criar Política de LEITURA (SELECT)
1. Clique em **"New Policy"** novamente
2. Selecione **"For full customization"**
3. Preencha os campos:
   - **Policy Name**: `Allow public read access to articles bucket`
   - **Allowed operation**: Selecione **SELECT**
   - **Target roles**: Selecione **public**
   - **USING expression**: `bucket_id = 'articles'`
   - **WITH CHECK expression**: Deixe vazio
4. Clique em **"Save policy"**

### PASSO 5: Verificar Bucket Público
1. Vá para **Storage** > **Settings**
2. Encontre o bucket **"articles"**
3. Certifique-se de que está marcado como **"Public"**
4. Se não estiver, clique em **"Make public"**

## 🧪 TESTE
Após criar as políticas, teste o upload de imagem no seu aplicativo. O erro `StorageApiError: new row violates row-level security policy` deve desaparecer.

## 📞 ALTERNATIVA - VIA SQL EDITOR (SE NECESSÁRIO)
Se preferir usar SQL, vá para **SQL Editor** e execute:

```sql
-- Criar política de upload
CREATE POLICY "Allow authenticated users to upload to articles bucket" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'articles');

-- Criar política de leitura
CREATE POLICY "Allow public read access to articles bucket" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'articles');
```

## ✅ RESULTADO ESPERADO
- ✅ Upload de imagem funcionando
- ✅ Imagens visíveis publicamente
- ✅ Sem erros de RLS policy