import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, MessageCircle, Clock, Users, Zap, Globe, Heart, ArrowRight, Headphones, Shield, Star } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useContacts } from '../hooks/useContacts';
import { useContactStats } from '../hooks/useContactStats';
import { sanitizeName, sanitizeEmail, sanitizeMessage, validators, RateLimiter } from '../utils/security';
import SEOManager from '../components/SEO/SEOManager';
import { useSEO } from '../hooks/useSEO';

export const Contact: React.FC = () => {
  const { submitContact, loading } = useContacts();
  const { 
    totalContacts, 
    averageResponseTime, 
    satisfactionRate, 
    systemStatus, 
    messagesThisWeek,
    loading: statsLoading 
  } = useContactStats();

  // SEO para página de contato
  const { getMetadata } = useSEO({ 
    pageType: 'contact',
    fallbackTitle: 'Contato - AIMindset',
    fallbackDescription: 'Entre em contato conosco. Tire suas dúvidas, envie sugestões ou colabore com o AIMindset.'
  });

  const metadata = getMetadata();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rateLimitError, setRateLimitError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar nome
    if (!validators.required(formData.name)) {
      newErrors.name = 'Nome é obrigatório';
    } else if (!validators.name(formData.name)) {
      newErrors.name = 'Nome deve ter entre 2 e 100 caracteres e conter apenas letras';
    }

    // Validar email
    if (!validators.required(formData.email)) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validators.email(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar assunto
    if (!validators.required(formData.subject)) {
      newErrors.subject = 'Assunto é obrigatório';
    }

    // Validar mensagem
    if (!validators.required(formData.message)) {
      newErrors.message = 'Mensagem é obrigatória';
    } else if (!validators.message(formData.message)) {
      newErrors.message = 'Mensagem deve ter entre 10 e 5000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar rate limiting
    if (!RateLimiter.canPerformAction('contact_form', 3, 300000)) { // 3 tentativas por 5 minutos
      const remainingTime = Math.ceil(RateLimiter.getRemainingTime('contact_form', 300000) / 1000 / 60);
      setRateLimitError(`Muitas tentativas. Tente novamente em ${remainingTime} minutos.`);
      return;
    }

    setRateLimitError('');

    // Validar formulário
    if (!validateForm()) {
      return;
    }

    // Sanitizar dados
    const sanitizedData = {
      name: sanitizeName(formData.name),
      email: sanitizeEmail(formData.email),
      subject: sanitizeName(formData.subject), // Usar sanitizeName para assunto também
      message: sanitizeMessage(formData.message)
    };

    const success = await submitContact(sanitizedData);
    
    if (success) {
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Direto',
      description: `Resposta em ${averageResponseTime}`,
      contact: 'contato@aimindset.com',
      color: 'neon-purple',
      bgColor: 'neon-purple/20'
    },
    {
      icon: MessageCircle,
      title: 'Chat Online',
      description: systemStatus === 'online' ? 'Sistema Online' : 'Sistema em Manutenção',
      contact: 'Segunda a Sexta, 9h-18h',
      color: systemStatus === 'online' ? 'lime-green' : 'yellow-500',
      bgColor: systemStatus === 'online' ? 'lime-green/20' : 'yellow-500/20'
    },
    {
      icon: Phone,
      title: 'Telefone',
      description: 'Atendimento personalizado',
      contact: '+55 (11) 99999-9999',
      color: 'electric-blue',
      bgColor: 'electric-blue/20'
    }
  ];

  const supportTopics = [
    {
      icon: Users,
      title: 'Parcerias & Colaborações',
      description: 'Oportunidades de parceria e colaboração em projetos de IA'
    },
    {
      icon: Headphones,
      title: 'Suporte Técnico',
      description: 'Ajuda com implementação de soluções e ferramentas de IA'
    },
    {
      icon: Star,
      title: 'Feedback & Sugestões',
      description: 'Compartilhe suas ideias para melhorar nosso conteúdo'
    },
    {
      icon: Shield,
      title: 'Questões de Privacidade',
      description: 'Dúvidas sobre proteção de dados e políticas de privacidade'
    }
  ];

  // Estatísticas reais baseadas nos dados do Supabase
  const stats = [
    { 
      number: averageResponseTime, 
      label: 'Tempo de Resposta', 
      icon: Clock 
    },
    { 
      number: statsLoading ? '...' : `${satisfactionRate}%`, 
      label: 'Satisfação', 
      icon: Heart 
    },
    { 
      number: '1', 
      label: 'País (Brasil)', 
      icon: Globe 
    },
    { 
      number: systemStatus === 'online' ? '24/7' : 'Manutenção', 
      label: 'Disponibilidade', 
      icon: Zap 
    }
  ];

  return (
    <>
      <SEOManager metadata={metadata} />
      <div className="min-h-screen bg-primary-dark text-white">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 via-transparent to-lime-green/20"></div>
          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6">
                Entre em <span className="gradient-text">Contato</span>
              </h1>
              <p className="text-xl md:text-2xl text-futuristic-gray font-roboto max-w-3xl mx-auto">
                Conecte-se conosco e faça parte da revolução da Inteligência Artificial
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {stats.map((stat, index) => (
                <Card key={index} className="p-6 text-center glass-effect">
                  <stat.icon className="w-8 h-8 text-lime-green mx-auto mb-3" aria-hidden="true" />
                  <div className="text-2xl md:text-3xl font-orbitron font-bold text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-futuristic-gray font-roboto">
                    {stat.label}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-white">
              Como Podemos <span className="gradient-text">Ajudar</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8" role="list" aria-label="Métodos de contato disponíveis">
              {contactMethods.map((method, index) => (
                <Card key={index} className="p-6 text-center hover-lift glass-effect group">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 bg-${method.bgColor} rounded-full group-hover:scale-110 transition-transform`}>
                      <method.icon className={`w-8 h-8 text-${method.color}`} aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className="text-xl font-orbitron font-semibold mb-2 text-white">
                    {method.title}
                  </h3>
                  <p className="text-futuristic-gray font-roboto mb-3 text-sm">
                    {method.description}
                  </p>
                  <p className={`text-${method.color} font-medium`}>
                    {method.contact}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information & Support Topics */}
            <div className="space-y-8">
              {/* Contact Info */}
              <Card className="glass-effect">
                <div className="p-8">
                  <h2 className="text-2xl font-orbitron font-bold text-white mb-6 flex items-center">
                    <MapPin className="w-6 h-6 mr-2 text-lime-green" aria-hidden="true" />
                    Informações de Contato
                  </h2>
                  
                  <div className="space-y-6" role="list" aria-label="Informações de contato detalhadas">
                    <div className="flex items-center space-x-4 group">
                      <div className="w-12 h-12 bg-neon-purple/20 rounded-lg flex items-center justify-center group-hover:bg-neon-purple/30 transition-colors">
                        <Mail className="w-6 h-6 text-neon-purple" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-orbitron font-semibold text-white">Email Principal</h3>
                        <p className="text-futuristic-gray font-roboto">contato@aimindset.com</p>
                        <p className="text-xs text-lime-green">Resposta garantida em 24h</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 group">
                      <div className="w-12 h-12 bg-lime-green/20 rounded-lg flex items-center justify-center group-hover:bg-lime-green/30 transition-colors">
                        <Phone className="w-6 h-6 text-lime-green" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-orbitron font-semibold text-white">Telefone & WhatsApp</h3>
                        <p className="text-futuristic-gray font-roboto">+55 (11) 9999-9999</p>
                        <p className="text-xs text-neon-purple">Atendimento personalizado</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 group">
                      <div className="w-12 h-12 bg-electric-blue/20 rounded-lg flex items-center justify-center group-hover:bg-electric-blue/30 transition-colors">
                        <Globe className="w-6 h-6 text-electric-blue" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-orbitron font-semibold text-white">Localização</h3>
                        <p className="text-futuristic-gray font-roboto">São Paulo, Brasil</p>
                        <p className="text-xs text-lime-green">Atendimento global online</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Support Topics */}
              <Card className="glass-effect">
                <div className="p-8">
                  <h2 className="text-2xl font-orbitron font-bold text-white mb-6 flex items-center">
                    <Headphones className="w-6 h-6 mr-2 text-neon-purple" aria-hidden="true" />
                    Como Podemos Ajudar
                  </h2>
                  
                  <div className="space-y-4" role="list" aria-label="Tópicos de suporte disponíveis">
                    {supportTopics.map((topic, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-primary-dark/50 transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-lime-green/20 rounded-lg flex items-center justify-center group-hover:bg-lime-green/30 transition-colors">
                          <topic.icon className="w-5 h-5 text-lime-green" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="font-orbitron font-semibold text-white mb-1">
                            {topic.title}
                          </h3>
                          <p className="text-futuristic-gray font-roboto text-sm leading-relaxed">
                            {topic.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="glass-effect">
                <div className="p-8">
                  <h2 className="text-2xl font-orbitron font-bold text-white mb-6 flex items-center">
                    <Send className="w-6 h-6 mr-2 text-lime-green" aria-hidden="true" />
                    Envie sua Mensagem
                  </h2>

                  {isSubmitted && (
                    <div className="mb-6 p-4 bg-lime-green/20 border border-lime-green/30 rounded-lg flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-lime-green" />
                      <div>
                        <p className="text-lime-green font-roboto font-medium">
                          Mensagem enviada com sucesso!
                        </p>
                        <p className="text-lime-green/80 text-sm">
                          Entraremos em contato em até 24 horas.
                        </p>
                      </div>
                    </div>
                  )}

                  {rateLimitError && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-red-500" />
                      <p className="text-red-500 font-roboto font-medium">
                        {rateLimitError}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-orbitron font-medium text-white mb-2">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          maxLength={100}
                          className={`w-full px-4 py-3 bg-primary-dark border rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 transition-all ${
                            errors.name 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-neon-purple/30 focus:border-lime-green focus:ring-lime-green/20'
                          }`}
                          placeholder="Seu nome completo"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-orbitron font-medium text-white mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          maxLength={255}
                          className={`w-full px-4 py-3 bg-primary-dark border rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 transition-all ${
                            errors.email 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-neon-purple/30 focus:border-lime-green focus:ring-lime-green/20'
                          }`}
                          placeholder="seu@email.com"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-orbitron font-medium text-white mb-2">
                        Assunto *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 bg-primary-dark border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                          errors.subject 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-neon-purple/30 focus:border-lime-green focus:ring-lime-green/20'
                        }`}
                      >
                        <option value="">Selecione um assunto</option>
                        <option value="Parceria">Parceria & Colaboração</option>
                        <option value="Suporte">Suporte Técnico</option>
                        <option value="Feedback">Feedback & Sugestões</option>
                        <option value="Privacidade">Questões de Privacidade</option>
                        <option value="Geral">Assunto Geral</option>
                      </select>
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-orbitron font-medium text-white mb-2">
                        Mensagem *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        maxLength={5000}
                        className={`w-full px-4 py-3 bg-primary-dark border rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 transition-all resize-none ${
                          errors.message 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-neon-purple/30 focus:border-lime-green focus:ring-lime-green/20'
                        }`}
                        placeholder="Descreva sua mensagem detalhadamente..."
                      />
                      <div className="flex justify-between items-center mt-1">
                        {errors.message ? (
                          <p className="text-sm text-red-500">{errors.message}</p>
                        ) : (
                          <p className="text-sm text-futuristic-gray">
                            Mínimo 10 caracteres
                          </p>
                        )}
                        <p className="text-sm text-futuristic-gray">
                          {formData.message.length}/5000
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-neon-gradient hover:bg-neon-gradient-hover text-white font-orbitron font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Enviando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Send className="w-5 h-5" />
                          <span>Enviar Mensagem</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 md:p-12 glass-effect">
              <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-8 text-white">
                Perguntas <span className="gradient-text">Frequentes</span>
              </h2>
              <div className="space-y-6">
                <div className="border-b border-neon-purple/20 pb-6">
                  <h3 className="text-lg font-orbitron font-semibold text-lime-green mb-2">
                    Quanto tempo leva para receber uma resposta?
                  </h3>
                  <p className="text-futuristic-gray font-roboto">
                    Garantimos resposta em até 24 horas para emails. Para questões urgentes, 
                    utilize nosso chat online ou WhatsApp durante o horário comercial.
                  </p>
                </div>
                <div className="border-b border-neon-purple/20 pb-6">
                  <h3 className="text-lg font-orbitron font-semibold text-lime-green mb-2">
                    Vocês oferecem consultoria personalizada?
                  </h3>
                  <p className="text-futuristic-gray font-roboto">
                    Sim! Oferecemos consultoria especializada em IA para empresas e profissionais. 
                    Entre em contato para discutir suas necessidades específicas.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-orbitron font-semibold text-lime-green mb-2">
                    Como posso colaborar com o AIMindset?
                  </h3>
                  <p className="text-futuristic-gray font-roboto">
                    Estamos sempre abertos a parcerias! Seja para guest posts, colaborações técnicas 
                    ou projetos conjuntos, envie sua proposta detalhada através do formulário.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
};

export default Contact;