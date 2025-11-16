import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HelpCircle, Shield, Mail, Clock, Globe, BookOpen, UserCheck, Link as LinkIcon, Search as SearchIcon, Send, CheckCircle } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logEvent } from '../lib/logging';
import SEOManager from '../components/SEO/SEOManager';
import { useSEO } from '../hooks/useSEO';
import { useContacts } from '../hooks/useContacts';
import { sanitizeName, sanitizeEmail, sanitizeMessage, validators, RateLimiter } from '../utils/security';

const FAQ: React.FC = () => {
  const { getMetadata } = useSEO({
    pageType: 'faq',
    fallbackTitle: 'FAQ - Perguntas Frequentes e Ajuda | AIMindset',
    fallbackDescription: 'Dúvidas sobre conteúdo, newsletter, privacidade e comentários sem conta. Suporte e contato direto.',
    fallbackKeywords: ['faq', 'perguntas frequentes', 'suporte', 'contato', 'comentários sem conta', 'newsletter', 'privacidade', 'aimindset'],
    fallbackImage: 'https://aimindset.com.br/api/og?title=FAQ%20-%20AIMindset&type=faq',
    breadcrumbs: [
      { name: 'Home', url: 'https://aimindset.com.br', position: 1 },
      { name: 'FAQ', url: 'https://aimindset.com.br/faq', position: 2 }
    ]
  });

  const metadata = getMetadata();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const faqs = [
    {
      icon: BookOpen,
      question: 'O que é o AIMindset?',
      answer:
        'Somos um blog brasileiro focado em tornar a inteligência artificial acessível e prática, com artigos, guias e análises.',
      category: 'Conteúdo'
    },
    {
      icon: Globe,
      question: 'Com que frequência publicam novos conteúdos?',
      answer:
        'Publicamos regularmente. Você pode acompanhar tudo na página de artigos e assinar a newsletter para receber novidades.',
      category: 'Conteúdo'
    },
    {
      icon: Mail,
      question: 'Como funciona a newsletter?',
      answer:
        'Ao assinar, você recebe conteúdos selecionados diretamente no seu e-mail. É gratuita e você pode cancelar quando quiser.',
      category: 'Newsletter'
    },
    {
      icon: Shield,
      question: 'Meus dados estão seguros?',
      answer:
        'Tratamos privacidade com seriedade e seguimos boas práticas de segurança. Veja nossa política de privacidade para detalhes.',
      category: 'Privacidade'
    },
    {
      icon: UserCheck,
      question: 'Preciso de conta para ler os artigos?',
      answer:
        'Não. Os artigos são públicos. A conta é opcional e habilita recursos extras como histórico e perfil. Você pode comentar mesmo sem criar conta.',
      category: 'Conta'
    },
    {
      icon: Clock,
      question: 'Quanto tempo leva para ler um artigo?',
      answer:
        'Depende do conteúdo, mas indicamos tempo estimado de leitura nos artigos para ajudar no planejamento.',
      category: 'Conteúdo'
    }
  ];

  const moreFaqs = [
    {
      icon: UserCheck,
      question: 'Como faço para comentar nos artigos?',
      answer: 'Você pode comentar sem criar conta. A conta opcional oferece benefícios como histórico, avatar e notificações.',
      category: 'Conta'
    },
    {
      icon: Mail,
      question: 'Posso alterar minha inscrição na newsletter?',
      answer: 'Sim. Você pode cancelar ou alterar preferências a qualquer momento através do link no próprio email.',
      category: 'Newsletter'
    },
    {
      icon: Shield,
      question: 'Quais dados pessoais vocês coletam?',
      answer: 'Coletamos apenas o necessário (nome, email) para contato e comentários. Consulte a política de privacidade para detalhes.',
      category: 'Privacidade'
    },
    {
      icon: BookOpen,
      question: 'Como encontro artigos por tema?',
      answer: 'Use as categorias do menu ou a busca avançada para filtrar por assunto.',
      category: 'Conteúdo'
    },
    {
      icon: Globe,
      question: 'O conteúdo é gratuito?',
      answer: 'Sim, todo o conteúdo publicado é gratuito e aberto.',
      category: 'Conteúdo'
    }
  ];

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const items = useMemo(() =>
    [...faqs, ...moreFaqs].map((f) => ({ ...f, id: `faq-${slugify(f.question)}` })),
  [faqs]);

  const filtered = useMemo(() => {
    const byCategory = selectedCategory === 'Todos' ? items : items.filter(i => i.category === selectedCategory);
    if (!query) return byCategory;
    const q = query.toLowerCase();
    return byCategory.filter((i) =>
      i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q)
    );
  }, [items, query, selectedCategory]);

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.substring(1));
      if (target) {
        const details = target.closest('details');
        if (details) (details as HTMLDetailsElement).open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim()) {
        logEvent('info', 'FAQ', 'faq_search', { query });
      }
    }, 600);
    return () => clearTimeout(t);
  }, [query]);

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);
    return (
      <>
        {before}
        <mark className="bg-lime-green/20 text-lime-green rounded px-0.5">{match}</mark>
        {after}
      </>
    );
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}${location.pathname}#${id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    navigate(`#${id}`, { replace: true });
    logEvent('info', 'FAQ', 'copy_link', { id, url });
  };

  const faqSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: i.answer
      }
    }))
  }), [items]);

  const breadcrumbSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aimindset.com.br' },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://aimindset.com.br/faq' }
    ]
  }), []);

  // Inline Contact Form state & handlers
  const { submitContact, loading } = useContacts();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rateLimitError, setRateLimitError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!validators.required(formData.name)) newErrors.name = 'Nome é obrigatório';
    else if (!validators.name(formData.name)) newErrors.name = 'Nome inválido';
    if (!validators.required(formData.email)) newErrors.email = 'Email é obrigatório';
    else if (!validators.email(formData.email)) newErrors.email = 'Email inválido';
    if (!validators.required(formData.subject)) newErrors.subject = 'Assunto é obrigatório';
    if (!validators.required(formData.message)) newErrors.message = 'Mensagem é obrigatória';
    else if (!validators.message(formData.message)) newErrors.message = 'Mensagem deve ter entre 10 e 5000 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!RateLimiter.canPerformAction('faq_inline_form', 3, 300000)) {
      const remainingTime = Math.ceil(RateLimiter.getRemainingTime('faq_inline_form', 300000) / 1000 / 60);
      setRateLimitError(`Muitas tentativas. Tente novamente em ${remainingTime} minutos.`);
      return;
    }
    setRateLimitError('');
    if (!validateForm()) return;
    const sanitizedData = {
      name: sanitizeName(formData.name),
      email: sanitizeEmail(formData.email),
      subject: sanitizeName(formData.subject),
      message: sanitizeMessage(formData.message)
    };
    const success = await submitContact(sanitizedData);
    if (success) {
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
      setTimeout(() => setIsSubmitted(false), 5000);
    }
  };

  const handleInlineChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <SEOManager metadata={{ ...metadata, schemaData: [faqSchema, breadcrumbSchema], priority: 0.8, changeFreq: 'weekly', alternateLanguages: [
        { lang: 'en', url: 'https://aimindset.com.br/en/faq' },
        { lang: 'es', url: 'https://aimindset.com.br/es/faq' }
      ] }} />
      <div className="min-h-screen bg-primary-dark text-white">
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-lime-green/10" />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-neon-gradient rounded-full animate-pulse">
                <HelpCircle className="w-12 h-12 text-white" aria-label="Ícone de ajuda" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 gradient-text">FAQ</h1>
            <p className="text-xl md:text-2xl text-futuristic-gray font-roboto leading-relaxed">
              As respostas para as dúvidas mais comuns sobre o AIMindset
            </p>
            <div className="mt-8 max-w-xl mx-auto">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-futuristic-gray w-5 h-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar no FAQ (Ctrl/Cmd + K)"
                  aria-label="Buscar no FAQ"
                  className="w-full pl-10 pr-4 py-3 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green focus:ring-1 focus:ring-lime-green transition-colors"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-futuristic-gray">{filtered.length} resultado(s)</p>
                {(query || selectedCategory !== 'Todos') && (
                  <button
                    onClick={() => { setQuery(''); setSelectedCategory('Todos'); }}
                    className="text-xs text-futuristic-gray hover:text-lime-green underline"
                    aria-label="Limpar filtros"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['Todos','Conteúdo','Newsletter','Conta','Privacidade'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full border transition-colors text-sm ${selectedCategory === cat ? 'border-lime-green text-lime-green bg-lime-green/10' : 'border-neon-purple/30 text-futuristic-gray hover:text-lime-green hover:border-lime-green'}`}
                    aria-pressed={selectedCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="py-16 px-4 sm:px-6 lg:px-8" aria-labelledby="faq-heading">
          <div className="max-w-5xl mx-auto">
            <h2 id="faq-heading" className="sr-only">Perguntas frequentes</h2>
            <div className="space-y-4">
              {filtered.map((item) => (
                <details key={item.id} className="group" open={!!location.hash && location.hash.substring(1) === item.id}>
                  <summary className="cursor-pointer">
                    <Card className="p-6 glass-effect hover-lift">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-3 rounded-full bg-lime-green/15">
                          <item.icon className="w-6 h-6 text-lime-green" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h3 id={item.id} className="text-xl font-orbitron font-semibold mb-2">
                              {highlight(item.question, query)}
                            </h3>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); copyLink(item.id); }}
                              aria-label="Copiar link da pergunta"
                              className="ml-3 p-2 rounded hover:bg-lime-green/10 text-futuristic-gray hover:text-lime-green transition-colors"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-futuristic-gray font-roboto leading-relaxed">
                            {highlight(item.answer, query)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </summary>
                </details>
              ))}
              {filtered.length === 0 && (
                <Card className="p-6 text-center glass-effect">
                  <p className="text-futuristic-gray">Nenhuma pergunta encontrada para "{query}".</p>
                </Card>
              )}
            </div>
          </div>
        </section>
        <section className="py-16 px-4 sm:px-6 lg:px-8" aria-labelledby="faq-cta">
          <div className="max-w-3xl mx-auto">
            <Card className="p-8 md:p-12 glass-effect relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-green/5 to-neon-purple/5" />
              <div className="relative">
                <h2 id="faq-cta" className="text-2xl md:text-3xl font-orbitron font-bold mb-4">
                  Não encontrou sua resposta?
                </h2>
                <p className="text-futuristic-gray font-roboto mb-6">
                  Fale conosco e teremos prazer em ajudar.
                </p>
                <form onSubmit={handleInlineSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="faq-name" className="block text-sm text-futuristic-gray mb-1">Nome *</label>
                      <input id="faq-name" name="name" value={formData.name} onChange={handleInlineChange} className={`w-full px-3 py-2 bg-dark-surface/50 border rounded-lg text-white ${errors.name ? 'border-red-500' : 'border-neon-purple/30'}`} placeholder="Seu nome" required />
                      {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="faq-email" className="block text-sm text-futuristic-gray mb-1">Email *</label>
                      <input id="faq-email" type="email" name="email" value={formData.email} onChange={handleInlineChange} className={`w-full px-3 py-2 bg-dark-surface/50 border rounded-lg text-white ${errors.email ? 'border-red-500' : 'border-neon-purple/30'}`} placeholder="seu@email.com" required />
                      {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="faq-subject" className="block text-sm text-futuristic-gray mb-1">Assunto *</label>
                    <select id="faq-subject" name="subject" value={formData.subject} onChange={handleInlineChange} className={`w-full px-3 py-2 bg-dark-surface/50 border rounded-lg text-white ${errors.subject ? 'border-red-500' : 'border-neon-purple/30'}`} required>
                      <option value="">Selecione um assunto</option>
                      <option value="Parcerias & Colaborações">Parcerias & Colaborações</option>
                      <option value="Suporte Técnico">Suporte Técnico</option>
                      <option value="Feedback & Sugestões">Feedback & Sugestões</option>
                      <option value="Questões de Privacidade">Questões de Privacidade</option>
                      <option value="Outros">Outros</option>
                    </select>
                    {errors.subject && <p className="mt-1 text-sm text-red-400">{errors.subject}</p>}
                  </div>
                  <div>
                    <label htmlFor="faq-message" className="block text-sm text-futuristic-gray mb-1">Mensagem *</label>
                    <textarea id="faq-message" name="message" value={formData.message} onChange={handleInlineChange} rows={5} className={`w-full px-3 py-2 bg-dark-surface/50 border rounded-lg text-white resize-none ${errors.message ? 'border-red-500' : 'border-neon-purple/30'}`} placeholder="Descreva sua mensagem" required />
                    <div className="flex justify-between items-center mt-1">
                      {errors.message && <p className="text-sm text-red-400">{errors.message}</p>}
                      <p className="text-xs text-futuristic-gray ml-auto">{formData.message.length}/5000</p>
                    </div>
                  </div>
                  {rateLimitError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-red-500" />
                      <p className="text-red-500 text-sm">{rateLimitError}</p>
                    </div>
                  )}
                  {isSubmitted && (
                    <div className="p-3 bg-lime-green/20 border border-lime-green/30 rounded-lg flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-lime-green" />
                      <p className="text-lime-green text-sm">Mensagem enviada com sucesso! Retornaremos em até 24 horas.</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button type="submit" disabled={loading} className="bg-gradient-to-r from-lime-green to-electric-blue hover:from-lime-green/80 hover:to-electric-blue/80 text-dark-surface font-semibold px-6 py-3 rounded-lg transition-all hover-lift">
                      {loading ? (
                        <div className="flex items-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-dark-surface mr-2"></div>Enviando...</div>
                      ) : (
                        <div className="flex items-center"><Send className="mr-2 h-5 w-5" />Enviar Mensagem</div>
                      )}
                    </Button>
                    <Link to="/contato" className="inline-flex items-center">
                      <Button variant="outline" className="hover-lift" aria-label="Ir para contato">
                        <Mail className="mr-2 w-5 h-5" aria-hidden="true" />
                        Página de Contato
                      </Button>
                    </Link>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
};

export default FAQ;