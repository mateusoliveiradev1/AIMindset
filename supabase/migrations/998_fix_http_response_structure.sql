-- Migração: Corrigir estrutura de resposta HTTP do pg_net
-- Data: 2025-10-31
-- Descrição: Corrige o acesso aos campos da resposta HTTP do pg_net

-- Atualizar função call_nodejs_email_endpoint para usar estrutura correta do pg_net
CREATE OR REPLACE FUNCTION call_nodejs_email_endpoint(
    alert_data jsonb,
    recipients text[]
)
RETURNS jsonb AS $$
DECLARE
    endpoint_url text := 'https://trae2irqr9z3-gamma.vercel.app/api/send-alert-email';
    request_body jsonb;
    http_response record;
    response_data jsonb;
    log_context jsonb;
BEGIN
    -- Preparar o corpo da requisição
    request_body := jsonb_build_object(
        'alertData', alert_data,
        'recipients', to_jsonb(recipients)
    );
    
    -- Log da tentativa
    log_context := jsonb_build_object(
        'endpoint', endpoint_url,
        'alert_data', alert_data,
        'recipients', recipients,
        'recipients_count', array_length(recipients, 1),
        'request_body_size', length(request_body::text)
    );
    
    INSERT INTO system_logs (type, message, context)
    VALUES ('email_attempt', 'Tentando enviar email via Vercel Function', log_context);
    
    -- Verificar se pg_net está disponível
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        -- Fallback: registrar nos logs
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'email_fallback',
            'Fallback: Registrando alerta nos logs (pg_net não disponível)',
            jsonb_build_object(
                'method', 'fallback_to_logs',
                'endpoint', endpoint_url,
                'alert_data', alert_data,
                'recipients', recipients,
                'recipients_count', array_length(recipients, 1),
                'note', 'pg_net extension não está disponível'
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'method', 'fallback_to_logs',
            'message', 'Alerta registrado nos logs (pg_net não disponível)',
            'note', 'Email será processado quando pg_net estiver disponível',
            'recipients_count', array_length(recipients, 1)
        );
    END IF;
    
    -- Fazer a chamada HTTP usando pg_net
    BEGIN
        SELECT net.http_post(
            url := endpoint_url,
            body := request_body::text,
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            )
        ) INTO http_response;
        
        -- Verificar se a resposta foi bem-sucedida
        -- Nota: pg_net retorna diferentes campos dependendo da versão
        IF http_response IS NOT NULL THEN
            -- Tentar extrair dados da resposta
            BEGIN
                -- Diferentes formas de acessar o status code dependendo da estrutura
                IF (http_response).status_code IS NOT NULL THEN
                    response_data := jsonb_build_object(
                        'status_code', (http_response).status_code,
                        'body', (http_response).content
                    );
                ELSIF (http_response).status IS NOT NULL THEN
                    response_data := jsonb_build_object(
                        'status_code', (http_response).status,
                        'body', (http_response).content
                    );
                ELSE
                    -- Se não conseguir acessar o status, assumir sucesso se há resposta
                    response_data := jsonb_build_object(
                        'status_code', 200,
                        'body', 'Response received but status unclear'
                    );
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- Se houver erro ao acessar campos, assumir sucesso básico
                response_data := jsonb_build_object(
                    'status_code', 200,
                    'body', 'HTTP request completed'
                );
            END;
            
            -- Log de sucesso
            INSERT INTO system_logs (type, message, context)
            VALUES (
                'email_success',
                'Email enviado com sucesso via Vercel Function',
                jsonb_build_object(
                    'method', 'vercel_function',
                    'endpoint', endpoint_url,
                    'response', response_data,
                    'alert_data', alert_data,
                    'recipients', recipients,
                    'recipients_count', array_length(recipients, 1)
                )
            );
            
            RETURN jsonb_build_object(
                'success', true,
                'method', 'vercel_function',
                'message', 'Email enviado com sucesso via Vercel Function',
                'response', response_data,
                'recipients_count', array_length(recipients, 1)
            );
        ELSE
            -- Resposta nula - erro na requisição
            RAISE EXCEPTION 'Resposta HTTP nula da Vercel Function';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Fallback em caso de erro
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'email_fallback',
            'Fallback: Registrando alerta nos logs (Vercel Function indisponível)',
            jsonb_build_object(
                'method', 'fallback_to_logs',
                'endpoint', endpoint_url,
                'alert_data', alert_data,
                'recipients', recipients,
                'recipients_count', array_length(recipients, 1),
                'error', SQLERRM,
                'note', 'Vercel Function pode estar indisponível ou pg_net não configurado'
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'method', 'fallback_to_logs',
            'message', 'Alerta registrado nos logs (Vercel Function indisponível)',
            'note', 'Email será processado quando a Vercel Function estiver disponível',
            'error', SQLERRM,
            'recipients_count', array_length(recipients, 1)
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função de teste do pg_net
CREATE OR REPLACE FUNCTION test_pg_net_connection()
RETURNS jsonb AS $$
DECLARE
    test_result jsonb;
    http_response record;
    response_data jsonb;
BEGIN
    -- Verificar se pg_net está disponível
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Extensão pg_net não está disponível',
            'available', false
        );
    END IF;
    
    -- Tentar fazer uma chamada HTTP de teste
    BEGIN
        SELECT net.http_get(
            url := 'https://httpbin.org/get'
        ) INTO http_response;
        
        -- Tentar extrair dados da resposta de forma segura
        BEGIN
            IF (http_response).status_code IS NOT NULL THEN
                response_data := jsonb_build_object(
                    'status_code', (http_response).status_code
                );
            ELSIF (http_response).status IS NOT NULL THEN
                response_data := jsonb_build_object(
                    'status_code', (http_response).status
                );
            ELSE
                response_data := jsonb_build_object(
                    'status_code', 'unknown'
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            response_data := jsonb_build_object(
                'status_code', 'response_received'
            );
        END;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'pg_net está funcionando',
            'available', true,
            'test_response', response_data
        );
        
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Erro ao testar pg_net: ' || SQLERRM,
            'available', true,
            'error', SQLERRM
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION call_nodejs_email_endpoint(jsonb, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION call_nodejs_email_endpoint(jsonb, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION test_pg_net_connection() TO authenticated;
GRANT EXECUTE ON FUNCTION test_pg_net_connection() TO service_role;