import React, { useState } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { 
  FileText, 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  Mail,
  Settings,
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  Calendar,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { useEmailTemplates, EmailTemplate, CreateEmailTemplateData } from '../../hooks/useEmailTemplates';

interface EmailTemplatesProps {
  onRefresh?: () => void;
}

export const EmailTemplates: React.FC<EmailTemplatesProps> = ({ onRefresh }) => {
  const {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    toggleTemplateStatus,
    duplicateTemplate,
    deleteTemplate,
    getTemplateStats
  } = useEmailTemplates();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | EmailTemplate['template_type']>('all');
  const [showPreview, setShowPreview] = useState<EmailTemplate | null>(null);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [showPreviewMode, setShowPreviewMode] = useState(false);

  // Estados para criação/edição
  const [formData, setFormData] = useState<CreateEmailTemplateData>({
    name: '',
    description: '',
    subject: '',
    content: '',
    template_type: 'custom',
    variables: [],
    is_active: true
  });

  const stats = getTemplateStats();

  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.template_type === filterType;
    return matchesSearch && matchesType;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      subject: '',
      content: '',
      template_type: 'custom',
      variables: [],
      is_active: true
    });
    setEditingTemplate(null);
    setShowVisualEditor(false);
    setShowPreviewMode(false);
  };

  // Função para inserir templates pré-definidos
  const insertTemplate = (type: string) => {
    const templates = {
      header: `<div style="text-align: center; padding: 20px; background-color: #f8f9fa;">
  <h1 style="color: #333; margin: 0;">{{nome_empresa}}</h1>
</div>`,
      paragraph: `<div style="padding: 20px;">
  <p style="color: #333; line-height: 1.6; margin: 0;">
    Olá {{nome_usuario}}, este é um parágrafo de exemplo.
  </p>
</div>`,
      button: `<div style="text-align: center; padding: 20px;">
  <a href="{{link_botao}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
    {{texto_botao}}
  </a>
</div>`,
      image: `<div style="text-align: center; padding: 20px;">
  <img src="{{url_imagem}}" alt="{{alt_imagem}}" style="max-width: 100%; height: auto; border-radius: 5px;">
</div>`,
      divider: `<div style="padding: 20px;">
  <hr style="border: none; height: 1px; background-color: #e9ecef;">
</div>`,
      footer: `<div style="text-align: center; padding: 20px; background-color: #f8f9fa; color: #666; font-size: 14px;">
  <p>© {{ano}} {{nome_empresa}}. Todos os direitos reservados.</p>
  <p>
    <a href="{{link_descadastro}}" style="color: #666;">Descadastrar</a>
  </p>
</div>`
    };

    const template = templates[type as keyof typeof templates];
    if (template) {
      setFormData(prev => ({
        ...prev,
        content: prev.content + '\n' + template
      }));
    }
  };

  // Handle create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.subject.trim() || !formData.content.trim()) {
      toast.error('Nome, assunto e conteúdo são obrigatórios');
      return;
    }

    let success = false;
    if (editingTemplate) {
      success = await updateTemplate(editingTemplate.id, formData);
    } else {
      const result = await createTemplate(formData);
      success = result !== null;
    }

    if (success) {
      setShowCreateModal(false);
      resetForm();
      onRefresh?.();
    }
  };

  // Handle edit
  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      content: template.content,
      template_type: template.template_type,
      variables: template.variables,
      is_active: template.is_active
    });
    setShowCreateModal(true);
  };

  // Handle duplicate
  const handleDuplicate = async (template: EmailTemplate) => {
    const result = await duplicateTemplate(template.id);
    if (result) {
      onRefresh?.();
    }
  };

  // Handle delete
  const handleDelete = async (template: EmailTemplate) => {
    if (window.confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) {
      const success = await deleteTemplate(template.id);
      if (success) {
        onRefresh?.();
      }
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (template: EmailTemplate) => {
    const success = await toggleTemplateStatus(template.id, template.is_active);
    if (success) {
      onRefresh?.();
    }
  };

  // Get template type label
  const getTypeLabel = (type: EmailTemplate['template_type']) => {
    const labels = {
      welcome: 'Boas-vindas',
      onboarding: 'Onboarding',
      newsletter: 'Newsletter',
      notification: 'Notificação',
      custom: 'Personalizado'
    };
    return labels[type];
  };

  // Get template type color
  const getTypeColor = (type: EmailTemplate['template_type']) => {
    const colors = {
      welcome: 'bg-green-500/20 text-green-400',
      onboarding: 'bg-blue-500/20 text-blue-400',
      newsletter: 'bg-purple-500/20 text-purple-400',
      notification: 'bg-yellow-500/20 text-yellow-400',
      custom: 'bg-gray-500/20 text-gray-400'
    };
    return colors[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="glass-effect p-6">
        <div className="text-center text-red-400">
          <p>Erro ao carregar templates: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Total</p>
                <p className="text-2xl font-orbitron font-bold text-white">
                  {stats.totalTemplates}
                </p>
              </div>
              <FileText className="w-8 h-8 text-lime-green" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Ativos</p>
                <p className="text-2xl font-orbitron font-bold text-white">
                  {stats.activeTemplates}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Inativos</p>
                <p className="text-2xl font-orbitron font-bold text-white">
                  {stats.inactiveTemplates}
                </p>
              </div>
              <Pause className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Newsletter</p>
                <p className="text-2xl font-orbitron font-bold text-white">
                  {stats.templatesByType.newsletter || 0}
                </p>
              </div>
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Controles */}
      <Card className="glass-effect">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green"
                />
              </div>

              {/* Filtro por tipo */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white focus:outline-none focus:border-lime-green"
              >
                <option value="all">Todos os tipos</option>
                <option value="welcome">Boas-vindas</option>
                <option value="onboarding">Onboarding</option>
                <option value="newsletter">Newsletter</option>
                <option value="notification">Notificação</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {/* Botão criar */}
            <Button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-lime-green hover:bg-lime-green/80 text-black font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="glass-effect">
            <div className="p-6">
              {/* Header do template */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white truncate">
                      {template.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(template.template_type)}`}>
                      {getTypeLabel(template.template_type)}
                    </span>
                  </div>
                  
                  {template.description && (
                    <p className="text-futuristic-gray text-sm mb-2 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  
                  <p className="text-futuristic-gray text-sm font-medium mb-2">
                    {template.subject}
                  </p>
                </div>

                {/* Status */}
                <div className={`w-3 h-3 rounded-full ${template.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
              </div>

              {/* Variáveis */}
              {template.variables.length > 0 && (
                <div className="mb-4">
                  <p className="text-futuristic-gray text-xs mb-2">Variáveis:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-1 bg-dark-gray/50 text-xs text-futuristic-gray rounded"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                    {template.variables.length > 3 && (
                      <span className="px-2 py-1 bg-dark-gray/50 text-xs text-futuristic-gray rounded">
                        +{template.variables.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Data de criação */}
              <div className="flex items-center gap-2 mb-4 text-futuristic-gray text-xs">
                <Calendar className="w-3 h-3" />
                {new Date(template.created_at).toLocaleDateString('pt-BR')}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowPreview(template)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>

                <Button
                  onClick={() => handleEdit(template)}
                  variant="outline"
                  size="sm"
                >
                  <Edit className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => handleDuplicate(template)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => handleToggleStatus(template)}
                  variant="outline"
                  size="sm"
                  className={template.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                >
                  {template.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <Button
                  onClick={() => handleDelete(template)}
                  variant="outline"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="glass-effect">
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-futuristic-gray mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-futuristic-gray mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro template de email'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="bg-lime-green hover:bg-lime-green/80 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Template
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Modal de criação/edição */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="glass-effect w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-orbitron font-bold text-white">
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </h2>
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  variant="outline"
                  size="sm"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Nome do Template *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green"
                      placeholder="Ex: Newsletter Semanal"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Tipo
                    </label>
                    <select
                      value={formData.template_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value as any }))}
                      className="w-full px-4 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white focus:outline-none focus:border-lime-green"
                    >
                      <option value="custom">Personalizado</option>
                      <option value="welcome">Boas-vindas</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="newsletter">Newsletter</option>
                      <option value="notification">Notificação</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green"
                    placeholder="Descreva o propósito deste template..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Assunto do Email *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green"
                    placeholder="Ex: {{newsletter_title}} - AIMindset"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Conteúdo HTML *
                  </label>
                  
                  {/* Editor Visual Toggle */}
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      type="button"
                      onClick={() => setShowVisualEditor(!showVisualEditor)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {showVisualEditor ? 'Editor HTML' : 'Editor Visual'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowPreviewMode(!showPreviewMode)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {showPreviewMode ? 'Editar' : 'Preview'}
                    </Button>
                  </div>

                  {showPreviewMode ? (
                    <div className="w-full min-h-[300px] p-4 bg-white rounded-lg border border-futuristic-gray/30">
                      <div dangerouslySetInnerHTML={{ __html: formData.content }} />
                    </div>
                  ) : showVisualEditor ? (
                    <div className="space-y-4">
                      {/* Toolbar Visual */}
                      <div className="flex flex-wrap gap-2 p-3 bg-darker-surface/30 rounded-lg border border-futuristic-gray/20">
                        <Button
                          type="button"
                          onClick={() => insertTemplate('header')}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Header
                        </Button>
                        <Button
                          type="button"
                          onClick={() => insertTemplate('paragraph')}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Parágrafo
                        </Button>
                        <Button
                          type="button"
                          onClick={() => insertTemplate('button')}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Botão
                        </Button>
                        <Button
                          type="button"
                          onClick={() => insertTemplate('image')}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Imagem
                        </Button>
                        <Button
                          type="button"
                          onClick={() => insertTemplate('divider')}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Divisor
                        </Button>
                        <Button
                          type="button"
                          onClick={() => insertTemplate('footer')}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Footer
                        </Button>
                      </div>
                      
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full px-4 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green font-mono text-sm"
                        placeholder="<div>Conteúdo do email em HTML...</div>"
                        rows={12}
                        required
                      />
                    </div>
                  ) : (
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-4 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green font-mono text-sm"
                      placeholder="<div>Conteúdo do email em HTML...</div>"
                      rows={12}
                      required
                    />
                  )}
                  
                  <p className="text-futuristic-gray text-xs mt-1">
                    Use variáveis como {`{{nome_usuario}}`} para personalização
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-futuristic-gray/30 bg-dark-gray/50 text-lime-green focus:ring-lime-green"
                    />
                    <span className="text-white text-sm">Template ativo</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-lime-green hover:bg-lime-green/80 text-black font-semibold"
                  >
                    {editingTemplate ? 'Atualizar' : 'Criar'} Template
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="glass-effect w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-orbitron font-bold text-white">
                  Preview: {showPreview.name}
                </h2>
                <Button
                  onClick={() => setShowPreview(null)}
                  variant="outline"
                  size="sm"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Assunto:
                  </label>
                  <div className="p-3 bg-dark-gray/30 rounded-lg text-white">
                    {showPreview.subject}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Conteúdo:
                  </label>
                  <div className="p-4 bg-white rounded-lg">
                    <div dangerouslySetInnerHTML={{ __html: showPreview.content }} />
                  </div>
                </div>

                {showPreview.variables.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Variáveis disponíveis:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {showPreview.variables.map((variable) => (
                        <span
                          key={variable}
                          className="px-3 py-1 bg-lime-green/20 text-lime-green rounded-full text-sm"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};