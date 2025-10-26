import React, { useState, useEffect } from 'react';
import { X, Send, Clock, Eye, Save, Mail, FileText, Calendar, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CampaignDraft, CampaignTemplate } from '../../hooks/useNewsletter';

interface CampaignEditorProps {
  isOpen: boolean;
  onClose: () => void;
  templates: CampaignTemplate[];
  onSendCampaign: (campaign: CampaignDraft) => Promise<{ success: boolean; data?: any; error?: any }>;
  onSendTestEmail: (email: string, subject: string, content: string) => Promise<{ success: boolean; data?: any; error?: any }>;
  onCreateTemplate: (template: Omit<CampaignTemplate, 'id' | 'created_at'>) => Promise<{ success: boolean; data?: any; error?: any }>;
  loading: boolean;
  subscribersCount: number;
}

export const CampaignEditor: React.FC<CampaignEditorProps> = ({
  isOpen,
  onClose,
  templates,
  onSendCampaign,
  onSendTestEmail,
  onCreateTemplate,
  loading,
  subscribersCount
}) => {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates'>('compose');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [sendImmediately, setSendImmediately] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSubject('');
      setContent('');
      setPreviewText('');
      setSelectedTemplate('');
      setSendImmediately(true);
      setScheduledDate('');
      setScheduledTime('');
      setTestEmail('');
      setShowPreview(false);
      setShowTemplateForm(false);
      setTemplateName('');
    }
  }, [isOpen]);

  // Load template content when selected
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(template.subject);
      setContent(template.content);
      setPreviewText(template.preview_text || '');
    }
  };

  // Handle campaign send
  const handleSendCampaign = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Assunto e conteúdo são obrigatórios');
      return;
    }

    if (!sendImmediately && (!scheduledDate || !scheduledTime)) {
      toast.error('Data e hora de agendamento são obrigatórias');
      return;
    }

    const scheduledAt = !sendImmediately 
      ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      : undefined;

    const campaignData: CampaignDraft = {
      subject,
      content,
      preview_text: previewText,
      template_id: selectedTemplate || undefined,
      scheduled_at: scheduledAt,
      send_immediately: sendImmediately
    };

    const result = await onSendCampaign(campaignData);
    if (result.success) {
      onClose();
    }
  };

  // Handle test email
  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error('Email de teste é obrigatório');
      return;
    }

    if (!subject.trim() || !content.trim()) {
      toast.error('Assunto e conteúdo são obrigatórios');
      return;
    }

    await onSendTestEmail(testEmail, subject, content);
  };

  // Handle template creation
  const handleCreateTemplate = async () => {
    if (!templateName.trim() || !subject.trim() || !content.trim()) {
      toast.error('Nome, assunto e conteúdo são obrigatórios');
      return;
    }

    const template = {
      name: templateName,
      subject,
      content,
      preview_text: previewText
    };

    const result = await onCreateTemplate(template);
    if (result.success) {
      setShowTemplateForm(false);
      setTemplateName('');
    }
  };

  // Get minimum date for scheduling (current date)
  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Get minimum time for scheduling (current time if today)
  const getMinTime = () => {
    if (scheduledDate === getMinDate()) {
      const now = new Date();
      return now.toTimeString().slice(0, 5);
    }
    return '00:00';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Mail className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Editor de Campanhas
            </h2>
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {subscribersCount} inscritos
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('compose')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'compose'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Compor</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Templates ({templates.length})</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'compose' ? (
              <div className="p-6 space-y-6">
                {/* Template Selection */}
                {templates.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usar Template (Opcional)
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione um template...</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assunto *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Digite o assunto da campanha..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Preview Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto de Preview
                  </label>
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Texto que aparece no preview do email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conteúdo *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Digite o conteúdo da campanha em HTML..."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Você pode usar HTML e variáveis como {'{'}name{'}'}, {'{'}email{'}'}, etc.
                  </p>
                </div>

                {/* Scheduling */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Agendamento</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="send-now"
                        name="scheduling"
                        checked={sendImmediately}
                        onChange={() => setSendImmediately(true)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="send-now" className="text-sm font-medium text-gray-700">
                        Enviar agora
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="schedule"
                        name="scheduling"
                        checked={!sendImmediately}
                        onChange={() => setSendImmediately(false)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="schedule" className="text-sm font-medium text-gray-700">
                        Agendar para depois
                      </label>
                    </div>

                    {!sendImmediately && (
                      <div className="ml-7 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data
                          </label>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={getMinDate()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hora
                          </label>
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            min={getMinTime()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Templates Tab */
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Templates Disponíveis
                  </h3>
                  <button
                    onClick={() => setShowTemplateForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Novo Template</span>
                  </button>
                </div>

                {showTemplateForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-medium text-gray-900 mb-4">Criar Novo Template</h4>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Nome do template..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCreateTemplate}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Salvar Template
                        </button>
                        <button
                          onClick={() => setShowTemplateForm(false)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <button
                          onClick={() => {
                            handleTemplateSelect(template.id);
                            setActiveTab('compose');
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Usar Template
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                      {template.preview_text && (
                        <p className="text-xs text-gray-500">{template.preview_text}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}

                  {templates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum template encontrado</p>
                      <p className="text-sm">Crie seu primeiro template para reutilizar em campanhas futuras</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-gray-50 p-6 space-y-6">
            {/* Preview */}
            <div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>{showPreview ? 'Ocultar' : 'Mostrar'} Preview</span>
              </button>

              {showPreview && (
                <div className="mt-4 border border-gray-200 rounded-lg bg-white p-4 max-h-60 overflow-y-auto">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 mb-2">
                      {subject || 'Sem assunto'}
                    </div>
                    {previewText && (
                      <div className="text-gray-600 text-xs mb-3 italic">
                        {previewText}
                      </div>
                    )}
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: content || '<p class="text-gray-400">Sem conteúdo</p>' 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Test Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enviar Teste
              </label>
              <div className="space-y-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendTest}
                  disabled={loading || !testEmail.trim()}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>Enviar Teste</span>
                </button>
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Informações da Campanha</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Destinatários:</span>
                  <span className="font-medium">{subscribersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">
                    {sendImmediately ? 'Envio Imediato' : 'Agendado'}
                  </span>
                </div>
                {!sendImmediately && scheduledDate && scheduledTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agendado para:</span>
                    <span className="font-medium text-xs">
                      {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSendCampaign}
                disabled={loading || !subject.trim() || !content.trim()}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {sendImmediately ? (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Enviar Campanha</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Agendar Campanha</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};