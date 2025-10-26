import React, { useState, useEffect } from 'react';
import { Mail, Users, TrendingUp, Calendar, Award, BookOpen, Zap, CheckCircle, Sparkles } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { toast } from 'sonner';
import { sanitizeName, sanitizeEmail, validators, RateLimiter } from '../utils/security';
import { useNewsletter } from '../hooks/useNewsletter';
import { useSEO } from '../hooks/useSEO';
import SEOManager from '../components/SEO/SEOManager';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [rateLimitError, setRateLimitError] = useState<string>('');
  const [focusedField, setFocusedField] = useState<string>('');

  // Hook para dados reais da newsletter
  const { stats, loading: statsLoading, error: statsError, subscribe } = useNewsletter();

  // Hook para SEO
  const { getMetadata } = useSEO({
    pageType: 'newsletter',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Newsletter', url: '/newsletter' }
    ]
  });

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (!validators.name(name)) {
      errors.name = 'Nome deve conter apenas letras e espaços';
    }
    
    if (!email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!validators.email(email)) {
      errors.email = 'Email inválido';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Rate limiting
    if (!RateLimiter.canPerformAction('newsletter_signup', 3, 300000)) { // 3 tentativas por 5 minutos
      const remainingTime = Math.ceil(RateLimiter.getRemainingTime('newsletter_signup', 300000) / 1000 / 60);
      setRateLimitError(`Muitas tentativas. Tente novamente em ${remainingTime} minutos.`);
      return;
    }

    setIsLoading(true);
    setRateLimitError('');

    try {
      // Sanitizar dados
      const sanitizedName = sanitizeName(name);
      const sanitizedEmail = sanitizeEmail(email);

      // Usar o hook para inscrever
      const success = await subscribe(sanitizedEmail, sanitizedName);

      if (success) {
        setIsSubscribed(true);
        toast.success('Inscrição realizada com sucesso! 🎉');
        
        // Limpar formulário
        setEmail('');
        setName('');
        setValidationErrors({});
      } else {
        toast.error('Erro ao realizar inscrição. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro na inscrição:', error);
      toast.error('Erro interno. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Benefícios da newsletter com melhor visual
  const benefits = [
    {
      icon: BookOpen,
      title: 'Conteúdo Exclusivo',
      description: 'Artigos aprofundados sobre IA, tendências e análises que você não encontra em lugar nenhum.',
      gradient: 'from-lime-green to-green-400'
    },
    {
      icon: Zap,
      title: 'Primeiras Notícias',
      description: 'Seja o primeiro a saber sobre lançamentos, atualizações e novidades do mundo da tecnologia.',
      gradient: 'from-neon-purple to-purple-400'
    },
    {
      icon: Award,
      title: 'Curadoria Especializada',
      description: 'Conteúdo selecionado por especialistas em IA, garantindo qualidade e relevância em cada edição.',
      gradient: 'from-blue-500 to-cyan-400'
    }
  ];

  return (
    <>
      <SEOManager metadata={getMetadata()} />
      <div className="min-h-screen bg-gradient-to-br from-primary-dark via-dark-surface to-darker-surface">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-lime-green/5 to-neon-purple/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-purple/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-lime-green/10 rounded-full blur-3xl animate-pulse-slow"></div>

        <div className="relative max-w-6xl mx-auto text-center">
          {/* Enhanced Header */}
          <div className="mb-12 animate-fade-in-up">
            <div className="inline-flex items-center justify-center p-4 bg-neon-gradient rounded-full mb-8 animate-float">
              <Mail className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="font-orbitron font-bold text-5xl lg:text-7xl mb-6">
              <span className="bg-gradient-to-r from-lime-green via-green-400 to-emerald-500 bg-clip-text text-transparent">
                Newsletter
              </span>
              <br />
              <span className="text-white">AIMindset</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-futuristic-gray font-roboto max-w-3xl mx-auto leading-relaxed">
              Receba conteúdo exclusivo sobre <span className="text-lime-green font-semibold">Inteligência Artificial</span>, 
              tendências tecnológicas e insights que vão transformar seu conhecimento.
            </p>
          </div>

          {/* Dynamic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate-slide-up-delay-1">
            {[
              { 
                icon: Users, 
                value: statsLoading ? '...' : `${stats?.activeSubscribers || 0}`, 
                label: 'Inscritos Ativos',
                gradient: 'from-lime-green to-green-400'
              },
              { 
                icon: TrendingUp, 
                value: statsLoading ? '...' : `${stats?.growthRate || 0}%`, 
                label: 'Crescimento Mensal',
                gradient: 'from-neon-purple to-purple-400'
              },
              { 
                icon: Calendar, 
                value: statsLoading ? '...' : 'Semanal', 
                label: 'Frequência',
                gradient: 'from-blue-500 to-cyan-400'
              }
            ].map((stat, index) => (
              <Card key={index} className="p-8 glass-effect hover-lift group">
                <div className="flex flex-col items-center">
                  <div className={`p-4 bg-gradient-to-r ${stat.gradient} rounded-full mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className={`text-3xl font-orbitron font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-futuristic-gray font-roboto text-sm text-center">
                    {stat.label}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {!isSubscribed ? (
            /* Subscription Form */
            <Card className="p-8 lg:p-12 glass-effect animate-slide-up-delay-2">
              <div className="text-center mb-8">
                <h2 className="font-orbitron font-bold text-3xl lg:text-4xl text-white mb-4">
                  Junte-se à Nossa <span className="gradient-text">Comunidade</span>
                </h2>
                <p className="text-futuristic-gray font-roboto text-lg">
                  Inscreva-se gratuitamente e receba conteúdo exclusivo toda semana
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {rateLimitError && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg animate-shake">
                    <p className="text-red-400 text-sm font-medium text-center">
                      {rateLimitError}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-futuristic-gray">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField('')}
                        className={`w-full px-4 py-4 bg-darker-surface border rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.name 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : focusedField === 'name'
                            ? 'border-lime-green focus:border-lime-green focus:ring-lime-green/20'
                            : 'border-neon-purple/30 focus:border-lime-green focus:ring-lime-green/20'
                        }`}
                        placeholder="Seu nome completo"
                        disabled={isLoading}
                      />
                      {focusedField === 'name' && (
                        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-lime-green to-green-400 animate-expand-width"></div>
                      )}
                    </div>
                    {validationErrors.name && (
                      <p className="text-red-400 text-sm animate-fade-in">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-futuristic-gray">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField('')}
                        className={`w-full px-4 py-4 bg-darker-surface border rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 transition-all ${
                          validationErrors.email 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : focusedField === 'email'
                            ? 'border-lime-green focus:border-lime-green focus:ring-lime-green/20'
                            : 'border-neon-purple/30 focus:border-lime-green focus:ring-lime-green/20'
                        }`}
                        placeholder="seu@email.com"
                        disabled={isLoading}
                      />
                      {focusedField === 'email' && (
                        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-lime-green to-green-400 animate-expand-width"></div>
                      )}
                    </div>
                    {validationErrors.email && (
                      <p className="text-red-400 text-sm animate-fade-in">{validationErrors.email}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 text-lg font-semibold bg-neon-gradient hover:bg-neon-gradient/80 transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Inscrevendo...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Mail className="w-5 h-5" />
                      <span>Inscrever-se Gratuitamente</span>
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Button>

                <p className="text-xs text-futuristic-gray text-center">
                  Ao se inscrever, você concorda com nossa política de privacidade. 
                  Você pode cancelar a inscrição a qualquer momento.
                </p>
              </form>
            </Card>
          ) : (
            /* Success State */
            <Card className="p-8 lg:p-12 text-center glass-effect animate-fade-in-scale">
              <div className="mb-6">
                <div className="w-20 h-20 bg-neon-gradient rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-orbitron font-bold text-3xl text-white mb-4">
                  Bem-vindo à Comunidade!
                </h2>
                <p className="text-futuristic-gray font-roboto text-lg">
                  Sua inscrição foi confirmada. Em breve você receberá nosso primeiro conteúdo exclusivo!
                </p>
              </div>
            </Card>
          )}

          {/* Benefits Section */}
          <div className="mt-16 animate-slide-up-delay-3">
            <h3 className="font-orbitron font-bold text-3xl lg:text-4xl text-center mb-12">
              Por que se <span className="gradient-text">Inscrever</span>?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="p-6 glass-effect hover-lift group">
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-4 bg-gradient-to-r ${benefit.gradient} rounded-full mb-4 group-hover:scale-110 transition-transform`}>
                      <benefit.icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-orbitron font-semibold text-xl text-white mb-3">
                      {benefit.title}
                    </h4>
                    <p className="text-futuristic-gray font-roboto leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Dynamic Stats Section */}
          <div className="mt-24 animate-slide-up-delay-4">
            <Card className="p-8 lg:p-12 glass-effect">
              <h3 className="font-orbitron font-bold text-3xl lg:text-4xl text-center mb-12">
                Nossa <span className="gradient-text">Comunidade</span>
              </h3>

              {statsLoading ? (
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-2 border-lime-green/30 border-t-lime-green rounded-full animate-spin"></div>
                </div>
              ) : statsError ? (
                <div className="text-center text-red-400">
                  Erro ao carregar estatísticas
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { label: 'Inscritos', value: `${stats?.activeSubscribers || 0}`, icon: Users },
                    { label: 'Taxa de Abertura', value: `${stats?.averageOpenRate || 0}%`, icon: TrendingUp },
                    { label: 'Newsletters Enviadas', value: `${stats?.totalNewslettersSent || 0}`, icon: Mail },
                    { label: 'Crescimento Semanal', value: `+${stats?.weeklyGrowth || 0}`, icon: Award }
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="p-3 bg-neon-purple/20 rounded-full w-fit mx-auto mb-3">
                        <stat.icon className="w-6 h-6 text-neon-purple" />
                      </div>
                      <div className="text-2xl font-orbitron font-bold text-lime-green mb-1">
                        {stat.value}
                      </div>
                      <div className="text-futuristic-gray font-roboto text-sm">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-12 text-center">
                <p className="text-futuristic-gray font-roboto text-lg mb-6">
                  Junte-se a milhares de profissionais que já transformaram sua carreira com nosso conteúdo.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-futuristic-gray">
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-lime-green mr-2" />
                    Conteúdo semanal
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-lime-green mr-2" />
                    Sem spam
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-lime-green mr-2" />
                    Cancele quando quiser
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced FAQ */}
          <div className="mt-24 animate-slide-up-delay-3">
            <h3 className="font-orbitron font-bold text-3xl lg:text-4xl text-center mb-16">
              <span className="gradient-text">Perguntas Frequentes</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  question: "Com que frequência vocês enviam newsletters?",
                  answer: "Enviamos uma newsletter por semana, sempre às terças-feiras, com o melhor conteúdo sobre IA e tecnologia."
                },
                {
                  question: "O conteúdo é realmente exclusivo?",
                  answer: "Sim! Nossos inscritos recebem análises aprofundadas, tutoriais práticos e insights que não publicamos no site."
                },
                {
                  question: "Posso cancelar minha inscrição?",
                  answer: "Claro! Você pode cancelar sua inscrição a qualquer momento com apenas um clique no final de qualquer email."
                },
                {
                  question: "Vocês compartilham meus dados?",
                  answer: "Jamais! Seus dados são protegidos e nunca compartilhados com terceiros. Respeitamos totalmente sua privacidade."
                }
              ].map((faq, index) => (
                <Card key={index} className="p-6 glass-effect hover-lift">
                  <h4 className="font-orbitron font-semibold text-lg text-white mb-3">
                    {faq.question}
                  </h4>
                  <p className="text-futuristic-gray font-roboto leading-relaxed">
                    {faq.answer}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default Newsletter;