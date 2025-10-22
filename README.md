<div align="center">

# 🧠 AIMindset

### *Plataforma de Artigos sobre Inteligência Artificial com Design Futurístico*

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3EAF7C?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)
[![Responsive](https://img.shields.io/badge/Responsive-100%25-green?style=for-the-badge)](https://github.com/mateusoliveiradev1/AIMindset)

---

*Uma experiência de leitura revolucionária com design futurístico, índice inteligente e navegação fluida*

</div>

## 🚀 Sobre o Projeto

**AIMindset** é uma plataforma moderna e inovadora dedicada a artigos sobre Inteligência Artificial, Machine Learning e tecnologias emergentes. Desenvolvida com foco na **experiência do usuário**, oferece uma interface futurística com funcionalidades avançadas de navegação e leitura.

### 🎯 **Missão**
Democratizar o conhecimento sobre IA através de uma plataforma acessível, responsiva e visualmente atrativa que torna a leitura técnica uma experiência prazerosa.

### ✨ **Diferenciais**
- 🎨 **Design Futurístico** com tema dark e elementos neon
- 📱 **100% Responsivo** - Otimizado para todos os dispositivos
- 🧭 **Índice Inteligente** - Navegação automática por seções
- ⚡ **Performance Otimizada** - Carregamento rápido e fluido
- 🔄 **Sistema de Fallback** - Funciona mesmo offline

---

## ✨ Funcionalidades Principais

### 📖 **Experiência de Leitura Avançada**

| Funcionalidade | Descrição | Status |
|---|---|---|
| 📋 **Índice Automático** | Sumário gerado automaticamente com navegação suave | ✅ |
| 📊 **Barra de Progresso** | Acompanhe o progresso de leitura em tempo real | ✅ |
| ⏱️ **Tempo de Leitura** | Estimativa dinâmica baseada no conteúdo | ✅ |
| 🔄 **Navegação Artigos** | Botões anterior/próximo entre artigos | ✅ |
| 📱 **Botão Flutuante** | Acesso rápido ao índice em dispositivos móveis | ✅ |

### 🎨 **Interface e Design**

- **🌙 Tema Dark Futurístico** - Interface moderna com elementos neon
- **🎭 Animações Fluidas** - Transições suaves e micro-interações
- **📐 Layout Responsivo** - Adaptação perfeita para qualquer tela
- **🎯 UX Otimizada** - Navegação intuitiva e acessível

### 📱 **Responsividade Perfeita**

#### 📱 **Mobile (< 768px)**
- Botão flutuante para índice
- Layout otimizado para touch
- Navegação por gestos

#### 📟 **Tablet (768px - 1024px)**
- Botão flutuante universal
- Modal centralizado
- Fechamento automático

#### 🖥️ **Desktop (≥ 1024px)**
- Sidebar fixa com índice
- Layout de duas colunas
- Navegação por scroll

---

## 🛠️ Tecnologias Utilizadas

### **Frontend Core**
```
React 18.3.1          - Biblioteca principal
TypeScript 5.6.3      - Tipagem estática
Vite 6.0.5            - Build tool moderna
```

### **Styling & UI**
```
Tailwind CSS 3.4.17   - Framework CSS utilitário
Lucide React 0.511.0  - Ícones modernos
Clsx 2.1.1            - Utilitário para classes CSS
```

### **Backend & Database**
```
Supabase 2.39.0       - Backend as a Service
PostgreSQL            - Banco de dados relacional
Row Level Security     - Segurança avançada
```

### **Roteamento & SEO**
```
React Router DOM 7.3.0    - Roteamento SPA
React Helmet Async 2.0.4  - Meta tags dinâmicas
```

### **Markdown & Content**
```
React Markdown 9.1.0  - Renderização de Markdown
Remark GFM 4.0.1      - GitHub Flavored Markdown
```

### **Utilitários**
```
Date-fns 4.1.0        - Manipulação de datas
Zustand 5.0.3         - Gerenciamento de estado
Sonner 1.4.3          - Notificações toast
```

---

## 🔄 Changelog

### 🎉 **v1.1.0** - *Índice Responsivo e Melhorias UX* (2024-12-22)

**✨ Novas Funcionalidades:**
- 📋 **Índice Responsivo Universal** - Botão flutuante para todos os dispositivos
- 🔄 **Fechamento Automático** - Modal fecha ao clicar em item do índice
- 📱 **Otimização Tablet** - Suporte perfeito para iPad Mini, iPad Air 4, iPad Pro 11 e Galaxy Tab S7
- 🎯 **Navegação Inteligente** - Sistema de navegação anterior/próximo entre artigos

**🐛 Correções:**
- ✅ **Bug React Hooks** - Corrigida violação das Rules of Hooks no TableOfContents
- 🔧 **Estado do Modal** - Resolvido problema de reabertura do índice (especialmente em 838x830)
- 📐 **Responsividade** - Ajustes finos para diferentes resoluções de tablet

**🚀 Melhorias:**
- ⚡ **Sistema de Fallback** - Dados mock quando Supabase não está disponível
- 🎨 **UX Consistente** - Design unificado entre mobile, tablet e desktop
- 📊 **Logs de Debug** - Sistema completo de monitoramento e debugging
- 🔄 **Reset Automático** - Estado limpo ao mudar tamanho de tela

**📈 Estatísticas do Commit:**
```
15 arquivos alterados
1013 inserções (+)
236 deleções (-)
7 novos componentes criados
```

### 🎯 **v1.0.0** - *Lançamento Inicial* (2024-12-21)

**🚀 Funcionalidades Base:**
- 📖 Plataforma de artigos sobre IA
- 🎨 Design futurístico com tema dark
- 📱 Layout responsivo básico
- 🔐 Sistema de autenticação
- 📊 Dashboard administrativo
- 🗃️ Integração com Supabase

---

## 🎯 Instalação e Uso

### **📋 Pré-requisitos**

```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
```

### **⚡ Instalação Rápida**

```bash
# 1. Clone o repositório
git clone https://github.com/mateusoliveiradev1/AIMindset.git

# 2. Entre no diretório
cd AIMindset

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env
```

### **🔧 Configuração do Ambiente**

Edite o arquivo `.env` com suas credenciais:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### **🚀 Executar o Projeto**

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

### **📱 Acessar a Aplicação**

```
🌐 Local:    http://localhost:5174
🔗 Network:  http://192.168.1.x:5174
```

---

## 📸 Screenshots

### 🖥️ **Desktop Experience**
```
┌─────────────────────────────────────────────────────────────┐
│  🧠 AIMindset                                    📋 Índice  │
│  ═══════════════════════════════════════════════════════════ │
│                                                             │
│  📖 Artigo Principal              │  📋 Sumário             │
│  ─────────────────────────────────  │  ─────────────────────  │
│  # Introdução à IA                │  • Introdução          │
│  Lorem ipsum dolor sit amet...    │  • Conceitos Básicos   │
│                                   │  • Aplicações          │
│  ## Conceitos Básicos             │  • Conclusão           │
│  Consectetur adipiscing elit...   │                        │
│                                   │  ⏱️ 8 min de leitura   │
│  ▓▓▓▓▓▓░░░░ 60%                   │                        │
└─────────────────────────────────────────────────────────────┘
```

### 📱 **Mobile Experience**
```
┌─────────────────────────┐
│  🧠 AIMindset          │
│  ═══════════════════════ │
│                         │
│  📖 Artigo Principal    │
│  ─────────────────────── │
│  # Introdução à IA      │
│  Lorem ipsum dolor...   │
│                         │
│  ## Conceitos Básicos   │
│  Consectetur elit...    │
│                         │
│  ▓▓▓▓▓▓░░░░ 60%         │
│                         │
│                    📋   │ ← Botão Flutuante
└─────────────────────────┘
```

---

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Siga estes passos:

### **🔄 Processo de Contribuição**

1. **Fork** o projeto
2. **Clone** seu fork
3. **Crie** uma branch para sua feature
4. **Commit** suas mudanças
5. **Push** para a branch
6. **Abra** um Pull Request

```bash
# Exemplo de workflow
git checkout -b feature/nova-funcionalidade
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
```

### **📝 Padrões de Commit**

```
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Documentação
style:    Formatação
refactor: Refatoração
test:     Testes
chore:    Manutenção
```

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Mateus Oliveira**
- 🌐 GitHub: [@mateusoliveiradev1](https://github.com/mateusoliveiradev1)
- 📧 Email: [contato@mateusoliveira.dev](mailto:contato@mateusoliveira.dev)
- 💼 LinkedIn: [Mateus Oliveira](https://linkedin.com/in/mateusoliveiradev)

---

<div align="center">

### 🌟 **Se este projeto te ajudou, deixe uma estrela!** ⭐

**Feito com ❤️ e muito ☕ por [Mateus Oliveira](https://github.com/mateusoliveiradev1)**

---

*AIMindset - Transformando a forma como consumimos conteúdo sobre IA* 🚀

</div>