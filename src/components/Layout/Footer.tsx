import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Mail, Twitter, Linkedin, Github, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    content: [
      { name: 'IA & Tecnologia', href: '/categoria/ia-tecnologia' },
      { name: 'Produtividade', href: '/categoria/produtividade' },
      { name: 'Futuro', href: '/categoria/futuro' },
      { name: 'Todos os Artigos', href: '/artigos' },
    ],
    company: [
      { name: 'Sobre', href: '/sobre' },
      { name: 'Newsletter', href: '/newsletter' },
      { name: 'Contato', href: '/contato' },
      { name: 'Política de Privacidade', href: '/politica-privacidade' },
    ],
    affiliates: [
      { name: 'ChatGPT Plus', href: 'https://chat.openai.com/', external: true },
      { name: 'Notion AI', href: 'https://www.notion.so/product/ai', external: true },
      { name: 'Midjourney', href: 'https://www.midjourney.com/', external: true },
      { name: 'Claude Pro', href: 'https://claude.ai/', external: true },
    ],
  };

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: 'https://x.com/AIMindset_BR' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/in/mateus-oliveira-430659281/' },
    { name: 'GitHub', icon: Github, href: 'https://github.com/mateusoliveiradev1' },
    { name: 'Email', icon: Mail, href: 'mailto:contato@aimindset.com' },
  ];

  return (
    <footer className="bg-darker-surface border-t border-neon-purple/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 group mb-4">
              <div className="relative">
                <Brain className="h-8 w-8 text-lime-green group-hover:animate-pulse-neon transition-all duration-300" />
                <div className="absolute inset-0 bg-lime-green/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
              </div>
              <span className="font-orbitron font-bold text-xl gradient-text">
                AIMindset
              </span>
            </Link>
            <p className="text-futuristic-gray font-roboto text-sm mb-6 leading-relaxed">
              Explorando o futuro da inteligência artificial e tecnologia. 
              Conteúdo especializado para profissionais e entusiastas.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                const isExternal = social.name !== 'Email';
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="p-2 text-futuristic-gray hover:text-lime-green transition-all duration-300 hover-lift neon-border rounded-lg"
                    aria-label={social.name}
                    {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Content Links */}
          <div>
            <h3 className="font-montserrat font-semibold text-white mb-4">Conteúdo</h3>
            <ul className="space-y-2">
              {footerLinks.content.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-futuristic-gray hover:text-lime-green transition-colors duration-300 font-roboto text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-montserrat font-semibold text-white mb-4">Empresa</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-futuristic-gray hover:text-lime-green transition-colors duration-300 font-roboto text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Affiliate Links */}
          <div>
            <h3 className="font-montserrat font-semibold text-white mb-4">Ferramentas Recomendadas</h3>
            <ul className="space-y-2">
              {footerLinks.affiliates.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-futuristic-gray hover:text-lime-green transition-colors duration-300 font-roboto text-sm flex items-center space-x-1"
                  >
                    <span>{link.name}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="mt-12 pt-8 border-t border-neon-purple/20">
          <div className="glass-effect rounded-lg p-6 text-center">
            <h3 className="font-montserrat font-semibold text-white text-lg mb-2">
              Fique por dentro das novidades em IA
            </h3>
            <p className="text-futuristic-gray font-roboto text-sm mb-4">
              Receba insights exclusivos e as últimas tendências em inteligência artificial
            </p>
            <Link
              to="/newsletter"
              className="inline-flex items-center px-6 py-3 bg-neon-gradient text-white font-montserrat font-semibold rounded-lg hover:shadow-lg hover:shadow-neon-purple/25 transition-all duration-300 hover-lift"
            >
              <Mail className="h-4 w-4 mr-2" />
              Assinar Newsletter
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-neon-purple/20 flex flex-col md:flex-row justify-between items-center">
          <p className="text-futuristic-gray font-roboto text-sm">
            © {currentYear} AIMindset. Todos os direitos reservados.
          </p>
          <p className="text-futuristic-gray font-roboto text-sm mt-2 md:mt-0">
            Desenvolvido com ❤️ para o futuro da IA
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;