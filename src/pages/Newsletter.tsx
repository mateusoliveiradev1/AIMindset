import React, { useState } from 'react';
import { Mail, CheckCircle, Sparkles, Zap, Brain, Target, Shield } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { sanitizeName, sanitizeEmail, validators, RateLimiter } from '../utils/security';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rateLimitError, setRateLimitError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar nome
    if (!validators.required(name)) {
      newErrors.name = 'Nome é obrigatório';
    } else if (!validators.name(name)) {
      newErrors.name = 'Nome deve ter entre 2 e 100 caracteres e conter apenas letras';
    }

    // Validar email
    if (!validators.required(email)) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validators.email(email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar rate limiting
    if (!RateLimiter.canPerformAction('newsletter_signup', 3, 300000)) { // 3 tentativas por 5 minutos
      const remainingTime = Math.ceil(RateLimiter.getRemainingTime('newsletter_signup', 300000) / 1000 / 60);
      setRateLimitError(`Muitas tentativas. Tente novamente em ${remainingTime} minutos.`);
      return;
    }

    setRateLimitError('');

    // Validar formulário
    if (!validateForm()) {
      return;
    }

    // Sanitizar dados
    const sanitizedName = sanitizeName(name);
    const sanitizedEmail = sanitizeEmail(email);

    if (!sanitizedName || !sanitizedEmail) {
      toast.error('Dados inválidos. Verifique os campos.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular envio com dados sanitizados
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubscribed(true);
      setErrors({});
      toast.success('Inscrição realizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao processar inscrição. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (field === 'name') {
      setName(value);
    } else if (field === 'email') {
      setEmail(value);
    }
  };

  const benefits = [
    {
      icon: Brain,
      title: 'Insights Exclusivos',
      description: 'Análises profundas sobre as últimas tendências em IA e tecnologia'
    },
    {
      icon: Zap,
      title: 'Conteúdo Premium',
      description: 'Acesso antecipado a artigos, guias e recursos exclusivos'
    },
    {
      icon: Target,
      title: 'Curadoria Especializada',
      description: 'Seleção cuidadosa das melhores ferramentas e oportunidades'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Assinantes' },
    { number: '95%', label: 'Taxa de Abertura' },
    { number: '2x', label: 'Por Semana' }
  ];

  if (isSubscribed) {
    return (
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="glass" className="p-12 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto bg-lime-green/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-lime-green" />
              </div>
              <h1 className="font-orbitron font-bold text-3xl md:text-4xl mb-4">
                <span className="gradient-text">Bem-vindo à comunidade!</span>
              </h1>
              <p className="font-roboto text-lg text-futuristic-gray mb-8">
                Sua inscrição foi confirmada. Em breve você receberá nosso primeiro email com conteúdos exclusivos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-orbitron font-bold text-lime-green mb-2">📧</div>
                <div className="text-sm text-futuristic-gray">Confirme seu email</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-orbitron font-bold text-lime-green mb-2">🎯</div>
                <div className="text-sm text-futuristic-gray">Personalize preferências</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-orbitron font-bold text-lime-green mb-2">🚀</div>
                <div className="text-sm text-futuristic-gray">Receba conteúdos</div>
              </div>
            </div>

            <Button onClick={() => setIsSubscribed(false)} variant="outline">
              Fazer nova inscrição
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-neon-purple/10 backdrop-blur-sm border border-neon-purple/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-lime-green" />
            <span className="text-futuristic-gray font-montserrat text-sm">
              Newsletter Exclusiva
            </span>
          </div>
          
          <h1 className="font-orbitron font-bold text-4xl md:text-5xl lg:text-6xl mb-6">
            <span className="gradient-text">Fique Sempre</span>
            <br />
            <span className="text-white">Atualizado</span>
          </h1>
          
          <p className="font-roboto text-lg md:text-xl text-futuristic-gray max-w-3xl mx-auto leading-relaxed">
            Junte-se a milhares de profissionais que recebem insights exclusivos sobre 
            inteligência artificial, tecnologia e produtividade diretamente na caixa de entrada.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Subscription Form */}
          <Card variant="glass" className="p-8">
            <div className="mb-6">
              <h2 className="font-montserrat font-semibold text-2xl text-white mb-2">
                Assine Gratuitamente
              </h2>
              <p className="text-futuristic-gray">
                Sem spam, apenas conteúdo de valor. Cancele a qualquer momento.
              </p>
            </div>

            {/* Rate Limit Error */}
            {rateLimitError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm font-montserrat">{rateLimitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-montserrat font-medium text-futuristic-gray mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Seu nome"
                  maxLength={100}
                  className={`w-full px-4 py-3 bg-dark-surface border rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.name 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-neon-purple/20 focus:border-lime-green focus:ring-lime-green/20'
                  }`}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-red-400 text-sm font-montserrat">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-montserrat font-medium text-futuristic-gray mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu@email.com"
                  maxLength={254}
                  className={`w-full px-4 py-3 bg-dark-surface border rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-neon-purple/20 focus:border-lime-green focus:ring-lime-green/20'
                  }`}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-red-400 text-sm font-montserrat">{errors.email}</p>
                )}
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Assinar Newsletter
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-xs text-futuristic-gray text-center">
              Ao se inscrever, você concorda com nossa política de privacidade.
            </div>
          </Card>

          {/* Benefits */}
          <div className="space-y-6">
            <h3 className="font-montserrat font-semibold text-xl text-white mb-6">
              O que você vai receber:
            </h3>

            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} variant="default" className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-neon-gradient rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-montserrat font-semibold text-white mb-2">
                        {benefit.title}
                      </h4>
                      <p className="text-futuristic-gray text-sm">
                        {benefit?.description || 'Descrição do benefício'}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20">
          <Card variant="glass" className="p-8">
            <div className="text-center mb-8">
              <h3 className="font-montserrat font-semibold text-xl text-white mb-2">
                Junte-se a uma comunidade engajada
              </h3>
              <p className="text-futuristic-gray">
                Números que comprovam a qualidade do nosso conteúdo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-orbitron font-bold text-lime-green mb-2">
                    {stat.number}
                  </div>
                  <div className="text-futuristic-gray font-montserrat">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h3 className="font-orbitron font-bold text-2xl text-center mb-12">
            <span className="gradient-text">Perguntas Frequentes</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="default" className="p-6">
              <h4 className="font-montserrat font-semibold text-white mb-3">
                Com que frequência vocês enviam emails?
              </h4>
              <p className="text-futuristic-gray text-sm">
                Enviamos 2 newsletters por semana: uma com curadoria de conteúdos e outra com análises exclusivas.
              </p>
            </Card>

            <Card variant="default" className="p-6">
              <h4 className="font-montserrat font-semibold text-white mb-3">
                Posso cancelar a qualquer momento?
              </h4>
              <p className="text-futuristic-gray text-sm">
                Sim! Você pode cancelar sua inscrição a qualquer momento com apenas um clique.
              </p>
            </Card>

            <Card variant="default" className="p-6">
              <h4 className="font-montserrat font-semibold text-white mb-3">
                O conteúdo é realmente gratuito?
              </h4>
              <p className="text-futuristic-gray text-sm">
                Completamente gratuito. Nosso objetivo é democratizar o conhecimento sobre IA e tecnologia.
              </p>
            </Card>

            <Card variant="default" className="p-6">
              <h4 className="font-montserrat font-semibold text-white mb-3">
                Vocês compartilham meus dados?
              </h4>
              <p className="text-futuristic-gray text-sm">
                Nunca! Seus dados são protegidos e utilizados apenas para envio da newsletter.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;