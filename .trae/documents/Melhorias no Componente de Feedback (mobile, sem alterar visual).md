## Objetivos
- Aprimorar visual e micro‑interações do componente sem fugir da identidade (neon‑purple/lime‑green, blur, bordas).
- Evoluir UI/UX com estados e micro‑copy melhores para reduzir fricção e aumentar contribuições.
- Adicionar padrões de engajamento sutis (social proof, follow‑ups) sem alterar o fluxo de dados.

## Visual (coerente com o app)
1) Botões 👍/👎 — `src/components/Feedback/FeedbackButtons.tsx`
- Micro‑interações: `active:scale-95`, `ring-1`, `focus-visible:ring-2 ring-neon-purple/40`.
- Área de toque: ~44px altura (ajuste leve de `py`).
- Ícones e cores atuais mantidos.
2) Container — `src/components/Feedback/FeedbackSection.tsx:113`
- Transições específicas (`transition-colors shadow border`) e `will-change: opacity, box-shadow`.
- Glow de hover levemente intensificado (`hover:shadow-neon-purple/20`) mantendo blur e borda.
3) Estatísticas — `src/components/Feedback/FeedbackSection.tsx:67-109`
- Skeleton suave durante `statsLoading`.
- Barra linear fina de aprovação com gradiente `lime-green → neon-purple` sob os números.
4) Mensagem de agradecimento — `src/components/Feedback/FeedbackSection.tsx:135-141`
- Ícone pequeno (ex. `CheckCircle`) + `aria-live="polite"`.
- Evitar layout shift: container com altura estável ou animar só `opacity`.

## UI/UX
- Micro‑copy contextual: sob o título, reforçar propósito (“Seu toque ajuda outros leitores”) sem poluir.
- Estados claros: desabilitar botões após envio com feedback visual consistente (já existe, vamos refinar foco/hover/active).
- Ação pós‑negativo: exibir chips sutis com motivos comuns (“Desatualizado”, “Faltou exemplo”, “Muito avançado”) — apenas UI, envia evento quando clicado, sem alterar fluxo principal.
- Descoberta de conteúdo: após `👎`, link leve “Ver artigos relacionados” (coerente com marca); abre rota interna sem sair do artigo.

## Engajamento
- Social proof: destacar “X pessoas avaliaram” (já existe) com leve ênfase; manter paleta e tipografia.
- Badge discreto “Tempo Real” com pulso muito suave para comunicar dinamismo.
- Métrica agregada opcional: mostrar “Comentários ativos” já derivados por hooks, como texto pequeno ao lado das stats, sem gráficos.

## Acessibilidade
- `aria-live="polite"` na mensagem de sucesso.
- `aria-disabled` nos botões quando desativados.
- Contraste preservado; foco visível consistente.

## Performance/Estabilidade
- Anti‑flicker: `touchAction: 'manipulation'`, `WebkitTapHighlightColor: 'transparent'`, `will-change: transform, opacity` nos botões.
- Remover `transition-all`; manter transições de cor/sombra e borda.
- Sonner segue padrão para toasts; se `src/components/Toast.tsx` for usado em outro lugar, adicionar `will-change` nas transições.

## Telemetria/Métricas (leve)
- Em chips de motivos pós‑negativo, disparar um evento simples (ex.: `toast` ou console + futuro supabase) sem bloquear fluxo.
- Não altera schema; apenas prepara terreno para insights.

## Validação
- Testar desktop e mobile: toque rápido, ausência de flicker; foco/hover coerentes.
- Confirmar skeleton e barra de aprovação sutis.
- Verificar que follow‑ups pós‑negativo não desviam do conteúdo (UI discreta).

## Entregáveis
- Atualizações em `FeedbackButtons.tsx` e `FeedbackSection.tsx`; ajustes opcionais em `Toast.tsx` se necessário.
- Visual, UI/UX e engajamento aprimorados mantendo identidade e lógica atual.