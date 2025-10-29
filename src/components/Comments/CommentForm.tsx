import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useMobileUsability } from '../../hooks/useMobileUsability';
import type { CommentFormData } from '../../hooks/useComments';

interface CommentFormProps {
  onSubmit: (data: CommentFormData) => Promise<boolean>;
  submitting: boolean;
  parentId?: string;
  placeholder?: string;
  compact?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({ 
  onSubmit, 
  submitting, 
  parentId, 
  placeholder = "Compartilhe sua opinião sobre este artigo...",
  compact = false 
}) => {
  const [formData, setFormData] = useState<CommentFormData>({
    user_name: '',
    content: '',
    parent_id: parentId
  });
  const [errors, setErrors] = useState<Partial<CommentFormData>>({});
  const { isTouchDevice, addTouchFeedback } = useMobileUsability();
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<CommentFormData> = {};

    if (!formData.user_name.trim()) {
      newErrors.user_name = 'Nome é obrigatório';
    } else if (formData.user_name.trim().length < 2) {
      newErrors.user_name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.user_name.trim().length > 50) {
      newErrors.user_name = 'Nome deve ter no máximo 50 caracteres';
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formData.user_name.trim())) {
      newErrors.user_name = 'Nome deve conter apenas letras e espaços';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Comentário é obrigatório';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = 'Comentário deve ter pelo menos 10 caracteres';
    } else if (formData.content.trim().length > 500) {
      newErrors.content = 'Comentário deve ter no máximo 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      setFormData({ user_name: '', content: '', parent_id: parentId });
      setErrors({});
    }
  };

  // Adicionar feedback tátil ao botão de submit
  useEffect(() => {
    if (isTouchDevice && submitButtonRef.current) {
      addTouchFeedback(submitButtonRef.current);
    }
  }, [isTouchDevice, addTouchFeedback]);

  const handleInputChange = (field: keyof CommentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-darker-surface/30 backdrop-blur-sm border border-neon-purple/20 hover:border-neon-purple/40 transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/10 rounded-lg mobile-form ${compact ? 'p-4' : 'p-6'}`}>
      {!compact && (
        <h3 className="text-lg font-semibold font-orbitron text-white mb-4 bg-gradient-to-r from-neon-purple to-lime-green bg-clip-text text-transparent">
          {parentId ? 'Responder comentário' : 'Deixe seu comentário'}
        </h3>
      )}
      
      <div className="space-y-4">
        {/* Campo Nome */}
        <div className="mobile-form-field">
          <label htmlFor={`user_name_${parentId || 'main'}`} className="block text-sm font-medium text-futuristic-gray mb-1">
            Nome *
          </label>
          <input
            type="text"
            id={`user_name_${parentId || 'main'}`}
            value={formData.user_name}
            onChange={(e) => handleInputChange('user_name', e.target.value)}
            disabled={submitting}
            autoComplete="name"
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm text-sm bg-darker-surface/50 text-white placeholder-futuristic-gray/60
              focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-neon-purple
              disabled:bg-darker-surface/20 disabled:text-futuristic-gray/50 disabled:cursor-not-allowed
              transition-all duration-300 prevent-zoom touch-target
              ${errors.user_name 
                ? 'border-red-400/50 focus:ring-red-400 focus:border-red-400' 
                : 'border-neon-purple/30 hover:border-neon-purple/50'
              }
            `}
            placeholder="Seu nome"
            maxLength={50}
          />
          {errors.user_name && (
            <p className="mt-1 text-xs text-red-400">{errors.user_name}</p>
          )}
        </div>

        {/* Campo Comentário */}
        <div className="mobile-form-field">
          <label htmlFor={`content_${parentId || 'main'}`} className="block text-sm font-medium text-futuristic-gray mb-1">
            {parentId ? 'Resposta *' : 'Comentário *'}
          </label>
          <textarea
            id={`content_${parentId || 'main'}`}
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            disabled={submitting}
            rows={compact ? 3 : 4}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm text-sm resize-vertical bg-darker-surface/50 text-white placeholder-futuristic-gray/60
              focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-neon-purple
              disabled:bg-darker-surface/20 disabled:text-futuristic-gray/50 disabled:cursor-not-allowed
              transition-all duration-300 prevent-zoom touch-target
              ${errors.content 
                ? 'border-red-400/50 focus:ring-red-400 focus:border-red-400' 
                : 'border-neon-purple/30 hover:border-neon-purple/50'
              }
            `}
            placeholder={placeholder}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.content ? (
              <p className="text-xs text-red-400">{errors.content}</p>
            ) : (
              <div />
            )}
            <span className="text-xs text-futuristic-gray">
              {formData.content.length}/500
            </span>
          </div>
        </div>

        {/* Botão Submit */}
        <div className="flex justify-end">
          <button
            ref={submitButtonRef}
            type="submit"
            disabled={submitting || !formData.user_name.trim() || !formData.content.trim()}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-md font-medium text-sm
              transition-all duration-300 transform touch-target touch-feedback action-button
              ${submitting || !formData.user_name.trim() || !formData.content.trim()
                ? 'bg-darker-surface/50 text-futuristic-gray/50 cursor-not-allowed border border-futuristic-gray/20'
                : 'bg-gradient-to-r from-neon-purple to-lime-green text-white hover:from-neon-purple/80 hover:to-lime-green/80 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-neon-purple/20'
              }
            `}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {parentId ? 'Enviar Resposta' : 'Enviar Comentário'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};