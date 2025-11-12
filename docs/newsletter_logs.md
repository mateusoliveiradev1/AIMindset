Valores permitidos em newsletter_logs.status: success, error, pending, failed

newsletter_logs.status destina-se a logs de eventos. Use success para operações concluídas, error para falhas, pending para processos em andamento e failed para falhas definitivas.

newsletter_campaigns.status é um domínio diferente: draft, scheduled, sent. Não use estes valores em newsletter_logs.status.

Fluxo de inscrição: ao inserir um assinante ativo, o trigger send_welcome_email cria um log com event_type subscriber_added, status success e event_data contendo email e campanha.

Políticas RLS: a função do trigger é SECURITY DEFINER para garantir inserção mesmo com RLS habilitado.

