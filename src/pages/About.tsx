import React from 'react';
import { Brain, Zap, Target, Users, Sparkles, ArrowRight, Award, TrendingUp, Globe, Calendar, Code, BookOpen, Lightbulb, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useStats } from '../hooks/useStats';

const About: React.FC = () => {
  // Usar dados reais do Supabase com atualização automática
  const { totalArticles, totalUsers, totalCountries, totalViews, loading } = useStats();

  const stats = [
    { 
      number: loading ? '...' : `${totalUsers}+`, 
      label: 'Leitores', 
      icon: Users 
    },
    { 
      number: loading ? '...' : `${totalArticles}+`, 
      label: 'Artigos Publicados', 
      icon: BookOpen 
    },
    { 
      number: `${totalCountries}`, 
      label: 'País (Brasil)', 
      icon: Globe 
    },
    { 
      number: loading ? '...' : `${totalViews}+`, 
      label: 'Visualizações', 
      icon: TrendingUp 
    }
  ];

  const timeline = [
    {
      year: '2024',
      title: 'Fundação do AIMindset',
      description: 'Início da jornada com foco em democratizar o conhecimento sobre IA no Brasil'
    },
    {
      year: '2024',
      title: 'Primeiros Artigos',
      description: 'Publicação dos primeiros conteúdos sobre inteligência artificial e tecnologia'
    },
    {
      year: '2024',
      title: 'Crescimento da Comunidade',
      description: 'Expansão da base de leitores e engajamento com a comunidade brasileira'
    },
    {
      year: '2025',
      title: 'Expansão de Conteúdo',
      description: 'Planejamento para novos formatos: tutoriais, casos práticos e análises de mercado'
    }
  ];

  const team = [
    {
      name: 'Mateus Oliveira',
      role: 'Fundador & CEO',
      expertise: 'Desenvolvimento Web, IA',
      description: 'Apaixonado por tecnologia e inteligência artificial, criando conteúdo acessível sobre IA'
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
            Democratizando o conhecimento sobre inteligência artificial no Brasil
          </p>
          <div className="flex justify-center space-x-4">
            <div className="px-4 py-2 bg-lime-green/20 rounded-full text-lime-green text-sm font-medium">
              🚀 Fundado em 2024
            </div>
            <div className="px-4 py-2 bg-neon-purple/20 rounded-full text-neon-purple text-sm font-medium">
              🇧🇷 Brasil
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
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-4 text-lime-green">
                Nossa Missão
              </h2>
              <p className="text-xl text-futuristic-gray font-roboto leading-relaxed">
                Tornar o conhecimento sobre inteligência artificial acessível para todos os brasileiros, 
                independente do nível técnico, promovendo educação e inovação no país.
              </p>
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
            <Card className="p-6 hover-lift glass-effect group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-lime-green/20 rounded-full group-hover:bg-lime-green/30 transition-colors">
                  <Lightbulb className="w-8 h-8 text-lime-green" />
                </div>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-3 text-white text-center">
                Simplicidade
              </h3>
              <p className="text-futuristic-gray font-roboto text-center leading-relaxed">
                Transformamos conceitos complexos de IA em conteúdo claro e acessível para todos.
              </p>
            </Card>

            <Card className="p-6 hover-lift glass-effect group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-neon-purple/20 rounded-full group-hover:bg-neon-purple/30 transition-colors">
                  <Target className="w-8 h-8 text-neon-purple" />
                </div>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-3 text-white text-center">
                Qualidade
              </h3>
              <p className="text-futuristic-gray font-roboto text-center leading-relaxed">
                Conteúdo cuidadosamente pesquisado e verificado para garantir informações precisas.
              </p>
            </Card>

            <Card className="p-6 hover-lift glass-effect group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-electric-blue/20 rounded-full group-hover:bg-electric-blue/30 transition-colors">
                  <Heart className="w-8 h-8 text-electric-blue" />
                </div>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-3 text-white text-center">
                Comunidade
              </h3>
              <p className="text-futuristic-gray font-roboto text-center leading-relaxed">
                Construindo uma comunidade brasileira forte e engajada no mundo da IA.
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
          <div className="space-y-8">
            {timeline.map((item, index) => (
              <Card key={index} className="p-6 glass-effect hover-lift">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-neon-gradient rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lime-green font-orbitron font-bold text-lg">
                        {item.year}
                      </span>
                      <h3 className="text-white font-orbitron font-semibold text-lg">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-futuristic-gray font-roboto leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
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
          <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="p-8 text-center hover-lift glass-effect group">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-neon-gradient rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-orbitron font-bold text-white mb-2">
                  {member.name}
                </h3>
                <p className="text-lime-green font-roboto font-semibold mb-2">
                  {member.role}
                </p>
                <p className="text-neon-purple font-roboto text-sm mb-3">
                  {member.expertise}
                </p>
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
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-white">
            O Que <span className="gradient-text">Oferecemos</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover-lift glass-effect group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-lime-green/20 rounded-full group-hover:bg-lime-green/30 transition-colors">
                  <BookOpen className="w-8 h-8 text-lime-green" />
                </div>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-3 text-white text-center">
                Artigos Especializados
              </h3>
              <p className="text-futuristic-gray font-roboto text-center leading-relaxed">
                Conteúdo aprofundado sobre as últimas tendências e desenvolvimentos em IA.
              </p>
            </Card>

            <Card className="p-6 hover-lift glass-effect group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-neon-purple/20 rounded-full group-hover:bg-neon-purple/30 transition-colors">
                  <Code className="w-8 h-8 text-neon-purple" />
                </div>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-3 text-white text-center">
                Tutoriais Práticos
              </h3>
              <p className="text-futuristic-gray font-roboto text-center leading-relaxed">
                Guias passo a passo para implementar soluções de IA em projetos reais.
              </p>
            </Card>

            <Card className="p-6 hover-lift glass-effect group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-electric-blue/20 rounded-full group-hover:bg-electric-blue/30 transition-colors">
                  <TrendingUp className="w-8 h-8 text-electric-blue" />
                </div>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-3 text-white text-center">
                Análises de Mercado
              </h3>
              <p className="text-futuristic-gray font-roboto text-center leading-relaxed">
                Insights sobre o mercado de IA e oportunidades de negócio no Brasil.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 text-center glass-effect relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-lime-green/5 to-neon-purple/5"></div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-6 text-white">
                Explore o Mundo da <span className="gradient-text">Inteligência Artificial</span>
              </h2>
              <p className="text-xl text-futuristic-gray font-roboto leading-relaxed mb-8">
                Descubra conteúdos exclusivos e mantenha-se atualizado com as últimas novidades em IA.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/artigos">
                  <Button variant="primary" size="lg" className="hover-lift">
                    <BookOpen className="mr-2 w-5 h-5" />
                    Explorar Artigos
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/newsletter">
                  <Button variant="outline" size="lg" className="hover-lift">
                    <Sparkles className="mr-2 w-5 h-5" />
                    Assinar Newsletter
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default About;