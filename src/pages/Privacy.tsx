import React from 'react';
import { Shield, Eye, Lock, Users, FileText, Mail } from 'lucide-react';
import Card from '../components/UI/Card';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary-dark text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-neon-gradient rounded-full">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-montserrat font-bold mb-6 bg-gradient-to-r from-lime-green to-neon-purple bg-clip-text text-transparent">
            Política de Privacidade
          </h1>
          <p className="text-xl md:text-2xl text-futuristic-gray font-roboto leading-relaxed">
            Transparência e proteção dos seus dados pessoais
          </p>
          <p className="text-sm text-futuristic-gray mt-4">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 p-3 bg-lime-green/20 rounded-full">
                <FileText className="w-6 h-6 text-lime-green" />
              </div>
              <div>
                <h2 className="text-2xl font-montserrat font-bold mb-4 text-lime-green">
                  Introdução
                </h2>
                <p className="text-futuristic-gray font-roboto leading-relaxed">
                  O AIMindset está comprometido em proteger e respeitar sua privacidade. Esta política 
                  explica como coletamos, usamos e protegemos suas informações pessoais quando você 
                  visita nosso site ou se inscreve em nossa newsletter.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Data Collection */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 p-3 bg-neon-purple/20 rounded-full">
                <Eye className="w-6 h-6 text-neon-purple" />
              </div>
              <div>
                <h2 className="text-2xl font-montserrat font-bold mb-6 text-neon-purple">
                  Informações que Coletamos
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-montserrat font-semibold text-white mb-3">
                      Informações Fornecidas Voluntariamente
                    </h3>
                    <ul className="space-y-2 text-futuristic-gray font-roboto">
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-lime-green rounded-full mt-2 flex-shrink-0"></div>
                        <span>Nome e endereço de e-mail ao se inscrever na newsletter</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-lime-green rounded-full mt-2 flex-shrink-0"></div>
                        <span>Comentários e feedback enviados através de formulários de contato</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-lime-green rounded-full mt-2 flex-shrink-0"></div>
                        <span>Preferências de conteúdo e interesses em IA</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-montserrat font-semibold text-white mb-3">
                      Informações Coletadas Automaticamente
                    </h3>
                    <ul className="space-y-2 text-futuristic-gray font-roboto">
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-neon-purple rounded-full mt-2 flex-shrink-0"></div>
                        <span>Endereço IP e informações do dispositivo</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-neon-purple rounded-full mt-2 flex-shrink-0"></div>
                        <span>Dados de navegação e páginas visitadas</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-neon-purple rounded-full mt-2 flex-shrink-0"></div>
                        <span>Tempo de permanência no site e padrões de uso</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Data Usage */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 p-3 bg-lime-green/20 rounded-full">
                <Users className="w-6 h-6 text-lime-green" />
              </div>
              <div>
                <h2 className="text-2xl font-montserrat font-bold mb-6 text-lime-green">
                  Como Usamos Suas Informações
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-lime-green rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-futuristic-gray font-roboto">
                      <strong className="text-white">Newsletter:</strong> Enviar conteúdo semanal sobre IA e tecnologia
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-lime-green rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-futuristic-gray font-roboto">
                      <strong className="text-white">Personalização:</strong> Adaptar o conteúdo aos seus interesses
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-lime-green rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-futuristic-gray font-roboto">
                      <strong className="text-white">Análise:</strong> Melhorar a experiência do usuário e o conteúdo
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-lime-green rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-futuristic-gray font-roboto">
                      <strong className="text-white">Comunicação:</strong> Responder a dúvidas e feedback
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Data Protection */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 p-3 bg-neon-purple/20 rounded-full">
                <Lock className="w-6 h-6 text-neon-purple" />
              </div>
              <div>
                <h2 className="text-2xl font-montserrat font-bold mb-6 text-neon-purple">
                  Proteção de Dados
                </h2>
                <div className="space-y-4">
                  <p className="text-futuristic-gray font-roboto leading-relaxed">
                    Implementamos medidas de segurança técnicas e organizacionais apropriadas para 
                    proteger suas informações pessoais contra acesso não autorizado, alteração, 
                    divulgação ou destruição.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h3 className="text-lg font-montserrat font-semibold text-white mb-3">
                        Medidas Técnicas
                      </h3>
                      <ul className="space-y-2 text-futuristic-gray font-roboto text-sm">
                        <li>• Criptografia SSL/TLS</li>
                        <li>• Armazenamento seguro de dados</li>
                        <li>• Acesso restrito aos dados</li>
                        <li>• Monitoramento de segurança</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-montserrat font-semibold text-white mb-3">
                        Medidas Organizacionais
                      </h3>
                      <ul className="space-y-2 text-futuristic-gray font-roboto text-sm">
                        <li>• Políticas de privacidade internas</li>
                        <li>• Treinamento da equipe</li>
                        <li>• Auditorias regulares</li>
                        <li>• Controle de acesso</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* User Rights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12">
            <h2 className="text-2xl font-montserrat font-bold mb-6 text-lime-green">
              Seus Direitos
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                    Acesso e Portabilidade
                  </h3>
                  <p className="text-futuristic-gray font-roboto text-sm">
                    Solicitar uma cópia dos dados pessoais que mantemos sobre você.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                    Retificação
                  </h3>
                  <p className="text-futuristic-gray font-roboto text-sm">
                    Corrigir informações imprecisas ou incompletas.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                    Exclusão
                  </h3>
                  <p className="text-futuristic-gray font-roboto text-sm">
                    Solicitar a exclusão dos seus dados pessoais.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                    Limitação
                  </h3>
                  <p className="text-futuristic-gray font-roboto text-sm">
                    Restringir o processamento dos seus dados pessoais.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                    Oposição
                  </h3>
                  <p className="text-futuristic-gray font-roboto text-sm">
                    Opor-se ao processamento dos seus dados pessoais.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                    Cancelamento
                  </h3>
                  <p className="text-futuristic-gray font-roboto text-sm">
                    Cancelar a inscrição na newsletter a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Cookies */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12">
            <h2 className="text-2xl font-montserrat font-bold mb-6 text-neon-purple">
              Cookies e Tecnologias Similares
            </h2>
            <p className="text-futuristic-gray font-roboto leading-relaxed mb-6">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência de navegação, 
              analisar o tráfego do site e personalizar o conteúdo.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-montserrat font-semibold text-white mb-2">
                  Tipos de Cookies
                </h3>
                <ul className="space-y-2 text-futuristic-gray font-roboto text-sm">
                  <li>• <strong>Essenciais:</strong> Necessários para o funcionamento básico do site</li>
                  <li>• <strong>Analíticos:</strong> Ajudam a entender como os visitantes usam o site</li>
                  <li>• <strong>Funcionais:</strong> Lembram suas preferências e configurações</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-lime-green/20 rounded-full">
                <Mail className="w-8 h-8 text-lime-green" />
              </div>
            </div>
            <h2 className="text-2xl font-montserrat font-bold mb-4 text-lime-green">
              Entre em Contato
            </h2>
            <p className="text-futuristic-gray font-roboto leading-relaxed mb-6">
              Se você tiver dúvidas sobre esta política de privacidade ou quiser exercer seus direitos, 
              entre em contato conosco:
            </p>
            <div className="space-y-2 text-futuristic-gray font-roboto">
              <p><strong className="text-white">E-mail:</strong> privacidade@aimindset.com</p>
              <p><strong className="text-white">Resposta:</strong> Até 72 horas úteis</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Updates */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12">
            <h2 className="text-2xl font-montserrat font-bold mb-4 text-neon-purple">
              Atualizações desta Política
            </h2>
            <p className="text-futuristic-gray font-roboto leading-relaxed">
              Esta política de privacidade pode ser atualizada periodicamente para refletir mudanças 
              em nossas práticas ou por outros motivos operacionais, legais ou regulamentares. 
              Notificaremos sobre mudanças significativas através do nosso site ou por e-mail.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Privacy;