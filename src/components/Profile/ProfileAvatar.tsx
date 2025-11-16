import React from 'react';
import { Camera, Upload, Trash2, ZoomIn } from 'lucide-react';
import { Card } from '../UI/Card';
import { AvatarImage } from '../Performance/ImageOptimizer';

interface ProfileAvatarProps {
  avatarUrl?: string;
  avatarPreview?: string | null;
  userName?: string;
  userEmail?: string;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarUpload: () => void;
  onAvatarRemove: () => void;
  avatarUploading?: boolean;
  avatarError?: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isDragging?: boolean;
  onDragStart: (event: React.MouseEvent) => void;
  onDragMove: (event: React.MouseEvent) => void;
  onDragEnd: () => void;
  offset: { x: number; y: number };
  className?: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarUrl,
  avatarPreview,
  userName,
  userEmail,
  onAvatarChange,
  onAvatarUpload,
  onAvatarRemove,
  avatarUploading = false,
  avatarError,
  zoom,
  onZoomChange,
  isDragging = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  offset,
  className
}) => {
  const getInitials = (name?: string, email?: string) => {
    const displayName = name || email || 'U';
    return displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayImage = avatarPreview || avatarUrl;

  return (
    <Card variant="neon" className={className}>
      <div className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-neon-purple" />
          Foto de Perfil
        </h3>
        
        {/* Avatar Display */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neon-purple/30 group-hover:border-neon-purple/50 transition-colors duration-300">
              {displayImage ? (
                <AvatarImage 
                  src={displayImage} 
                  alt="Avatar" 
                  size={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neon-purple/20 to-lime-green/20 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {getInitials(userName, userEmail)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Hover Effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-purple/10 to-lime-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-sm text-futuristic-gray">Clique para alterar</p>
            <p className="text-xs text-futuristic-gray/70">Formatos: JPG, PNG, WebP (máx. 2MB)</p>
          </div>
        </div>

        {/* File Input */}
        <div className="mb-4">
          <input 
            type="file" 
            accept="image/png,image/jpeg,image/webp" 
            capture="environment"
            onChange={onAvatarChange}
            className="hidden"
            id="avatar-upload"
            disabled={avatarUploading}
          />
          <label 
            htmlFor="avatar-upload"
            className="cursor-pointer inline-flex items-center justify-center w-full px-4 py-2 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white hover:bg-dark-surface/70 hover:border-neon-purple/50 transition-all duration-300"
          >
            <Upload className="w-4 h-4 mr-2" />
            Escolher Imagem
          </label>
        </div>

        {/* Zoom Control */}
        {avatarPreview && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-futuristic-gray flex items-center gap-2">
                <ZoomIn className="w-4 h-4" />
                Zoom
              </label>
              <span className="text-xs text-futuristic-gray">{zoom.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min={1} 
              max={3} 
              step={0.01} 
              value={zoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-full h-2 bg-dark-surface/50 rounded-lg appearance-none cursor-pointer slider-neon"
              disabled={avatarUploading}
            />
          </div>
        )}

        {/* Avatar Preview with Crop */}
        {avatarPreview && (
          <div className="mb-4">
            <Card variant="glass" className="p-3">
              <div 
                className="relative w-full h-40 overflow-hidden rounded-lg border-2 border-dashed border-neon-purple/30 cursor-move"
                onMouseDown={onDragStart}
                onMouseMove={onDragMove}
                onMouseUp={onDragEnd}
                onMouseLeave={onDragEnd}
              >
                <img 
                  src={avatarPreview} 
                  alt="Pré-visualização" 
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ 
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'center center'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-lime-green/5 pointer-events-none" />
              </div>
              <p className="text-xs text-futuristic-gray text-center mt-2">Arraste para ajustar a posição</p>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onAvatarUpload}
            disabled={!avatarPreview || avatarUploading}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-neon-purple text-white rounded-lg hover:bg-neon-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {avatarUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </button>
          
          <button
            onClick={onAvatarRemove}
            disabled={avatarUploading || !avatarUrl}
            className="inline-flex items-center justify-center px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-red-600/30"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Error Message */}
        {avatarError && (
          <div className="mt-3 p-3 bg-red-600/10 border border-red-600/30 rounded-lg">
            <p className="text-red-400 text-sm">{avatarError}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfileAvatar;