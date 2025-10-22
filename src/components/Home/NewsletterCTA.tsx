import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Sparkles, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../UI/Button';
import Card from '../UI/Card';
import { useNewsletter } from '../../hooks/useNewsletter';

const NewsletterCTA: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { subscribe, error } = useNewsletter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor, insira seu email');
      return;
    }

    setIsLoading(true);
    
    const success = await subscribe(email);
    
    if (success) {
      setIsSubscribed(true);
      setEmail('');
      toast.success('Obrigado! Você foi inscrito na nossa newsletter.');
    } else {
      toast.error(error || 'Erro ao inscrever na newsletter. Tente novamente.');
    }
    
    setIsLoading(false);
  };

  return (
    <section className="py-20 bg-darker-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card variant="glass" className="p-8 md:p-12 text-center relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-lime-green/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 bg-neon-purple/10 backdrop-blur-sm border border-neon-purple/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-lime-green" />
              <span className="text-futuristic-gray font-montserrat text-sm">
                Newsletter Exclusiva
              </span>
            </div>

            <h2 className="font-orbitron font-bold text-3xl md:text-4xl mb-4">
              <span className="gradient-text">Fique Sempre Atualizado</span>
            </h2>

            <p className="font-roboto text-lg text-futuristic-gray mb-8 max-w-2xl mx-auto leading-relaxed">
              Receba insights exclusivos sobre IA, análises de tendências e conteúdos premium 
              diretamente na sua caixa de entrada. Sem spam, apenas valor.
            </p>

            {!isSubscribed ? (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu melhor email"
                    className="flex-1 px-4 py-3 bg-dark-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green focus:ring-2 focus:ring-lime-green/20 transition-all duration-300"
                  />
                  <Button type="submit" size="lg" className="sm:w-auto" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Inscrevendo...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Assinar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-lime-green mb-8">
                <CheckCircle className="h-6 w-6" />
                <span className="font-montserrat font-semibold">Inscrição realizada com sucesso!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-lime-green rounded-full"></div>
                <span className="text-futuristic-gray">Conteúdo exclusivo</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-lime-green rounded-full"></div>
                <span className="text-futuristic-gray">Sem spam</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-lime-green rounded-full"></div>
                <span className="text-futuristic-gray">Cancele a qualquer momento</span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/newsletter"
                className="text-neon-purple hover:text-neon-purple/80 font-montserrat text-sm transition-colors duration-300"
              >
                Saiba mais sobre nossa newsletter →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default NewsletterCTA;