import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useContacts } from '../hooks/useContacts';

export const Contact: React.FC = () => {
  const { submitContact, loading } = useContacts();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await submitContact(formData);
    
    if (success) {
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-dark-surface">
      {/* Header */}
      <div className="bg-darker-surface border-b border-neon-purple/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
              Entre em <span className="gradient-text">Contato</span>
            </h1>
            <p className="text-xl text-futuristic-gray font-roboto max-w-3xl mx-auto">
              Tem alguma dúvida ou sugestão? Estamos aqui para ajudar você a navegar 
              pelo futuro da inteligência artificial.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Informações de contato */}
          <div className="space-y-8">
            <Card className="glass-effect">
              <div className="p-8">
                <h2 className="text-2xl font-orbitron font-bold text-white mb-6">
                  Informações de Contato
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-neon-purple/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-neon-purple" />
                    </div>
                    <div>
                      <h3 className="font-montserrat font-semibold text-white">Email</h3>
                      <p className="text-futuristic-gray font-roboto">contato@aimindset.com</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-lime-green/20 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-lime-green" />
                    </div>
                    <div>
                      <h3 className="font-montserrat font-semibold text-white">Telefone</h3>
                      <p className="text-futuristic-gray font-roboto">+55 (11) 9999-9999</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-electric-blue/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-electric-blue" />
                    </div>
                    <div>
                      <h3 className="font-montserrat font-semibold text-white">Localização</h3>
                      <p className="text-futuristic-gray font-roboto">São Paulo, Brasil</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="glass-effect">
              <div className="p-8">
                <h2 className="text-2xl font-orbitron font-bold text-white mb-6">
                  Horário de Atendimento
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-montserrat text-white">Segunda - Sexta</span>
                    <span className="text-futuristic-gray font-roboto">9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-montserrat text-white">Sábado</span>
                    <span className="text-futuristic-gray font-roboto">9:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-montserrat text-white">Domingo</span>
                    <span className="text-futuristic-gray font-roboto">Fechado</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Formulário de contato */}
          <div>
            <Card className="glass-effect">
              <div className="p-8">
                <h2 className="text-2xl font-orbitron font-bold text-white mb-6">
                  Envie sua Mensagem
                </h2>

                {isSubmitted && (
                  <div className="mb-6 p-4 bg-lime-green/20 border border-lime-green/30 rounded-lg flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-lime-green" />
                    <p className="text-lime-green font-roboto">
                      Mensagem enviada com sucesso! Entraremos em contato em breve.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-montserrat font-medium text-white mb-2">
                        Nome *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20"
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-montserrat font-medium text-white mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-montserrat font-medium text-white mb-2">
                      Assunto *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20"
                      placeholder="Qual o assunto da sua mensagem?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-montserrat font-medium text-white mb-2">
                      Mensagem *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 resize-none"
                      placeholder="Escreva sua mensagem aqui..."
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    className="w-full neon-glow"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
    </div>
  );
};

export default Contact;