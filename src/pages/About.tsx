import React from 'react';
import { Brain, Zap, Target, Users, Sparkles, ArrowRight, Award, TrendingUp, Globe, Calendar, Code, BookOpen, Lightbulb, Heart } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const About: React.FC = () => {
  const stats = [
    { number: '50K+', label: 'Leitores Mensais', icon: Users },
    { number: '200+', label: 'Artigos Publicados', icon: BookOpen },
    { number: '15+', label: 'Países Alcançados', icon: Globe },
    { number: '98%', label: 'Satisfação dos Usuários', icon: Heart }
  ];

  const timeline = [
    {
      year: '2023',
      title: 'Fundação do AIMindset',
      description: 'Início da jornada com foco em democratizar o conhecimento sobre IA'
    },
    {
      year: '2024',
      title: 'Expansão Internacional',
      description: 'Alcançamos leitores em mais de 15 países, traduzindo conteúdo para múltiplos idiomas'
    },
    {
      year: '2024',
      title: 'Comunidade Ativa',
      description: 'Mais de 50.000 leitores mensais e uma comunidade engajada de profissionais de IA'
    },
    {
      year: '2025',
      title: 'Futuro da IA',
      description: 'Expandindo para cursos online, workshops e consultoria especializada'
    }
  ];

  const team = [
    {
      name: 'Dr. Ana Silva',
      role: 'Fundadora & CEO',
      expertise: 'Machine Learning, Deep Learning',
      description: 'PhD em Ciência da Computação com 10+ anos em IA'
    },
    {
      name: 'Carlos Santos',
      role: 'CTO & Lead Developer',
      expertise: 'MLOps, Cloud Computing',
      description: 'Especialista em implementação de soluções de IA em escala'
    },
    {
      name: 'Marina Costa',
      role: 'Head of Content',
      expertise: 'Technical Writing, UX Research',
      description: 'Especialista em transformar conceitos complexos em conteúdo acessível'
    }
  ];

  return (
    <div className="min-h-screen bg-primary-dark text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-lime-green/10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-neon-gradient rounded-full animate-pulse">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 gradient-text">
            Sobre o AIMindset
          </h1>
          <p className="text-xl md:text-2xl text-futuristic-gray font-roboto leading-relaxed mb-8">
            Transformando o futuro através da inteligência artificial e inovação tecnológica
          </p>
          <div className="flex justify-center space-x-4">
            <div className="px-4 py-2 bg-lime-green/20 rounded-full text-lime-green text-sm font-medium">
              🚀 Fundado em 2023
            </div>
            <div className="px-4 py-2 bg-neon-purple/20 rounded-full text-neon-purple text-sm font-medium">
              🌍 Global
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 text-center hover-lift glass-effect">
                <div className="flex justify-center mb-3">
                  <stat.icon className="w-8 h-8 text-lime-green" />
                </div>
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

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-6 text-lime-green">
                  Nossa Missão
                </h2>
                <p className="text-lg text-futuristic-gray font-roboto leading-relaxed mb-6">
                  O AIMindset nasceu com o propósito de <span className="text-lime-green font-semibold">democratizar o conhecimento sobre inteligência artificial</span>, 
                  tornando conceitos complexos acessíveis para todos os públicos - desde iniciantes curiosos até profissionais experientes.
                </p>
                <p className="text-lg text-futuristic-gray font-roboto leading-relaxed mb-6">
                  Acreditamos que a IA não é apenas uma tecnologia do futuro, mas uma <span className="text-neon-purple font-semibold">realidade presente</span> que 
                  pode transformar vidas, negócios e sociedades quando compreendida e aplicada corretamente.
                </p>
                <div className="flex items-center space-x-4">
                  <Award className="w-6 h-6 text-lime-green" />
                  <span className="text-white font-medium">Reconhecido como referência em conteúdo de IA no Brasil</span>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 bg-neon-gradient rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target className="w-24 h-24 text-lime-green animate-bounce" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-lime-green rounded-full animate-ping"></div>
                  <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-neon-purple rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-white">
            Nossos <span className="gradient-text">Valores</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover-lift glass-effect group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-lime-green/20 rounded-full group-hover:bg-lime-green/30 transition-colors">
                  <Sparkles className="w-8 h-8 text-lime-green" />
                </div>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-3 text-white">
                Inovação
              </h3>
              <p className="text-futuristic-gray font-roboto leading-relaxed">
                Exploramos as fronteiras da tecnologia para trazer insights únicos e perspectivas inovadoras sobre o futuro da IA.
              </p>
            </Card>

            <Card className="p-6 text-center hover-lift glass-effect group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-neon-purple/20 rounded-full group-hover:bg-neon-purple/30 transition-colors">
                  <Users className="w-8 h-8 text-neon-purple" />
                </div>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-3 text-white">
                Comunidade
              </h3>
              <p className="text-futuristic-gray font-roboto leading-relaxed">
                Construímos uma comunidade global engajada de entusiastas, profissionais e curiosos sobre inteligência artificial.
              </p>
            </Card>

            <Card className="p-6 text-center hover-lift glass-effect group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-lime-green/20 rounded-full group-hover:bg-lime-green/30 transition-colors">
                  <Zap className="w-8 h-8 text-lime-green" />
                </div>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-3 text-white">
                Impacto
              </h3>
              <p className="text-futuristic-gray font-roboto leading-relaxed">
                Focamos em conteúdo que gera impacto real na vida das pessoas, empresas e na sociedade como um todo.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-white">
            Nossa <span className="gradient-text">Jornada</span>
          </h2>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-lime-green to-neon-purple"></div>
            {timeline.map((item, index) => (
              <div key={index} className={`relative flex items-center mb-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className={`flex-1 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                  <Card className="p-6 glass-effect hover-lift">
                    <div className="flex items-center mb-3">
                      <Calendar className="w-5 h-5 text-lime-green mr-2" />
                      <span className="text-lime-green font-orbitron font-bold">{item.year}</span>
                    </div>
                    <h3 className="text-xl font-orbitron font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-futuristic-gray font-roboto">
                      {item.description}
                    </p>
                  </Card>
                </div>
                <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 bg-lime-green rounded-full border-4 border-primary-dark"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-white">
            Nossa <span className="gradient-text">Equipe</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="p-6 text-center hover-lift glass-effect group">
                <div className="w-20 h-20 bg-neon-gradient rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Code className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-orbitron font-semibold text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-lime-green font-medium mb-2">{member.role}</p>
                <p className="text-sm text-neon-purple mb-3">{member.expertise}</p>
                <p className="text-futuristic-gray font-roboto text-sm leading-relaxed">
                  {member.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-lime-green">
              O Que <span className="gradient-text">Oferecemos</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-3 h-3 bg-lime-green rounded-full mt-3 group-hover:scale-125 transition-transform"></div>
                  <div>
                    <h3 className="text-lg font-orbitron font-semibold text-white mb-2 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-lime-green" />
                      Artigos Especializados
                    </h3>
                    <p className="text-futuristic-gray font-roboto leading-relaxed">
                      Conteúdo aprofundado sobre tendências, ferramentas e aplicações práticas de IA, sempre atualizado com as últimas novidades do setor.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-3 h-3 bg-neon-purple rounded-full mt-3 group-hover:scale-125 transition-transform"></div>
                  <div>
                    <h3 className="text-lg font-orbitron font-semibold text-white mb-2 flex items-center">
                      <Code className="w-5 h-5 mr-2 text-neon-purple" />
                      Tutoriais Práticos
                    </h3>
                    <p className="text-futuristic-gray font-roboto leading-relaxed">
                      Guias passo a passo para implementar soluções de IA em diferentes contextos, com exemplos de código e casos reais.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-3 h-3 bg-lime-green rounded-full mt-3 group-hover:scale-125 transition-transform"></div>
                  <div>
                    <h3 className="text-lg font-orbitron font-semibold text-white mb-2 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-lime-green" />
                      Análises de Mercado
                    </h3>
                    <p className="text-futuristic-gray font-roboto leading-relaxed">
                      Insights profundos sobre o impacto da IA em diferentes setores, tendências de investimento e oportunidades emergentes.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-3 h-3 bg-neon-purple rounded-full mt-3 group-hover:scale-125 transition-transform"></div>
                  <div>
                    <h3 className="text-lg font-orbitron font-semibold text-white mb-2 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-neon-purple" />
                      Reviews de Ferramentas
                    </h3>
                    <p className="text-futuristic-gray font-roboto leading-relaxed">
                      Avaliações detalhadas e imparciais das principais ferramentas e plataformas de IA, com comparativos e recomendações.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-3 h-3 bg-lime-green rounded-full mt-3 group-hover:scale-125 transition-transform"></div>
                  <div>
                    <h3 className="text-lg font-orbitron font-semibold text-white mb-2 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-lime-green" />
                      Casos de Uso
                    </h3>
                    <p className="text-futuristic-gray font-roboto leading-relaxed">
                      Exemplos reais e inspiradores de como a IA está transformando empresas, processos e criando novas oportunidades de negócio.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-3 h-3 bg-neon-purple rounded-full mt-3 group-hover:scale-125 transition-transform"></div>
                  <div>
                    <h3 className="text-lg font-orbitron font-semibold text-white mb-2 flex items-center">
                      <Heart className="w-5 h-5 mr-2 text-neon-purple" />
                      Newsletter Exclusiva
                    </h3>
                    <p className="text-futuristic-gray font-roboto leading-relaxed">
                      Conteúdo semanal curado com as principais novidades do mundo da IA, insights exclusivos e acesso antecipado a novos artigos.
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
          <Card className="p-8 md:p-12 glass-effect relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-lime-green/5 to-neon-purple/5"></div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-6 text-white">
                Junte-se à <span className="gradient-text">Revolução da IA</span>
              </h2>
              <p className="text-lg text-futuristic-gray font-roboto mb-8 leading-relaxed">
                Faça parte de uma comunidade global que está moldando o futuro através da inteligência artificial. 
                Receba conteúdo exclusivo, participe de discussões e mantenha-se sempre à frente das tendências tecnológicas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => window.location.href = '/newsletter'}
                  className="group hover-lift"
                >
                  <Heart className="mr-2 w-5 h-5" />
                  Assinar Newsletter
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.location.href = '/'}
                  className="hover-lift"
                >
                  <BookOpen className="mr-2 w-5 h-5" />
                  Explorar Artigos
                </Button>
              </div>
              <div className="mt-8 flex justify-center space-x-8 text-sm text-futuristic-gray">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1 text-lime-green" />
                  50K+ Leitores
                </div>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-1 text-neon-purple" />
                  15+ Países
                </div>
                <div className="flex items-center">
                  <Award className="w-4 h-4 mr-1 text-lime-green" />
                  Conteúdo Premium
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default About;