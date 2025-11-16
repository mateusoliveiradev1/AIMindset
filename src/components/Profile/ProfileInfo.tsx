import React from 'react';
import { Mail, User, FileText, Globe } from 'lucide-react';
import { Card } from '../UI/Card';

interface ProfileInfoProps {
  email: string;
  name: string;
  fullName: string;
  bio: string;
  onNameChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  nameError?: string;
  fullNameError?: string;
  bioError?: string;
  className?: string;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  email,
  name,
  fullName,
  bio,
  onNameChange,
  onFullNameChange,
  onBioChange,
  nameError,
  fullNameError,
  bioError,
  className
}) => {
  return (
    <Card variant="glass" className={className}>
      <div className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-lime-green" />
          Informações Pessoais
        </h3>

        <div className="space-y-4">
          {/* Email Field - Read Only */}
          <div>
            <label className="block text-sm font-medium text-futuristic-gray mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              value={email}
              readOnly
              className="w-full px-4 py-3 bg-dark-surface/30 border border-neon-purple/20 rounded-lg text-white cursor-not-allowed opacity-75"
              placeholder="seu@email.com"
            />
            <p className="text-xs text-futuristic-gray/70 mt-1">Email não pode ser alterado</p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-futuristic-gray mb-2">
              Nome Exibido
            </label>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={`w-full px-4 py-3 bg-dark-surface/50 border rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green focus:ring-1 focus:ring-lime-green transition-all duration-300 ${
                nameError ? 'border-red-500' : 'border-neon-purple/30'
              }`}
              placeholder="Como você quer ser chamado"
              aria-label="Nome exibido"
            />
            {nameError && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <span className="text-red-400">⚠</span> {nameError}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-futuristic-gray mb-2">
              Nome Completo
            </label>
            <input
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              className={`w-full px-4 py-3 bg-dark-surface/50 border rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green focus:ring-1 focus:ring-lime-green transition-all duration-300 ${
                fullNameError ? 'border-red-500' : 'border-neon-purple/30'
              }`}
              placeholder="Seu nome completo"
              aria-label="Nome completo"
            />
            {fullNameError && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <span className="text-red-400">⚠</span> {fullNameError}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-futuristic-gray mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              className={`w-full px-4 py-3 bg-dark-surface/50 border rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green focus:ring-1 focus:ring-lime-green resize-none transition-all duration-300 ${
                bioError ? 'border-red-500' : 'border-neon-purple/30'
              }`}
              placeholder="Conte um pouco sobre você..."
              rows={3}
              maxLength={280}
              aria-label="Bio"
            />
            <div className="flex justify-between items-center mt-1">
              {bioError ? (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <span className="text-red-400">⚠</span> {bioError}
                </p>
              ) : (
                <div />
              )}
              <p className="text-xs text-futuristic-gray/70">
                {bio.length}/280 caracteres
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileInfo;