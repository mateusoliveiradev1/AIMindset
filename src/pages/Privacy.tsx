import React from 'react';
import { Shield, Eye, Lock, Users, FileText, Mail, CheckCircle, AlertTriangle, Globe, Calendar, ArrowRight, Download, Trash2, Edit, UserCheck, Database, Server, Zap } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const Privacy: React.FC = () => {
  const dataTypes = [
    {
      icon: Users,
      title: 'Dados Pessoais',
      items: ['Nome completo', 'Endereço de e-mail', 'Preferências de conteúdo', 'Histórico de interações'],
      color: 'lime-green'
    },
    {
      icon: Globe,
      title: 'Dados de Navegação',
      items: ['Endereço IP', 'Tipo de navegador', 'Páginas visitadas', 'Tempo de permanência'],
      color: 'neon-purple'
    },
    {
      icon: Database,
      title: 'Dados Técnicos',
      items: ['Cookies', 'Sessões', 'Logs de acesso', 'Dados de performance'],
      color: 'electric-blue'
    }
  ];

  const userRights = [
    {
      icon: Download,
      title: 'Acesso e Portabilidade',
      description: 'Solicite uma cópia completa dos seus dados pessoais em formato estruturado',
      action: 'Baixar Dados'
    },
    {
      icon: Edit,
      title: 'Retificação',
      description: 'Corrija informações imprecisas ou atualize dados desatualizados',
      action: 'Editar Dados'
    },
    {
      icon: Trash2,
      title: 'Exclusão (Direito ao Esquecimento)',
      description: 'Solicite a remoção completa dos seus dados pessoais dos nossos sistemas',
      action: 'Excluir Dados'
    },
    {
      icon: UserCheck,
      title: 'Limitação de Processamento',
      description: 'Restrinja como processamos seus dados pessoais em situações específicas',
      action: 'Limitar Uso'
    }
  ];

  const securityMeasures = [
    {
      icon: Lock,
      title: 'Criptografia Avançada',
      description: 'SSL/TLS 1.3, AES-256 para dados em repouso'
    },
    {
      icon: Server,
      title: 'Infraestrutura Segura',
      description: 'Servidores em data centers certificados ISO 27001'
    },
    {
      icon: Shield,
      title: 'Monitoramento 24/7',
      description: 'Detecção automática de ameaças e anomalias'
    },
    {
      icon: Zap,
      title: 'Backup Automático',
      description: 'Backups criptografados com retenção de 30 dias'
    }
  ];

  const stats = [
    { number: '0', label: 'Vazamentos de Dados', icon: Shield },
    { number: '< 72h', label: 'Resposta LGPD', icon: Calendar },
    { number: '256-bit', label: 'Criptografia', icon: Lock },
    { number: '99.9%', label: 'Uptime Seguro', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-primary-dark text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-lime-green/10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-neon-gradient rounded-full animate-pulse">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 gradient-text">
            Política de Privacidade
          </h1>
          <p className="text-xl md:text-2xl text-futuristic-gray font-roboto leading-relaxed mb-8">
            Transparência total na proteção dos seus dados pessoais
          </p>
          <div className="flex justify-center space-x-4 mb-6">
            <div className="px-4 py-2 bg-lime-green/20 rounded-full text-lime-green text-sm font-medium">
              🛡️ LGPD Compliant
            </div>
            <div className="px-4 py-2 bg-neon-purple/20 rounded-full text-neon-purple text-sm font-medium">
              🔒 Criptografia 256-bit
            </div>
          </div>
          <p className="text-sm text-futuristic-gray">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} • Versão 2.1
          </p>
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

      {/* Introduction */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 p-3 bg-lime-green/20 rounded-full">
                <FileText className="w-6 h-6 text-lime-green" />
              </div>
              <div>
                <h2 className="text-2xl font-orbitron font-bold mb-4 text-lime-green">
                  Nosso Compromisso com sua Privacidade
                </h2>
                <p className="text-futuristic-gray font-roboto leading-relaxed mb-4">
                  O <span className="text-lime-green font-semibold">AIMindset</span> está comprometido em proteger e respeitar sua privacidade. 
                  Esta política explica de forma transparente como coletamos, usamos, armazenamos e protegemos suas informações pessoais 
                  quando você visita nosso site, se inscreve em nossa newsletter ou interage com nosso conteúdo.
                </p>
                <p className="text-futuristic-gray font-roboto leading-relaxed">
                  Seguimos rigorosamente a <span className="text-neon-purple font-semibold">Lei Geral de Proteção de Dados (LGPD)</span> e 
                  as melhores práticas internacionais de segurança da informação, garantindo que seus dados estejam sempre protegidos.
                </p>
                <div className="mt-6 p-4 bg-lime-green/10 rounded-lg border border-lime-green/20">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-lime-green" />
                    <p className="text-lime-green font-medium text-sm">
                      Certificado LGPD • Auditoria de Segurança Anual • Zero Vazamentos de Dados
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Data Collection Types */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-white">
            Tipos de <span className="gradient-text">Dados Coletados</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {dataTypes.map((type, index) => (
              <Card key={index} className="p-6 hover-lift glass-effect group">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 bg-${type.color}/20 rounded-full group-hover:bg-${type.color}/30 transition-colors`}>
                    <type.icon className={`w-8 h-8 text-${type.color}`} />
                  </div>
                </div>
                <h3 className="text-xl font-orbitron font-semibold mb-4 text-white text-center">
                  {type.title}
                </h3>
                <ul className="space-y-2">
                  {type.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2">
                      <div className={`w-2 h-2 bg-${type.color} rounded-full mt-2 flex-shrink-0`}></div>
                      <span className="text-futuristic-gray font-roboto text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Usage */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 p-3 bg-neon-purple/20 rounded-full">
                <Users className="w-6 h-6 text-neon-purple" />
              </div>
              <div>
                <h2 className="text-2xl font-orbitron font-bold mb-6 text-neon-purple">
                  Como Utilizamos Suas Informações
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-lime-green/5 border border-lime-green/20">
                      <CheckCircle className="w-5 h-5 text-lime-green mt-0.5" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Newsletter Personalizada</h3>
                        <p className="text-futuristic-gray font-roboto text-sm">
                          Envio de conteúdo semanal sobre IA adaptado aos seus interesses específicos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-neon-purple/5 border border-neon-purple/20">
                      <CheckCircle className="w-5 h-5 text-neon-purple mt-0.5" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Experiência Personalizada</h3>
                        <p className="text-futuristic-gray font-roboto text-sm">
                          Recomendações de artigos e conteúdo baseadas no seu histórico de leitura
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-electric-blue/5 border border-electric-blue/20">
                      <CheckCircle className="w-5 h-5 text-electric-blue mt-0.5" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Análise e Melhoria</h3>
                        <p className="text-futuristic-gray font-roboto text-sm">
                          Otimização da experiência do usuário e desenvolvimento de novos recursos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-lime-green/5 border border-lime-green/20">
                      <CheckCircle className="w-5 h-5 text-lime-green mt-0.5" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Suporte e Comunicação</h3>
                        <p className="text-futuristic-gray font-roboto text-sm">
                          Resposta a dúvidas, feedback e suporte técnico personalizado
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-primary-dark/50 rounded-lg border border-neon-purple/20">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-neon-purple mt-0.5" />
                    <div>
                      <p className="text-white font-medium mb-1">Importante:</p>
                      <p className="text-futuristic-gray text-sm">
                        Nunca compartilhamos, vendemos ou alugamos seus dados pessoais para terceiros. 
                        Todos os usos são estritamente limitados aos propósitos descritos acima.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-white">
            Medidas de <span className="gradient-text">Segurança</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityMeasures.map((measure, index) => (
              <Card key={index} className="p-6 text-center hover-lift glass-effect group">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-lime-green/20 rounded-full group-hover:bg-lime-green/30 transition-colors">
                    <measure.icon className="w-8 h-8 text-lime-green" />
                  </div>
                </div>
                <h3 className="text-lg font-orbitron font-semibold mb-2 text-white">
                  {measure.title}
                </h3>
                <p className="text-futuristic-gray font-roboto text-sm leading-relaxed">
                  {measure.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Rights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-white">
            Seus <span className="gradient-text">Direitos</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {userRights.map((right, index) => (
              <Card key={index} className="p-6 hover-lift glass-effect group">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-neon-purple/20 rounded-full group-hover:bg-neon-purple/30 transition-colors">
                    <right.icon className="w-6 h-6 text-neon-purple" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-orbitron font-semibold text-white mb-2">
                      {right.title}
                    </h3>
                    <p className="text-futuristic-gray font-roboto text-sm leading-relaxed mb-4">
                      {right.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="group-hover:border-neon-purple group-hover:text-neon-purple transition-colors"
                    >
                      {right.action}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Card className="p-6 glass-effect">
              <p className="text-futuristic-gray font-roboto mb-4">
                Para exercer qualquer um dos seus direitos, entre em contato conosco através do email:
              </p>
              <p className="text-lime-green font-semibold text-lg">privacidade@aimindset.com</p>
              <p className="text-futuristic-gray text-sm mt-2">
                Resposta garantida em até 72 horas úteis conforme exigido pela LGPD
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Cookies Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <h2 className="text-2xl font-orbitron font-bold mb-6 text-neon-purple flex items-center">
              <Database className="w-6 h-6 mr-2" />
              Cookies e Tecnologias de Rastreamento
            </h2>
            <p className="text-futuristic-gray font-roboto leading-relaxed mb-6">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência de navegação, 
              analisar o tráfego do site e personalizar o conteúdo. Você tem controle total sobre essas configurações.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 bg-lime-green/10 rounded-lg border border-lime-green/20">
                <h3 className="text-lime-green font-orbitron font-semibold mb-2">Essenciais</h3>
                <p className="text-futuristic-gray text-sm">
                  Necessários para o funcionamento básico do site. Não podem ser desabilitados.
                </p>
              </div>
              <div className="p-4 bg-neon-purple/10 rounded-lg border border-neon-purple/20">
                <h3 className="text-neon-purple font-orbitron font-semibold mb-2">Analíticos</h3>
                <p className="text-futuristic-gray text-sm">
                  Ajudam a entender como os visitantes usam o site. Podem ser desabilitados.
                </p>
              </div>
              <div className="p-4 bg-electric-blue/10 rounded-lg border border-electric-blue/20">
                <h3 className="text-electric-blue font-orbitron font-semibold mb-2">Funcionais</h3>
                <p className="text-futuristic-gray text-sm">
                  Lembram suas preferências e configurações. Opcionais.
                </p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button variant="primary" size="lg" className="mr-4">
                Gerenciar Cookies
              </Button>
              <Button variant="outline" size="lg">
                Aceitar Todos
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Data Retention */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <h2 className="text-2xl font-orbitron font-bold mb-6 text-lime-green flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              Retenção e Exclusão de Dados
            </h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-orbitron font-semibold mb-3">Períodos de Retenção</h3>
                  <ul className="space-y-2 text-futuristic-gray font-roboto text-sm">
                    <li>• <strong>Newsletter:</strong> Até o cancelamento da inscrição</li>
                    <li>• <strong>Dados de contato:</strong> 5 anos após última interação</li>
                    <li>• <strong>Logs de acesso:</strong> 12 meses</li>
                    <li>• <strong>Cookies analíticos:</strong> 24 meses</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-orbitron font-semibold mb-3">Exclusão Automática</h3>
                  <ul className="space-y-2 text-futuristic-gray font-roboto text-sm">
                    <li>• Dados inativos por mais de 3 anos</li>
                    <li>• Contas não verificadas em 30 dias</li>
                    <li>• Logs de erro após 6 meses</li>
                    <li>• Backups após 30 dias</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 bg-neon-purple/10 rounded-lg border border-neon-purple/20">
                <p className="text-neon-purple font-medium mb-1">Exclusão Sob Demanda</p>
                <p className="text-futuristic-gray text-sm">
                  Você pode solicitar a exclusão imediata dos seus dados a qualquer momento. 
                  O processo é concluído em até 30 dias úteis.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 text-center glass-effect relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-lime-green/5 to-neon-purple/5"></div>
            <div className="relative">
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-lime-green/20 rounded-full">
                  <Mail className="w-8 h-8 text-lime-green" />
                </div>
              </div>
              <h2 className="text-2xl font-orbitron font-bold mb-4 text-lime-green">
                Dúvidas sobre Privacidade?
              </h2>
              <p className="text-futuristic-gray font-roboto leading-relaxed mb-6">
                Nossa equipe de proteção de dados está disponível para esclarecer qualquer dúvida 
                sobre esta política ou ajudá-lo a exercer seus direitos.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-primary-dark/50 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Contato Direto</h3>
                  <p className="text-lime-green font-medium">privacidade@aimindset.com</p>
                  <p className="text-futuristic-gray text-sm">Resposta em até 72h</p>
                </div>
                <div className="p-4 bg-primary-dark/50 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Encarregado de Dados</h3>
                  <p className="text-neon-purple font-medium">Dr. Ana Silva</p>
                  <p className="text-futuristic-gray text-sm">Certificada LGPD</p>
                </div>
              </div>
              <Button variant="primary" size="lg" className="hover-lift">
                <Mail className="mr-2 w-5 h-5" />
                Entrar em Contato
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Updates Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <h2 className="text-2xl font-orbitron font-bold mb-4 text-neon-purple flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2" />
              Atualizações desta Política
            </h2>
            <p className="text-futuristic-gray font-roboto leading-relaxed mb-4">
              Esta política de privacidade pode ser atualizada periodicamente para refletir mudanças 
              em nossas práticas, tecnologias ou por outros motivos operacionais, legais ou regulamentares.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white font-orbitron font-semibold mb-3">Como Você Será Notificado</h3>
                <ul className="space-y-2 text-futuristic-gray font-roboto text-sm">
                  <li>• Email para todos os inscritos na newsletter</li>
                  <li>• Banner de notificação no site</li>
                  <li>• Destaque na página inicial por 30 dias</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-orbitron font-semibold mb-3">Histórico de Versões</h3>
                <ul className="space-y-2 text-futuristic-gray font-roboto text-sm">
                  <li>• <strong>v2.1:</strong> Adição de seção sobre IA e ML</li>
                  <li>• <strong>v2.0:</strong> Adequação completa à LGPD</li>
                  <li>• <strong>v1.0:</strong> Versão inicial</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-lime-green/10 rounded-lg border border-lime-green/20">
              <p className="text-lime-green font-medium text-center">
                💡 Mudanças significativas sempre incluem um período de 30 dias para revisão antes da implementação
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Privacy;