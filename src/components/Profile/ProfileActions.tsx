import React from 'react';
import { Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../UI/Button';

interface ProfileActionsProps {
  onSave: () => void;
  onReset?: () => void;
  saving?: boolean;
  hasChanges?: boolean;
  message?: string;
  messageType?: 'success' | 'error' | 'info';
  disabled?: boolean;
  className?: string;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({
  onSave,
  onReset,
  saving = false,
  hasChanges = false,
  message,
  messageType = 'info',
  disabled = false,
  className
}) => {
  const getMessageIcon = () => {
    switch (messageType) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-lime-green" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getMessageColor = () => {
    switch (messageType) {
      case 'success':
        return 'text-lime-green';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-futuristic-gray';
    }
  };

  return (
    <div className={className}>
      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg border bg-dark-surface/30 ${
          messageType === 'success' ? 'border-lime-green/30' : 
          messageType === 'error' ? 'border-red-500/30' : 
          'border-neon-purple/20'
        }`}>
          <div className="flex items-center gap-2">
            {getMessageIcon()}
            <span className={`text-sm ${getMessageColor()}`}>{message}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={onSave}
          disabled={disabled || saving || !hasChanges}
          className="flex-1"
          size="lg"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
        
        {onReset && (
          <Button 
            onClick={onReset}
            variant="outline"
            disabled={disabled || saving || !hasChanges}
            size="lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Desfazer
          </Button>
        )}
      </div>

      {/* Changes Indicator */}
      {hasChanges && (
        <div className="mt-3 p-2 bg-lime-green/10 border border-lime-green/30 rounded-lg">
          <p className="text-xs text-lime-green flex items-center gap-2">
            <span className="w-2 h-2 bg-lime-green rounded-full animate-pulse" />
            Você tem alterações não salvas
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileActions;