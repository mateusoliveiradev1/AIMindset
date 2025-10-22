import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { CommentFormData } from '../../hooks/useComments';

interface CommentFormProps {
  onSubmit: (data: CommentFormData) => Promise<boolean>;
  submitting: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, submitting }) => {
  const [formData, setFormData] = useState<CommentFormData>({
    user_name: '',
    content: ''
  });
  const [errors, setErrors] = useState<Partial<CommentFormData>>({});

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
      setFormData({ user_name: '', content: '' });
      setErrors({});
    }
  };

  const handleInputChange = (field: keyof CommentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Deixe seu comentário
      </h3>
      
      <div className="space-y-4">
        {/* Campo Nome */}
        <div>
          <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome *
          </label>
          <input
            type="text"
            id="user_name"
            value={formData.user_name}
            onChange={(e) => handleInputChange('user_name', e.target.value)}
            disabled={submitting}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${errors.user_name 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
              }
            `}
            placeholder="Seu nome"
            maxLength={50}
          />
          {errors.user_name && (
            <p className="mt-1 text-xs text-red-600">{errors.user_name}</p>
          )}
        </div>

        {/* Campo Comentário */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Comentário *
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            disabled={submitting}
            rows={4}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm text-sm resize-vertical
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${errors.content 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
              }
            `}
            placeholder="Compartilhe sua opinião sobre este artigo..."
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.content ? (
              <p className="text-xs text-red-600">{errors.content}</p>
            ) : (
              <div />
            )}
            <span className="text-xs text-gray-500">
              {formData.content.length}/500
            </span>
          </div>
        </div>

        {/* Botão Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !formData.user_name.trim() || !formData.content.trim()}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-md font-medium text-sm
              transition-all duration-200
              ${submitting || !formData.user_name.trim() || !formData.content.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
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
                Enviar Comentário
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};