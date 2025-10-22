import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield, BarChart3, Settings } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
}

interface CookieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: CookiePreferences) => void;
  initialPreferences?: CookiePreferences;
}

const CookieModal: React.FC<CookieModalProps> = ({ isOpen, onClose, onSave, initialPreferences }) => {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    functional: false
  });

  useEffect(() => {
    // Usar preferências iniciais se fornecidas, senão carregar do localStorage
    if (initialPreferences) {
      setPreferences(initialPreferences);
    } else {
      const saved = localStorage.getItem('cookiePreferences');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPreferences({
            essential: true, // Sempre true
            analytics: parsed.analytics || false,
            functional: parsed.functional || false
          });
        } catch (error) {
          console.error('Erro ao carregar preferências de cookies:', error);
        }
      }
    }
  }, [isOpen, initialPreferences]);

  const handleSave = () => {
    onSave(preferences);
    onClose();
  };

  const handleToggle = (type: keyof CookiePreferences) => {
    if (type === 'essential') return; // Não pode desabilitar essenciais
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-effect">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-neon-purple/20 rounded-full">
                <Cookie className="w-6 h-6 text-neon-purple" />
              </div>
              <h2 className="text-2xl font-orbitron font-bold text-white">
                Gerenciar Cookies
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-futuristic-gray" />
            </button>
          </div>

          {/* Descrição */}
          <p className="text-futuristic-gray font-roboto mb-6 leading-relaxed">
            Personalize sua experiência escolhendo quais tipos de cookies você deseja aceitar. 
            Cookies essenciais são necessários para o funcionamento básico do site.
          </p>

          {/* Configurações de Cookies */}
          <div className="space-y-4">
            {/* Cookies Essenciais */}
            <div className="p-4 bg-lime-green/10 rounded-lg border border-lime-green/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-lime-green" />
                  <h3 className="text-white font-orbitron font-semibold">
                    Cookies Essenciais
                  </h3>
                </div>
                <div className="px-3 py-1 bg-lime-green/20 rounded-full text-lime-green text-sm font-medium">
                  Sempre Ativo
                </div>
              </div>
              <p className="text-futuristic-gray text-sm">
                Necessários para o funcionamento básico do site, incluindo navegação, 
                autenticação e segurança. Não podem ser desabilitados.
              </p>
            </div>

            {/* Cookies Analíticos */}
            <div className="p-4 bg-primary-dark/50 rounded-lg border border-neon-purple/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-neon-purple" />
                  <h3 className="text-white font-orbitron font-semibold">
                    Cookies Analíticos
                  </h3>
                </div>
                <button
                  onClick={() => handleToggle('analytics')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.analytics ? 'bg-neon-purple' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-futuristic-gray text-sm">
                Ajudam a entender como os visitantes usam o site, permitindo melhorias 
                na experiência do usuário e no conteúdo.
              </p>
            </div>

            {/* Cookies Funcionais */}
            <div className="p-4 bg-primary-dark/50 rounded-lg border border-electric-blue/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-electric-blue" />
                  <h3 className="text-white font-orbitron font-semibold">
                    Cookies Funcionais
                  </h3>
                </div>
                <button
                  onClick={() => handleToggle('functional')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.functional ? 'bg-electric-blue' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.functional ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-futuristic-gray text-sm">
                Lembram suas preferências e configurações para personalizar sua experiência, 
                como tema escolhido e configurações de idioma.
              </p>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-6 p-4 bg-primary-dark/30 rounded-lg border border-futuristic-gray/20">
            <h4 className="text-white font-semibold mb-2">Sobre os Cookies</h4>
            <p className="text-futuristic-gray text-sm leading-relaxed">
              Os cookies são pequenos arquivos de texto armazenados em seu dispositivo 
              quando você visita um site. Eles nos ajudam a fornecer uma melhor experiência 
              e não contêm informações pessoais identificáveis.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSave}
              className="flex-1"
            >
              Salvar Preferências
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setPreferences({ essential: true, analytics: true, functional: true });
                onSave({ essential: true, analytics: true, functional: true });
                onClose();
              }}
              className="flex-1"
            >
              Aceitar Todos
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieModal;