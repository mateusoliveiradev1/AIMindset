## 1. Visão Geral do Produto

Card de destaque **mobile-first** para exibir o **próximo artigo agendado** na homepage. O componente é **inteligente: só aparece quando há artigo agendado**, garantindo interface limpa e performance otimizada.

**Objetivo:** Criar urgência e engajamento com design impactante, priorizando experiência mobile e performance em devices fracos.

## 2. Requisitos Funcionais - Inteligência & Mobile-First

### 2.1 📱 Condicional de Exibição Inteligente
- **SÓ EXIBE quando houver artigo agendado** - nada aparece quando vazio
- **Loading state mínimo** (< 200ms) antes de decidir exibir ou não
- **Fallback gracefully** - erros não quebram a homepage
- **Cache agressivo** para evitar consultas repetidas
- **Auto-hide** quando artigo for publicado automaticamente

### 2.2 ⏰ Contador Regressivo Mobile-Optimized
- **Atualização a cada segundo** com animação 60fps em devices fracos
- **Formato inteligente mobile:** 
  - "Em 2h 15m" para próximas 24h
  - "Amanhã às 14h" para +24h
  - "Faltam 30min" quando < 1h
- **Animação de pulso sutil** quando faltar < 1 hora (sem travar device)

### 2.3 🎯 Integração com Sistema Existente
- **Reutilizar função RPC `schedule_article`** já existente
- **Sincronização em tempo real** com publicação automática
- **Webhook para atualização instantânea** quando publicar
- **Manter consistência** com sistema de agendamento atual

## 3. Design System - Mobile-First

### 3.1 📱 Mobile-First Breakpoints
```
🎯 Base: 320px - 768px (Mobile) - Design principal
📟 Tablet: 768px - 1024px - Adaptação sutil  
💻 Desktop: 1024px+ - Expansão elegante
```

### 3.2 🎨 Especificações Mobile
- **Touch targets:** Mínimo 48px x 48px (WCAG 2.1)
- **Tipografia:** 16px base, 14px mínimo para mobile
- **Espaçamento:** 16px entre elementos principais
- **Imagem:** 16:9 aspect ratio, lazy loading imediato
- **Gradiente animado:** CSS puro, 60fps garantido

### 3.3 🌟 Elementos Visuais Mobile
```
📱 Card destacado com:
   - Gradient background animado (roxo → rosa → laranja)
   - Badge "EM BREVE" com pulso sutil (não travador)
   - Título do artigo (máx 2 linhas no mobile)
   - Contador regressivo com números grandes e legíveis
   - Imagem destacada com overlay gradiente
   - Botão "Ver Preview" (touch-friendly 48px)
```

### 3.4 🎬 Animações Mobile-Optimized
- **Entrada:** Fade in + slide up (300ms máx)
- **Contador:** Animação flip suave, 60fps em devices fracos
- **Saída:** Fade out quando publicado (200ms)
- **Reduce motion:** Modo alternativo sem animações

## 4. Performance - Mobile Priority

### 4.1 🚀 Otimizações Críticas Mobile
- **Componente assíncrono** com React.lazy() e Suspense
- **Bundle split** separado para este componente (< 15kb gzipped)
- **Consulta otimizada** ao banco (< 100ms na 3G lenta)
- **Cache IndexedDB** para dados do artigo (5min stale)
- **Imagem WebP** com fallback JPEG, lazy loading nativo

### 4.2 📊 Métricas de Performance Mobile
- **Tempo de carregamento:** < 500ms incluindo imagem (3G lenta)
- **Tempo de interação:** < 100ms após carregamento
- **Animações:** 60fps garantido em Android low-end
- **Bundle size:** < 15kb gzipped (componente completo)
- **Lighthouse score:** > 90 em mobile

## 5. Arquitetura Técnica

### 5.1 🏗️ Stack Mobile-First
```
Frontend: React 18 + TypeScript (strict mode)
Estilos: Tailwind CSS + CSS Modules (scoped)
Animações: Framer Motion (lightweight build)
Imagens: Native lazy loading + Intersection Observer
Cache: IndexedDB + React Query (stale-while-revalidate)
Performance: Web Workers para cálculos pesados
```

### 5.2 💾 Função Supabase Otimizada
```sql
CREATE OR REPLACE FUNCTION get_next_scheduled_article()
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  featured_image text,
  scheduled_for timestamp with time zone,
  category_name text,
  author_name text,
  reading_time integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.featured_image,
    a.scheduled_for,
    c.name as category_name,
    u.name as author_name,
    a.reading_time
  FROM articles a
  JOIN categories c ON a.category_id = c.id
  JOIN users u ON a.author_id = u.id
  WHERE a.status = 'scheduled'
    AND a.scheduled_for > NOW()
  ORDER BY a.scheduled_for ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_next_scheduled_article TO anon;
GRANT EXECUTE ON FUNCTION get_next_scheduled_article TO authenticated;
```

### 5.3 🪝 Hook React Mobile-Optimized
```typescript
export const useNextScheduledArticle = () => {
  return useQuery({
    queryKey: ['next-scheduled-article'],
    queryFn: fetchNextScheduledArticle,
    staleTime: 5 * 60 * 1000, // 5 min cache
    cacheTime: 10 * 60 * 1000, // 10 min memory
    refetchInterval: 30 * 1000, // 30s background refresh
    retry: 2, // Poucas tentativas para mobile
    enabled: true, // Sempre ativo, mas retorna null quando vazio
  });
};
```

## 6. Estados do Componente - Mobile-First

### 6.1 🔄 Estados de Exibição
1. **Sem consulta:** Nada renderizado (estado padrão)
2. **Loading:** Skeleton mínimo (só se houver chance de artigo)
3. **Com artigo:** Card completo com contador animado
4. **Sem artigo:** NADA renderizado (interface limpa)
5. **Erro:** Fallback silencioso, sem quebrar página

### 6.2 🎨 Estados Visuais Mobile
- **Touch feedback:** Immediate visual response (48px área)
- **Network slow:** Mostra conteúdo sem imagem primeiro
- **Battery save:** Desativa animações automaticamente
- **Offline:** Mostra último estado cacheado com indicador

## 7. Acessibilidade Mobile

### 7.1 ♿ WCAG 2.1 Mobile
- **Contraste:** 4.5:1 mínimo para texto em telas OLED
- **Touch:** 48px x 48px áreas mínimas (Apple/Google guidelines)
- **Screen reader:** Anúncio "Próximo artigo: [título] em [tempo]"
- **Font scaling:** Respeita configurações do sistema mobile

### 7.2 📱 Mobile Accessibility Features
- **VoiceOver/TalkBack:** Descrições concisas e claras
- **Reduce motion:** Modo alternativo sem animações
- **High contrast:** Detecta e ajusta cores automaticamente
- **One-hand usage:** Botões posicionados para alcance fácil

## 8. Testes & Qualidade Mobile

### 8.1 📱 Testes Mobile Reais
- **Devices fracos:** Android 8+ com 2GB RAM máximo
- **Network 3G lenta:** Simulação throttling real
- **Battery impact:** Monitoramento de consumo
- **Touch responsiveness:** < 100ms feedback visual

### 8.2 🎯 Métricas de Sucesso Mobile
- **CTR no card:** > 20% dos visitantes mobile
- **Bounce rate:** Mantém ou reduz baseline
- **Core Web Vitals:** LCP < 2.5s, CLS < 0.1, FID < 100ms
- **User engagement:** +15% tempo na homepage

## 9. Entregáveis - Mobile-First

### 9.1 📁 Arquivos a Criar
```
src/
├── hooks/
│   └── useNextScheduledArticle.ts    // Hook otimizado mobile
├── components/
│   └── Home/
│       └── ScheduledArticleCard.tsx  // Componente mobile-first
│       └── CountdownTimer.tsx        // Timer otimizado
├── styles/
│   └── scheduledCard.module.css      // Mobile-first styles
└── utils/
    └── mobileDetect.ts               // Detecção de capabilities

supabase/
└── migrations/
    └── 20240115_get_next_scheduled_article.sql
```

### 9.2 🔄 Integrações
- **Update Home.tsx:** Integração limpa e condicional
- **Update tailwind.config:** Animações mobile-optimized
- **Add mobile tests:** Testes em devices reais
- **Performance monitoring:** Web Vitals tracking

## 10. Notas Críticas Mobile-First ⚡

🚨 **Importante:** O card **NUNCA** deve quebrar a homepage mobile, mesmo em 3G lento!
📱 **Mobile-first:** Testar primeiro em Android low-end real, depois escalar
⚡ **Performance:** Monitorar impacto real com Web Vitals em produção
🔒 **Segurança:** Sanitizar dados mas manter performance mobile
♿ **Acessibilidade:** Testar com VoiceOver/TalkBack em devices reais

## 11. Critérios de Aceitação ✅

- [ ] Card **só aparece quando há artigo agendado** (nunca vazio)
- [ ] **Loading < 200ms** antes de decidir exibir
- [ ] **Mobile-first design** testado em device real fraco
- [ ] **Contador regressivo** funciona em 60fps em Android low-end
- [ ] **Touch targets** mínimos 48px x 48px
- [ ] **Auto-hide** quando artigo for publicado
- [ ] **Fallback gracefully** - erros não quebram nada
- [ ] **Lighthouse mobile score** > 90 com card ativo