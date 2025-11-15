import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useMobileUsability } from '../../hooks/useMobileUsability';
import type { CommentFormData } from '../../hooks/useComments';
import { useAuth } from '../../contexts/AuthContext';

interface CommentFormProps {
  onSubmit: (data: CommentFormData) => Promise<boolean>;
  submitting: boolean;
  parentId?: string;
  placeholder?: string;
  compact?: boolean;
  replyingToName?: string;
  autoFocus?: boolean;
  articleId?: string;
  onCancel?: () => void;
  mentionSuggestions?: string[];
}

export const CommentForm: React.FC<CommentFormProps> = ({ 
  onSubmit, 
  submitting, 
  parentId, 
  placeholder = "Compartilhe sua opinião sobre este artigo...",
  compact = false,
  replyingToName,
  autoFocus = false,
  articleId,
  onCancel,
  mentionSuggestions = []
}) => {
  const [formData, setFormData] = useState<CommentFormData>({
    user_name: '',
    content: '',
    parent_id: parentId
  });
  const [errors, setErrors] = useState<Partial<CommentFormData>>({});
  const { isTouchDevice, addTouchFeedback } = useMobileUsability();
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const { isAuthenticated, supabaseUser } = useAuth();
  const saveTimeoutRef = useRef<number | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);

  const draftKey = React.useMemo(() => {
    const aid = articleId || '';
    const pid = parentId || 'root';
    return `commentDraft:${aid}:${pid}`;
  }, [articleId, parentId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CommentFormData> = {};

    if (!isAuthenticated) {
      if (!formData.user_name.trim()) {
        newErrors.user_name = 'Nome é obrigatório';
      } else if (formData.user_name.trim().length < 2) {
        newErrors.user_name = 'Nome deve ter pelo menos 2 caracteres';
      } else if (formData.user_name.trim().length > 50) {
        newErrors.user_name = 'Nome deve ter no máximo 50 caracteres';
      } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formData.user_name.trim())) {
        newErrors.user_name = 'Nome deve conter apenas letras e espaços';
      }
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
    try {
      const key = `commentSubmitTs:${articleId || ''}:${parentId || 'root'}`;
      const lastStr = localStorage.getItem(key);
      const last = lastStr ? parseInt(lastStr) : 0;
      const now = Date.now();
      const minInterval = 8000;
      if (last && now - last < minInterval) {
        setErrors(prev => ({ ...prev, content: `Aguarde ${Math.ceil((minInterval - (now - last))/1000)}s para enviar novamente` }));
        return;
      }
      const windowKey = `commentSubmitsWindow:${articleId || ''}:${parentId || 'root'}`;
      const raw = localStorage.getItem(windowKey);
      const arr: number[] = Array.isArray(raw ? JSON.parse(raw) : []) ? JSON.parse(raw) : [];
      const oneMin = 60 * 1000;
      const oneHour = 60 * 60 * 1000;
      const filtered = arr.filter(ts => now - ts < oneHour);
      const perMin = filtered.filter(ts => now - ts < oneMin).length;
      const perHour = filtered.length;
      if (perMin >= 3) {
        setErrors(prev => ({ ...prev, content: 'Limite de 3 envios por minuto atingido' }));
        return;
      }
      if (perHour >= 10) {
        setErrors(prev => ({ ...prev, content: 'Limite de 10 envios por hora atingido' }));
        return;
      }
      try { localStorage.setItem(windowKey, JSON.stringify([...filtered, now])); } catch {}
    } catch {}
    
    if (!validateForm()) {
      return;
    }

    const success = await onSubmit({
      ...formData,
      user_name: isAuthenticated ? (() => {
        const meta: any = supabaseUser?.user_metadata || {};
        let preferred = '';
        try {
          const key = `aimindset.preferred_name:${supabaseUser?.email || ''}`;
          preferred = localStorage.getItem(key) || '';
        } catch {}
        return preferred || meta.name || meta.full_name || supabaseUser?.email?.split('@')[0] || formData.user_name.trim();
      })() : formData.user_name.trim()
    });
    if (success) {
      try { localStorage.removeItem(draftKey); } catch {}
      try { localStorage.setItem(`commentSubmitTs:${articleId || ''}:${parentId || 'root'}`, String(Date.now())); } catch {}
      const meta: any = supabaseUser?.user_metadata || {};
      let preferred = '';
      try {
        const key = `aimindset.preferred_name:${supabaseUser?.email || ''}`;
        preferred = localStorage.getItem(key) || '';
      } catch {}
      const authedName = preferred || meta.name || meta.full_name || supabaseUser?.email?.split('@')[0] || '';
      setFormData({ user_name: isAuthenticated ? authedName : '', content: '', parent_id: parentId });
      setErrors({});
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
    }
  };

  // Adicionar feedback tátil ao botão de submit
  useEffect(() => {
    if (isTouchDevice && submitButtonRef.current) {
      addTouchFeedback(submitButtonRef.current);
    }
  }, [isTouchDevice, addTouchFeedback]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      try {
        textareaRef.current.focus();
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {}
    }
  }, [autoFocus]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const content = typeof parsed?.content === 'string' ? parsed.content : '';
        const userName = typeof parsed?.user_name === 'string' ? parsed.user_name : '';
        setFormData(prev => ({ ...prev, content, user_name: isAuthenticated ? prev.user_name : userName }));
      }
    } catch {}
  }, [draftKey, isAuthenticated]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        const payload = {
          content: formData.content,
          user_name: isAuthenticated ? undefined : formData.user_name
        };
        localStorage.setItem(draftKey, JSON.stringify(payload));
      } catch {}
    }, 400);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData.content, formData.user_name, draftKey, isAuthenticated]);

  const handleInputChange = (field: keyof CommentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (field === 'content') {
      const selStart = textareaRef.current ? textareaRef.current.selectionStart : value.length;
      const upto = value.slice(0, selStart);
      const at = upto.lastIndexOf('@');
      const space = upto.lastIndexOf(' ');
      if (at > -1 && (space < at)) {
        const query = upto.slice(at + 1).trim();
        let selfName = '';
        try {
          if (isAuthenticated) {
            const meta: any = supabaseUser?.user_metadata || {};
            const key = `aimindset.preferred_name:${supabaseUser?.email || ''}`;
            const preferred = localStorage.getItem(key) || '';
            selfName = preferred || meta.name || meta.full_name || (supabaseUser?.email?.split('@')[0] || '').trim();
          } else {
            selfName = (formData.user_name || '').trim();
          }
        } catch {}
        const lowerSelf = selfName.toLowerCase();
        const list = mentionSuggestions
          .filter(n => n && n.toLowerCase().startsWith(query.toLowerCase()))
          .filter(n => n.toLowerCase() !== lowerSelf)
          .slice(0, 5);
        setMentionQuery(query);
        setFilteredSuggestions(list);
        setMentionIndex(0);
        setMentionOpen(list.length > 0);
      } else {
        setMentionOpen(false);
        setMentionQuery('');
        setFilteredSuggestions([]);
        setMentionIndex(0);
      }
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && onCancel) {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (!mentionOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex(i => Math.min(i + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selStart = textareaRef.current ? textareaRef.current.selectionStart : formData.content.length;
      const upto = formData.content.slice(0, selStart);
      const at = upto.lastIndexOf('@');
      const before = formData.content.slice(0, at);
      const after = formData.content.slice(selStart);
      const chosen = filteredSuggestions[mentionIndex] || mentionQuery;
      const inserted = `${before}@${chosen} ${after}`;
      setFormData(prev => ({ ...prev, content: inserted }));
      setMentionOpen(false);
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const meta: any = supabaseUser?.user_metadata || {};
      let preferred = '';
      try {
        const key = `aimindset.preferred_name:${supabaseUser?.email || ''}`;
        preferred = localStorage.getItem(key) || '';
      } catch {}
      const authedName = preferred || meta.name || meta.full_name || supabaseUser?.email?.split('@')[0] || '';
      setFormData(prev => ({ ...prev, user_name: authedName }));
    }
  }, [isAuthenticated, supabaseUser]);

  return (
    <form onSubmit={handleSubmit} aria-busy={submitting} className={`bg-darker-surface/30 backdrop-blur-sm border border-neon-purple/20 hover:border-neon-purple/40 transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/10 rounded-lg mobile-form ${compact ? 'p-4' : 'p-6'}`}>
      {!compact && (
        <h3 className="text-lg font-semibold font-orbitron text-white mb-4 bg-gradient-to-r from-neon-purple to-lime-green bg-clip-text text-transparent">
          {parentId ? 'Responder comentário' : 'Deixe seu comentário'}
        </h3>
      )}
      {parentId && replyingToName && (
        <div className={`inline-flex items-center gap-2 text-xs rounded-full border px-3 py-1 mb-3 ${compact ? 'border-neon-purple/30 bg-darker-surface/20 text-white' : 'border-neon-purple/20 text-futuristic-gray'}`}>
          <span>Respondendo a</span>
          <span className="font-medium text-white">{replyingToName}</span>
        </div>
      )}
      
      <div className="space-y-4">
        {submitted && (
          <div className="flex items-center justify-center text-xs text-lime-green bg-darker-surface/20 rounded-md p-2 border border-lime-green/20" role="status" aria-live="polite">
            <span>Comentário publicado com sucesso</span>
          </div>
        )}
        {!isAuthenticated && (
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
            aria-invalid={!!errors.user_name}
            aria-describedby={errors.user_name ? `error_user_name_${parentId || 'main'}` : undefined}
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
            <p id={`error_user_name_${parentId || 'main'}`} className="mt-1 text-xs text-red-400">{errors.user_name}</p>
          )}
          </div>
        )}

        {/* Campo Comentário */}
        <div className="mobile-form-field">
          <label htmlFor={`content_${parentId || 'main'}`} className="block text-sm font-medium text-futuristic-gray mb-1">
            {parentId ? 'Resposta *' : 'Comentário *'}
          </label>
          <textarea
            id={`content_${parentId || 'main'}`}
            ref={textareaRef}
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            disabled={submitting}
            rows={compact ? 3 : 4}
            aria-invalid={!!errors.content}
            aria-describedby={errors.content ? `error_content_${parentId || 'main'}` : undefined}
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
          {mentionOpen && filteredSuggestions.length > 0 && (
            <div className={`mt-2 rounded-md border border-neon-purple/30 bg-black/40 backdrop-blur-sm`} role="listbox">
              {filteredSuggestions.map((s, idx) => (
                <button type="button" key={s} onMouseDown={(e) => { e.preventDefault(); const selStart = textareaRef.current ? textareaRef.current.selectionStart : formData.content.length; const upto = formData.content.slice(0, selStart); const at = upto.lastIndexOf('@'); const before = formData.content.slice(0, at); const after = formData.content.slice(selStart); const inserted = `${before}@${s} ${after}`; setFormData(prev => ({ ...prev, content: inserted })); setMentionOpen(false); }} className={`w-full text-left px-3 py-2 text-xs ${idx === mentionIndex ? 'bg-neon-purple/20 text-white' : 'text-futuristic-gray hover:text-white hover:bg-neon-purple/10'}`}>{s}</button>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center mt-1">
            {errors.content ? (
              <p id={`error_content_${parentId || 'main'}`} className="text-xs text-red-400">{errors.content}</p>
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
            disabled={submitting || (!isAuthenticated && !formData.user_name.trim()) || !formData.content.trim()}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-md font-medium text-sm
              transition-all duration-300 transform touch-target touch-feedback action-button
              ${submitting || (!isAuthenticated && !formData.user_name.trim()) || !formData.content.trim()
                ? 'bg-darker-surface/50 text-futuristic-gray/50 cursor-not-allowed border border-futuristic-gray/20'
                : 'bg-gradient-to-r from-neon-purple to-lime-green text-white hover:from-neon-purple/80 hover:to-lime-green/80 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-neon-purple/20'
              }
            `}
            aria-label={parentId ? 'Enviar resposta' : 'Enviar comentário'}
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
          {parentId && onCancel && (
            <button onClick={onCancel} className="ml-2 px-3 py-2 text-xs rounded-md border border-white/10 text-futuristic-gray hover:bg-white/5" aria-label="Cancelar resposta">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
