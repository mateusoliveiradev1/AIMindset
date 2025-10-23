import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  content: string;
  template_type: 'welcome' | 'onboarding' | 'newsletter' | 'notification' | 'custom';
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailTemplateData {
  name: string;
  description?: string;
  subject: string;
  content: string;
  template_type: 'welcome' | 'onboarding' | 'newsletter' | 'notification' | 'custom';
  variables?: string[];
  is_active?: boolean;
}

export interface UpdateEmailTemplateData {
  name?: string;
  description?: string;
  subject?: string;
  content?: string;
  template_type?: 'welcome' | 'onboarding' | 'newsletter' | 'notification' | 'custom';
  variables?: string[];
  is_active?: boolean;
}

export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar todos os templates
  const fetchTemplates = useCallback(async (activeOnly = false) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar templates:', error);
        setError('Erro ao carregar templates');
        return;
      }

      // Processar variáveis JSON
      const processedTemplates: EmailTemplate[] = data.map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : []
      }));

      setTemplates(processedTemplates);
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
      setError('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar template por ID
  const getTemplateById = useCallback(async (id: string): Promise<EmailTemplate | null> => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar template:', error);
        return null;
      }

      return {
        ...data,
        variables: Array.isArray(data.variables) ? data.variables : []
      };
    } catch (err) {
      console.error('Erro ao buscar template:', err);
      return null;
    }
  }, []);

  // Buscar templates por tipo
  const getTemplatesByType = useCallback(async (templateType: EmailTemplate['template_type']): Promise<EmailTemplate[]> => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar templates por tipo:', error);
        return [];
      }

      return data.map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : []
      }));
    } catch (err) {
      console.error('Erro ao buscar templates por tipo:', err);
      return [];
    }
  }, []);

  // Criar novo template
  const createTemplate = useCallback(async (templateData: CreateEmailTemplateData): Promise<EmailTemplate | null> => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert([{
          ...templateData,
          variables: templateData.variables || [],
          is_active: templateData.is_active !== undefined ? templateData.is_active : true
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar template:', error);
        toast.error('Erro ao criar template');
        return null;
      }

      const newTemplate: EmailTemplate = {
        ...data,
        variables: Array.isArray(data.variables) ? data.variables : []
      };

      setTemplates(prev => [newTemplate, ...prev]);
      toast.success('Template criado com sucesso!');
      return newTemplate;
    } catch (err) {
      console.error('Erro ao criar template:', err);
      toast.error('Erro ao criar template');
      return null;
    }
  }, []);

  // Atualizar template
  const updateTemplate = useCallback(async (id: string, updates: UpdateEmailTemplateData): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar template:', error);
        toast.error('Erro ao atualizar template');
        return false;
      }

      const updatedTemplate: EmailTemplate = {
        ...data,
        variables: Array.isArray(data.variables) ? data.variables : []
      };

      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? updatedTemplate : template
        )
      );

      toast.success('Template atualizado com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao atualizar template:', err);
      toast.error('Erro ao atualizar template');
      return false;
    }
  }, []);

  // Alternar status ativo/inativo
  const toggleTemplateStatus = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    return updateTemplate(id, { is_active: !isActive });
  }, [updateTemplate]);

  // Duplicar template
  const duplicateTemplate = useCallback(async (id: string): Promise<EmailTemplate | null> => {
    try {
      const originalTemplate = await getTemplateById(id);
      if (!originalTemplate) {
        toast.error('Template não encontrado');
        return null;
      }

      const duplicatedTemplate = await createTemplate({
        name: `${originalTemplate.name} (Cópia)`,
        description: originalTemplate.description,
        subject: originalTemplate.subject,
        content: originalTemplate.content,
        template_type: originalTemplate.template_type,
        variables: originalTemplate.variables,
        is_active: false // Criar como inativo por padrão
      });

      return duplicatedTemplate;
    } catch (err) {
      console.error('Erro ao duplicar template:', err);
      toast.error('Erro ao duplicar template');
      return null;
    }
  }, [getTemplateById, createTemplate]);

  // Excluir template
  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir template:', error);
        toast.error('Erro ao excluir template');
        return false;
      }

      setTemplates(prev => prev.filter(template => template.id !== id));
      toast.success('Template excluído com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao excluir template:', err);
      toast.error('Erro ao excluir template');
      return false;
    }
  }, []);

  // Processar variáveis no conteúdo do template
  const processTemplateContent = useCallback((content: string, variables: Record<string, string>): string => {
    let processedContent = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    return processedContent;
  }, []);

  // Extrair variáveis do conteúdo do template
  const extractVariablesFromContent = useCallback((content: string): string[] => {
    const variableRegex = /{{\\s*([^}]+)\\s*}}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }, []);

  // Obter estatísticas dos templates
  const getTemplateStats = useCallback(() => {
    const totalTemplates = templates.length;
    const activeTemplates = templates.filter(t => t.is_active).length;
    const templatesByType = templates.reduce((acc, template) => {
      acc[template.template_type] = (acc[template.template_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTemplates,
      activeTemplates,
      inactiveTemplates: totalTemplates - activeTemplates,
      templatesByType
    };
  }, [templates]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    // Estados
    templates,
    loading,
    error,

    // Ações
    fetchTemplates,
    getTemplateById,
    getTemplatesByType,
    createTemplate,
    updateTemplate,
    toggleTemplateStatus,
    duplicateTemplate,
    deleteTemplate,

    // Utilitários
    processTemplateContent,
    extractVariablesFromContent,
    getTemplateStats
  };
};