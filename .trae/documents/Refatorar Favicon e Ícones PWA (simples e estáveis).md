## Contexto e problemas identificados
- O ícone atual usa SVG com filtros, gradientes e animações, o que costuma falhar em ícones PWA e causar recortes estranhos/máscara no Android. Referências: `public/favicon.svg:1`, `public/apple-touch-icon.svg:1`.
- O `site.webmanifest` define `theme_color` diferente do `<meta name="theme-color">` no `index.html`, causando barras/cores inconsistentes ao instalar como PWA. Referências: `public/site.webmanifest:7-9` e `index.html:102-104`.
- O Service Worker faz cache agressivo dos favicons com estratégia cache-first, então mesmo após trocar os arquivos o app pode continuar exibindo ícones antigos até versão de cache mudar. Referência: `public/sw.js:14-26`, `public/sw.js:294-306`.

## Diretrizes de design (simples, sem letra)
- Manter paleta da marca: roxo `#6A0DAD`, azul `#3B82F6`, verde `#32CD32` e fundo escuro `#0D1B2A`.
- Ícone minimalista, sem filtros, sem animações, com boa legibilidade em 16–32 px:
  - Opção A: círculo sólido roxo com anel fino azul e um ponto verde central.
  - Opção B (padrão se não houver preferência): quadrado arredondado escuro com símbolo geométrico simples em roxo/azul (ex.: losango ou triângulo suavizado).
- Layout "maskable": conteúdo dentro de safe zone (~80%) com padding para evitar cortes em máscaras de Android.

## Assets a gerar
- `public/favicon.svg` simplificado seguindo a opção escolhida.
- PNGs rasterizados a partir do SVG via pipeline automatizado: `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/apple-touch-icon.png` (180×180, com padding), `public/android-chrome-192x192.png` e `public/android-chrome-512x512.png` (ambos com `purpose: any maskable`).
- `public/favicon.ico` gerado a partir de 16/32 px.

## Atualizações de configuração
- Manifesto PWA: atualizar `public/site.webmanifest` para incluir as entradas de 192×192 e 512×512 com `purpose: "any maskable"`, e alinhar `theme_color` com a cor usada no `<meta name="theme-color">` (recomendo usar `#0D1B2A` para barra escura consistente).
- HTML: manter links já presentes em `index.html:96-101` e adicionar/confirmar `<link rel="manifest" href="/site.webmanifest">` (já existe em `src/components/SEO/SEOManager.tsx:355`). Atualizar `<meta name="theme-color">` para casar com o manifest.
- Service Worker: incrementar os nomes de cache (ex.: `v2.1.0`) para forçar atualização e evitar servir ícones antigos (referências de versão em `public/sw.js:2-11`).

## Pipeline de build automatizado
- Criar script Node usando `sharp` (já no projeto) para rasterizar o SVG e gerar PNGs e ICO nas dimensões necessárias.
- Rodar o script no build ou on-demand para manter ícones sincronizados com o SVG fonte.

## Validação
- Testar em Android (Chrome) instalação PWA: verificar ícone arredondado sem cortes, sem distorção, e tema da barra consistente.
- Testar em iOS: conferir `apple-touch-icon` em tela inicial e lista de apps.
- Confirmar atualização de caches após bump de versão do SW (instalar/ativar e verificar logs do SW).

## Entregáveis
- Novo `favicon.svg` minimalista e todos os PNGs/ICO gerados.
- `site.webmanifest` atualizado e `index.html` alinhado em `theme_color`.
- Service Worker com versão de cache incrementada para refletir os novos ícones.

Confirma a opção de design? Sem preferência, aplico a Opção B e sigo com a implementação, geração dos arquivos e ajustes descritos.