import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, AlertCircle, X, Check } from 'lucide-react';
import { useArticleScheduling } from '@/hooks/useArticleScheduling';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ArticleSchedulingProps {
  articleId: string;
  currentScheduledDate?: string;
  currentStatus?: string;
  onSchedule?: (data: any) => void;
  onCancel?: () => void;
  className?: string;
}

export const ArticleScheduling: React.FC<ArticleSchedulingProps> = ({
  articleId,
  currentScheduledDate,
  currentStatus,
  onSchedule,
  onCancel,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [hasConflict, setHasConflict] = useState(false);
  const [validationError, setValidationError] = useState('');

  const {
    loading,
    scheduleArticle,
    cancelScheduling,
    checkSchedulingConflicts,
    formatSchedulingDate,
    validateSchedulingDate
  } = useArticleScheduling();
  const { isAuthenticated } = useAuth();

  // Preencher data/hora atual + 1 hora como sugestão apenas quando modal abrir
  useEffect(() => {
    if (isOpen && !currentScheduledDate) {
      const suggestedDate = new Date();
      suggestedDate.setHours(suggestedDate.getHours() + 1);
      suggestedDate.setMinutes(Math.ceil(suggestedDate.getMinutes() / 5) * 5);
      setSelectedDate(format(suggestedDate, 'yyyy-MM-dd'));
      setSelectedTime(format(suggestedDate, 'HH:mm'));
    }
  }, [isOpen, currentScheduledDate]);

  // Verificar conflitos quando data/hora mudar
  useEffect(() => {
    if (!isOpen) return;
    if (selectedDate && selectedTime) {
      checkForConflicts();
    }
  }, [isOpen, selectedDate, selectedTime]);

  // Bloquear scroll do body enquanto modal estiver aberto e fechar com ESC
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [isOpen]);

  const checkForConflicts = async () => {
    if (!selectedDate || !selectedTime) return;
    
    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const conflicts = await checkSchedulingConflicts(
      scheduledDateTime.toISOString(),
      articleId
    );
    setHasConflict(conflicts);
  };

  const validateForm = () => {
    if (!selectedDate || !selectedTime) {
      setValidationError('Por favor, selecione data e hora');
      return false;
    }

    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const validation = validateSchedulingDate(scheduledDateTime.toISOString());
    
    if (!validation.valid) {
      setValidationError(validation.error || 'Data inválida');
      return false;
    }

    if (hasConflict) {
      setValidationError('Já existe um artigo agendado para este horário');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSchedule = async () => {
    if (!validateForm()) return;

    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const result = await scheduleArticle(articleId, {
      scheduled_for: scheduledDateTime.toISOString(),
      reason: reason || 'Agendamento via interface',
      metadata: {
        previousStatus: currentStatus,
        userAgent: navigator.userAgent
      }
    });

    if (result.success) {
      setIsOpen(false);
      onSchedule?.({
        scheduled_for: scheduledDateTime.toISOString(),
        reason
      });
    }
  };

  const handleCancel = async () => {
    const result = await cancelScheduling(articleId, 'Cancelado via interface');
    if (result.success) {
      setIsOpen(false);
      onCancel?.();
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'published':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'published':
        return 'Publicado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Rascunho';
    }
  };

  return (
    <div className={`article-scheduling ${className}`}>
      {/* Bloquear UI quando não houver ID (não salvo) */}
      {!articleId && (
        <div className="mb-4 p-3 rounded-lg border text-gray-700 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Salve o artigo primeiro para habilitar o agendamento.</span>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <div className="mb-4 p-3 rounded-lg border text-gray-700 bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Faça login para agendar a publicação.</span>
          </div>
        </div>
      )}
      {/* Status atual do agendamento */}
      {currentScheduledDate && currentStatus && (
        <div className={`mb-4 p-3 rounded-lg border ${getStatusColor(currentStatus)}`}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              {getStatusLabel(currentStatus)}: {formatSchedulingDate(currentScheduledDate)}
            </span>
          </div>
          {currentStatus === 'scheduled' && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setIsOpen(true)}
                className="text-sm px-3 py-1 bg-white border rounded hover:bg-gray-50"
              >
                Reagendar
              </button>
              <button
                onClick={handleCancel}
                className="text-sm px-3 py-1 bg-white border border-red-300 text-red-600 rounded hover:bg-red-50"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Botão para abrir modal de agendamento */}
      {!currentScheduledDate && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={!articleId || !isAuthenticated}
        >
          <Calendar className="w-4 h-4" />
          Agendar Publicação
        </button>
      )}

      {/* Modal de agendamento (portal) */}
      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]" aria-modal="true" role="dialog" data-modal="article-scheduling">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Agendar Publicação
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Seletor de data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Publicação
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Seletor de hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Motivo do agendamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Descreva o motivo do agendamento..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Alertas de validação */}
              {validationError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {validationError}
                </div>
              )}

              {hasConflict && (
                <div className="flex items-center gap-2 text-yellow-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Atenção: Já existe um artigo agendado para este horário
                </div>
              )}

              {/* Pré-visualização da data */}
              {selectedDate && selectedTime && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Data selecionada:</div>
                  <div className="font-medium text-gray-900">
                    {formatSchedulingDate(`${selectedDate}T${selectedTime}`)}
                  </div>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSchedule}
                disabled={loading || !selectedDate || !selectedTime}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Agendando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Agendar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};