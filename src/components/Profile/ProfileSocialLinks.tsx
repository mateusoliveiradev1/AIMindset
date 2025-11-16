import React from 'react';
import { Twitter, Instagram, Linkedin, Globe, ExternalLink } from 'lucide-react';
import { Card } from '../UI/Card';

interface ProfileSocialLinksProps {
  twitter: string;
  instagram: string;
  linkedin: string;
  website: string;
  onTwitterChange: (value: string) => void;
  onInstagramChange: (value: string) => void;
  onLinkedinChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  twitterError?: string;
  instagramError?: string;
  linkedinError?: string;
  websiteError?: string;
  className?: string;
}

const ProfileSocialLinks: React.FC<ProfileSocialLinksProps> = ({
  twitter,
  instagram,
  linkedin,
  website,
  onTwitterChange,
  onInstagramChange,
  onLinkedinChange,
  onWebsiteChange,
  twitterError,
  instagramError,
  linkedinError,
  websiteError,
  className
}) => {
  const socialFields = [
    {
      name: 'twitter',
      label: 'Twitter',
      placeholder: '@usuario ou URL',
      icon: Twitter,
      value: twitter,
      onChange: onTwitterChange,
      error: twitterError,
      color: 'text-blue-400'
    },
    {
      name: 'instagram',
      label: 'Instagram',
      placeholder: '@usuario ou URL',
      icon: Instagram,
      value: instagram,
      onChange: onInstagramChange,
      error: instagramError,
      color: 'text-pink-400'
    },
    {
      name: 'linkedin',
      label: 'LinkedIn',
      placeholder: 'URL do perfil',
      icon: Linkedin,
      value: linkedin,
      onChange: onLinkedinChange,
      error: linkedinError,
      color: 'text-blue-500'
    },
    {
      name: 'website',
      label: 'Website',
      placeholder: 'https://seusite.com',
      icon: Globe,
      value: website,
      onChange: onWebsiteChange,
      error: websiteError,
      color: 'text-lime-green'
    }
  ];

  const getSocialIcon = (IconComponent: React.ElementType, color: string) => (
    <IconComponent className={`w-4 h-4 ${color}`} />
  );

  return (
    <Card variant="default" className={className}>
      <div className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-neon-purple" />
          Links Sociais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialFields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.name}>
                <label className="block text-sm font-medium text-futuristic-gray mb-2 flex items-center gap-2">
                  {getSocialIcon(Icon, field.color)}
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-dark-surface/50 border rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green focus:ring-1 focus:ring-lime-green transition-all duration-300 ${
                      field.error ? 'border-red-500' : 'border-neon-purple/30'
                    }`}
                    placeholder={field.placeholder}
                    aria-label={field.label}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    {getSocialIcon(Icon, field.color)}
                  </div>
                  {field.value && (
                    <a
                      href={field.value.startsWith('@') ? `https://${field.name}.com/${field.value.slice(1)}` : field.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray hover:text-lime-green transition-colors duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {field.error && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="text-red-400">⚠</span> {field.error}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-dark-surface/30 rounded-lg border border-neon-purple/20">
          <p className="text-xs text-futuristic-gray flex items-start gap-2">
            <span className="text-lime-green">💡</span>
            <span>
              Dica: Use @usuario para perfis sociais ou cole a URL completa. 
              Exemplos: @meuusuario ou https://linkedin.com/in/meuusuario
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ProfileSocialLinks;