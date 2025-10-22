import React from 'react';
import { Brain, Zap, Target, Users, Sparkles, ArrowRight } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary-dark text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-neon-gradient rounded-full">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-montserrat font-bold mb-6 bg-gradient-to-r from-lime-green to-neon-purple bg-clip-text text-transparent">
            Sobre o AIMindset
          </h1>
          <p className="text-xl md:text-2xl text-futuristic-gray font-roboto leading-relaxed">
            Transformando o futuro através da inteligência artificial e inovação tecnológica
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-6 text-lime-green">
                  Nossa Missão
                </h2>
                <p className="text-lg text-futuristic-gray font-roboto leading-relaxed mb-6">
                  O AIMindset nasceu com o propósito de democratizar o conhecimento sobre inteligência artificial, 
                  tornando conceitos complexos acessíveis para todos os públicos.
                </p>
                <p className="text-lg text-futuristic-gray font-roboto leading-relaxed">
                  Acreditamos que a IA não é apenas uma tecnologia do futuro, mas uma realidade presente que 
                  pode transformar vidas, negócios e sociedades quando compreendida e aplicada corretamente.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 bg-neon-gradient rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target className="w-24 h-24 text-lime-green" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-center mb-12 text-white">
            Nossos Valores
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover-lift">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-lime-green/20 rounded-full">
                  <Sparkles className="w-8 h-8 text-lime-green" />
                </div>
              </div>
              <h3 className="text-xl font-montserrat font-semibold mb-3 text-white">
                Inovação
              </h3>
              <p className="text-futuristic-gray font-roboto">
                Exploramos as fronteiras da tecnologia para trazer insights únicos e perspectivas inovadoras.
              </p>
            </Card>

            <Card className="p-6 text-center hover-lift">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-neon-purple/20 rounded-full">
                  <Users className="w-8 h-8 text-neon-purple" />
                </div>
              </div>
              <h3 className="text-xl font-montserrat font-semibold mb-3 text-white">
                Comunidade
              </h3>
              <p className="text-futuristic-gray font-roboto">
                Construímos uma comunidade engajada de entusiastas, profissionais e curiosos sobre IA.
              </p>
            </Card>

            <Card className="p-6 text-center hover-lift">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-lime-green/20 rounded-full">
                  <Zap className="w-8 h-8 text-lime-green" />
                </div>
              </div>
              <h3 className="text-xl font-montserrat font-semibold mb-3 text-white">
                Impacto
              </h3>
              <p className="text-futuristic-gray font-roboto">
                Focamos em conteúdo que gera impacto real na vida das pessoas e nos negócios.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-center mb-12 text-lime-green">
              O Que Oferecemos
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-2 h-2 bg-lime-green rounded-full mt-3"></div>
                  <div>
                    <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                      Artigos Especializados
                    </h3>
                    <p className="text-futuristic-gray font-roboto">
                      Conteúdo aprofundado sobre tendências, ferramentas e aplicações práticas de IA.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-2 h-2 bg-neon-purple rounded-full mt-3"></div>
                  <div>
                    <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                      Tutoriais Práticos
                    </h3>
                    <p className="text-futuristic-gray font-roboto">
                      Guias passo a passo para implementar soluções de IA em diferentes contextos.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-2 h-2 bg-lime-green rounded-full mt-3"></div>
                  <div>
                    <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                      Análises de Mercado
                    </h3>
                    <p className="text-futuristic-gray font-roboto">
                      Insights sobre o impacto da IA em diferentes setores e indústrias.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-2 h-2 bg-neon-purple rounded-full mt-3"></div>
                  <div>
                    <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                      Reviews de Ferramentas
                    </h3>
                    <p className="text-futuristic-gray font-roboto">
                      Avaliações detalhadas das principais ferramentas e plataformas de IA.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-2 h-2 bg-lime-green rounded-full mt-3"></div>
                  <div>
                    <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                      Casos de Uso
                    </h3>
                    <p className="text-futuristic-gray font-roboto">
                      Exemplos reais de como a IA está transformando empresas e processos.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-2 h-2 bg-neon-purple rounded-full mt-3"></div>
                  <div>
                    <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                      Newsletter Exclusiva
                    </h3>
                    <p className="text-futuristic-gray font-roboto">
                      Conteúdo semanal com as principais novidades do mundo da IA.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-6 text-white">
              Junte-se à Revolução da IA
            </h2>
            <p className="text-lg text-futuristic-gray font-roboto mb-8 leading-relaxed">
              Faça parte de uma comunidade que está moldando o futuro através da inteligência artificial. 
              Receba conteúdo exclusivo e mantenha-se sempre à frente das tendências tecnológicas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => window.location.href = '/newsletter'}
                className="group"
              >
                Assinar Newsletter
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.location.href = '/'}
              >
                Explorar Artigos
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default About;