import React, { useState, useEffect } from 'react';
import Card from './UI/Card';
import Button from './UI/Button';
import { useArticles } from '../hooks/useArticles';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MarkdownLazy } from './Performance/MarkdownLazy';
// import LazyImage from './Performance/LazyImage';
import { ArticleScheduling } from './Articles/ArticleScheduling';
import {
  Save,
  Eye,
  Upload,
  Image as ImageIcon,
  Bold,
  Italic,
  Link,
  List,
  Hash,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Crop,
  Shield,
  Wand2
} from 'lucide-react';
import {
  sanitizeName,
  sanitizeMessage,
  validators,
  RateLimiter,
  sanitizeInput,
  sanitizeEmail,
  CSRFProtection,
  validateOrigin
} from '../utils/security';
import { SecurityHeaders } from '../utils/securityHeaders';
import { logEvent, logError } from '../lib/logging';
import { optimizeSEOWithGemini } from '../utils/geminiSEO';
import { optimizeImage, generateSEOFileName } from '../utils/imageOptimizer';
import { toast } from 'sonner';

interface ArticleData {
  title: string;
  slug: string;
  excerpt: string;
  // metaDescription: string; // Removido - coluna não existe na tabela
  content: string;
  category: string;
  tags: string;
  featuredImage: string;
  published: boolean;
  scheduled_for?: string | null;
  scheduling_status?: string;
}

interface ArticleEditorProps {
  onSave?: (article: ArticleData) => void;
  onCancel?: () => void;
  initialData?: any;
}

interface ImageSettings {
  alignment: 'left' | 'center' | 'right';
  size: 'small' | 'medium' | 'large' | 'full';
  caption: string;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ onSave, onCancel, initialData }) => {
  const { categories, loading, refreshArticles } = useArticles();
  const { isAuthenticated, supabaseUser } = useAuth();
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');

  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  // const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || ''); // Removido - coluna não existe
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(() => {
    if (initialData?.category_id) {
      // Encontrar o slug da categoria pelo ID
      const categorySlug = categories.find(cat => cat.id === initialData.category_id)?.slug;
      return categorySlug || '';
    }
    return '';
  });
  const [tags, setTags] = useState(initialData?.tags || '');
  const [featuredImage, setFeaturedImage] = useState(initialData?.image_url || '');
  const [isPublished, setIsPublished] = useState(initialData?.published || false);
  const [scheduledFor, setScheduledFor] = useState(initialData?.scheduled_for || '');
  const [schedulingStatus, setSchedulingStatus] = useState(initialData?.scheduling_status || 'draft');

  // Atualizar estados de agendamento quando initialData mudar
  useEffect(() => {
    if (initialData) {
      setScheduledFor(initialData.scheduled_for || '');
      setSchedulingStatus(initialData.scheduling_status || 'draft');
    }
  }, [initialData]);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    alignment: 'center',
    size: 'medium',
    caption: ''
  });

  // Estados funcionais: salvamento, rascunho e proteção
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveMessage, setAutoSaveMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  // Atualizar categoria quando as categorias carregarem
  useEffect(() => {
    if (initialData?.category_id && categories.length > 0) {
      const categorySlug = categories.find(cat => cat.id === initialData.category_id)?.slug;
      if (categorySlug) {
        setCategory(categorySlug);
      }
    }
  }, [categories, initialData?.category_id]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 10MB original)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('A imagem original deve ter no máximo 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Otimizar imagem no cliente (WebP, < 1MB)
      toast.info('Otimizando imagem (convertendo para WebP)...');
      const optimizedFile = await optimizeImage(file);

      // 2. Gerar nome SEO amigável
      const fileName = generateSEOFileName(file.name, title || 'aimindset');
      const filePath = `articles/${fileName}`;

      console.log('📤 INICIANDO UPLOAD OTIMIZADO:', {
        fileName,
        filePath,
        originalSize: file.size,
        optimizedSize: optimizedFile.size,
        fileType: optimizedFile.type
      });

      // Usar cliente singleton existente
      const { supabase: publicClient } = await import('../lib/supabase');

      // 3. Upload para o Supabase Storage
      const { data, error } = await publicClient.storage
        .from('articles')
        .upload(filePath, optimizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ ERRO NO UPLOAD PÚBLICO:', error);

        // Fallback: tentar com cliente autenticado se disponível
        if (isAuthenticated && supabaseUser) {
          console.log('🔄 Tentando upload com autenticação...');

          const { data: authData, error: authError } = await supabase.storage
            .from('articles')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (authError) {
            console.error('❌ ERRO NO UPLOAD AUTENTICADO:', authError);
            throw authError;
          }

          console.log('✅ UPLOAD AUTENTICADO FUNCIONOU:', authData);
        } else {
          throw error;
        }
      } else {
        console.log('✅ UPLOAD PÚBLICO FUNCIONOU:', data);
      }

      // Obter URL pública da imagem
      const { data: { publicUrl } } = publicClient.storage
        .from('articles')
        .getPublicUrl(filePath);

      console.log('🌐 URL PÚBLICA GERADA:', publicUrl);

      setFeaturedImage(publicUrl);
      setUploadError(null);
    } catch (error: any) {
      console.error('❌ ERRO NO UPLOAD:', error);

      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao fazer upload da imagem.';

      if (error.message?.includes('row-level security policy')) {
        errorMessage = 'Erro de permissão no storage. O bucket foi configurado como público, mas ainda há restrições.';
      } else if (error.message?.includes('JWT')) {
        errorMessage = 'Erro de autenticação. Tentando upload público...';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Bucket não encontrado. Verifique a configuração do Supabase.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Função para gerar slug a partir do título
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      // Remover acentos
      .replace(/[áàâãä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      // Remover caracteres especiais
      .replace(/[^a-z0-9\s-]/g, '')
      // Substituir espaços por hífens
      .replace(/\s+/g, '-')
      // Remover hífens duplicados
      .replace(/-+/g, '-')
      // Remover hífens do início e fim
      .replace(/^-|-$/g, '') || 'artigo';
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Gerar slug automaticamente apenas se não foi editado manualmente
    if (!initialData?.slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const insertImageWithSettings = () => {
    if (!featuredImage) return;

    const sizeClasses = {
      small: 'w-64',
      medium: 'w-96',
      large: 'w-full max-w-4xl',
      full: 'w-full'
    };

    const alignmentClasses = {
      left: 'float-left mr-4 mb-4',
      center: 'mx-auto block',
      right: 'float-right ml-4 mb-4'
    };

    const imageMarkdown = `
<div class="image-container ${imageSettings.alignment === 'center' ? 'text-center' : ''}">
  <img src="${featuredImage}" alt="${imageSettings.caption || 'Imagem do artigo'}" class="${sizeClasses[imageSettings.size]} ${alignmentClasses[imageSettings.alignment]} rounded-lg shadow-lg" />
  ${imageSettings.caption ? `<p class="text-sm text-gray-600 mt-2 italic">${imageSettings.caption}</p>` : ''}
</div>
`;

    insertMarkdown(imageMarkdown);
  };

  const toolbarButtons = [
    { icon: Bold, title: 'Negrito', action: () => insertMarkdown('**', '**') },
    { icon: Italic, title: 'Itálico', action: () => insertMarkdown('*', '*') },
    { icon: Hash, title: 'Título', action: () => insertMarkdown('## ') },
    { icon: Link, title: 'Link', action: () => insertMarkdown('[', '](url)') },
    { icon: List, title: 'Lista', action: () => insertMarkdown('- ') },
    { icon: Quote, title: 'Citação', action: () => insertMarkdown('> ') },
    { icon: Code, title: 'Código', action: () => insertMarkdown('`', '`') },
    { icon: ImageIcon, title: 'Inserir Imagem', action: insertImageWithSettings }
  ];

  const handleSave = async () => {
    if (isSaving) return; // evitar duplicidade
    setIsSaving(true);
    try {
      await logEvent('info', 'ArticleEditor', 'save_article_start', {
        user_id: supabaseUser?.id,
        article_title: title.substring(0, 100),
        is_editing: !!initialData?.id,
        content_length: content.length,
        has_featured_image: !!featuredImage,
      });

      if (!RateLimiter.canPerformAction('article_save', 10, 60000)) {
        alert('Muitas tentativas de salvamento. Aguarde um momento.');
        return;
      }

      if (!validators.required(title.trim()) || !validators.required(content.trim())) {
        alert('Por favor, preencha pelo menos o título e o conteúdo.');
        return;
      }

      const sanitizedTitle = sanitizeName(title.trim());
      const sanitizedExcerpt = sanitizeMessage(excerpt.trim());
      const sanitizedContent = sanitizeMessage(content.trim());
      const sanitizedTags = sanitizeMessage(tags.trim());
      const sanitizedFeaturedImage = featuredImage.trim() ? SecurityHeaders.sanitizeUrl(featuredImage.trim()) : '';

      if (!sanitizedTitle || !sanitizedContent) {
        alert('Dados inválidos detectados. Verifique o conteúdo.');
        return;
      }

      const articleData: ArticleData = {
        title: sanitizedTitle,
        slug: slug.trim() || generateSlug(sanitizedTitle),
        excerpt: sanitizedExcerpt,
        content: sanitizedContent,
        category: category,
        tags: sanitizedTags,
        featuredImage: sanitizedFeaturedImage,
        published: isPublished,
        scheduled_for: scheduledFor || null,
        scheduling_status: schedulingStatus,
      };

      if (onSave) {
        await onSave(articleData);
        setLastSavedAt(Date.now());
        setHasUnsavedChanges(false);
        setAutoSaveMessage('Salvo');
        setTimeout(() => setAutoSaveMessage(null), 1500);
        await logEvent('info', 'ArticleEditor', 'save_article_success', {
          user_id: supabaseUser?.id,
          article_title: articleData.title.substring(0, 100),
          article_slug: articleData.slug,
          is_editing: !!initialData?.id,
          published: articleData.published,
          content_length: articleData.content.length,
        });
      }
    } catch (error: any) {
      await logError(error, 'ArticleEditor', 'save_article_error', {
        user_id: supabaseUser?.id,
        article_title: title.substring(0, 100),
        is_editing: !!initialData?.id,
      });
      alert(error?.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIOptimize = async () => {
    if (!content || content.length < 100) {
      toast.error('O conteúdo é muito curto para otimização por IA.');
      return;
    }

    setIsOptimizing(true);
    try {
      toast.info('IA analisando conteúdo e gerando metadados...');
      const optimized = await optimizeSEOWithGemini(content, title);

      if (optimized) {
        if (optimized.title) setTitle(optimized.title);
        if (optimized.description) setExcerpt(optimized.description);
        if (optimized.keywords && optimized.keywords.length > 0) {
          setTags(optimized.keywords.join(', '));
        }
        toast.success('SEO otimizado com sucesso pelo Gemini!');
        setHasUnsavedChanges(true);
      } else {
        toast.error('Não foi possível otimizar o SEO com Gemini. Verifique a API Key.');
      }
    } catch (error) {
      console.error('Erro na otimização por IA:', error);
      toast.error('Erro ao conectar com o serviço de IA.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const getImageSizeStyle = () => {
    const sizes = { small: { width: '200px', height: '120px' }, medium: { width: '300px', height: '180px' }, large: { width: '400px', height: '240px' }, full: { width: '100%', height: '300px' } };
    return sizes[imageSettings.size];
  };

  const getImageAlignmentStyle = () => {
    const alignments = { left: { textAlign: 'left' as const }, center: { textAlign: 'center' as const }, right: { textAlign: 'right' as const } };
    return alignments[imageSettings.alignment];
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h2 className="text-lg sm:text-2xl font-montserrat font-bold text-white">
          {showPreview ? 'Preview do Artigo' : 'Editor de Artigo'}
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:space-x-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <Eye className="w-4 h-4" />
            <span className="text-xs sm:text-sm">{showPreview ? 'Editor' : 'Preview'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="min-h-[44px] text-xs sm:text-sm"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="flex items-center justify-center space-x-2 min-h-[44px]"
            disabled={isSaving}
            aria-busy={isSaving}
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span className="text-xs sm:text-sm">{isSaving ? 'Salvando...' : 'Salvar'}</span>
          </Button>
          <Button
            size="sm"
            onClick={handleAIOptimize}
            variant="outline"
            className="flex items-center justify-center space-x-2 min-h-[44px] border-lime-green/50 text-lime-green hover:bg-lime-green/10"
            disabled={isOptimizing || !content}
            aria-busy={isOptimizing}
          >
            <Wand2 className={`w-4 h-4 ${isOptimizing ? 'animate-pulse' : ''}`} />
            <span className="text-xs sm:text-sm">{isOptimizing ? 'Otimizando...' : 'Otimizar SEO'}</span>
          </Button>
        </div>
      </div>

      {/* Toast de autosave simples */}
      {autoSaveMessage && (
        <div className="text-xs text-futuristic-gray">{autoSaveMessage}{lastSavedAt ? ` • ${new Date(lastSavedAt).toLocaleTimeString()}` : ''}</div>
      )}

      {showPreview ? (
        /* Preview Mode */
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-8">
            <article className="prose prose-lg prose-invert max-w-none">
              {/* Featured Image Preview */}
              {featuredImage && (
                <div className="mb-8" style={getImageAlignmentStyle()}>
                  <img
                    src={featuredImage}
                    alt={imageSettings.caption || title}
                    className="rounded-lg shadow-lg object-cover"
                    width={800}
                    height={400}
                    loading="eager"
                  />
                  {imageSettings.caption && (
                    <p className="text-sm text-gray-400 mt-2 italic text-center">
                      {imageSettings.caption}
                    </p>
                  )}
                </div>
              )}

              {/* Article Header */}
              <header className="mb-8 border-b border-neon-purple/20 pb-6">
                <h1 className="text-5xl font-orbitron font-bold mb-4 leading-tight bg-gradient-to-r from-neon-purple via-lime-green to-neon-purple bg-clip-text text-transparent drop-shadow-2xl">
                  {title || 'Título do Artigo'}
                </h1>
                {excerpt && (
                  <p className="text-xl text-gray-300 leading-relaxed font-montserrat">
                    {excerpt}
                  </p>
                )}
                {category && (
                  <div className="flex items-center space-x-2 mt-4">
                    <span className="px-3 py-1 bg-lime-green/20 text-lime-green rounded-full text-sm font-medium">
                      {category}
                    </span>
                  </div>
                )}
              </header>

              {/* Article Content */}
              <div className="prose-content">
                <MarkdownLazy
                  className="text-gray-200 leading-relaxed"
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-montserrat font-bold text-white mt-8 mb-4 border-b border-neon-purple/20 pb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-montserrat font-bold text-white mt-6 mb-3">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-montserrat font-semibold text-white mt-5 mb-2">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-200 leading-relaxed mb-4 text-base">
                        {children}
                      </p>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-lime-green hover:text-lime-green/80 underline decoration-lime-green/50 hover:decoration-lime-green transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside text-gray-200 space-y-2 mb-4 ml-4">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside text-gray-200 space-y-2 mb-4 ml-4">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-200 leading-relaxed">
                        {children}
                      </li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-lime-green pl-4 py-2 bg-lime-green/5 text-gray-300 italic my-4 rounded-r">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-darker-surface px-2 py-1 rounded text-lime-green font-mono text-sm">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-darker-surface p-4 rounded-lg overflow-x-auto border border-neon-purple/20 my-4">
                        <code className="text-lime-green font-mono text-sm">
                          {children}
                        </code>
                      </pre>
                    ),
                    img: ({ src, alt }) => (
                      <img
                        src={src}
                        alt={alt}
                        className="rounded-lg shadow-lg max-w-full h-auto my-4"
                      />
                    )
                  }}
                >
                  {content || '*Nenhum conteúdo ainda...*'}
                </MarkdownLazy>
              </div>
            </article>
          </Card>
        </div>
      ) : (
        /* Editor Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-montserrat font-medium text-white mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 focus:ring-lime-green focus:border-transparent"
                    placeholder="Digite o título do artigo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-montserrat font-medium text-white mb-2">
                    Slug (URL amigável)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 focus:ring-lime-green focus:border-transparent"
                    placeholder="slug-do-artigo"
                  />
                  <p className="text-xs text-futuristic-gray mt-1">
                    Gerado automaticamente a partir do título. Pode ser editado manualmente.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-montserrat font-medium text-white mb-2">
                    Resumo
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 focus:ring-lime-green focus:border-transparent resize-none"
                    placeholder="Breve descrição do artigo..."
                  />
                </div>
              </div>
            </Card>

            {/* Content Editor */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-montserrat font-medium text-white">
                    Conteúdo *
                  </label>
                  <div className="flex items-center space-x-1">
                    {toolbarButtons.map((button, index) => {
                      const Icon = button.icon;
                      return (
                        <button
                          key={index}
                          onClick={button.action}
                          title={button.title}
                          className="p-2 text-futuristic-gray hover:text-lime-green hover:bg-dark-surface/50 rounded transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <textarea
                  id="content-editor"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 focus:ring-lime-green focus:border-transparent resize-none font-mono text-sm"
                  placeholder="Digite o conteúdo do artigo em Markdown..."
                />
                <p className="text-xs text-futuristic-gray">
                  Suporte a Markdown. Use **negrito**, *itálico*, ## títulos, [links](url), etc.
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card className="p-6">
              <h4 className="text-lg font-montserrat font-semibold text-white mb-4">
                Publicação
              </h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="published"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-lime-green bg-darker-surface border-neon-purple/20 rounded focus:ring-lime-green focus:ring-2"
                  />
                  <label htmlFor="published" className="text-sm text-white">
                    Publicar imediatamente
                  </label>
                </div>
                <p className="text-xs text-futuristic-gray">
                  {isPublished ? 'Artigo será publicado' : 'Artigo será salvo como rascunho'}
                </p>

                {/* Componente de Agendamento */}
                <ArticleScheduling
                  articleId={initialData?.id || ''}
                  currentScheduledDate={scheduledFor}
                  currentStatus={schedulingStatus}
                  onSchedule={(data) => {
                    setScheduledFor(data.scheduled_for);
                    setSchedulingStatus('scheduled');
                  }}
                  onCancel={() => {
                    setScheduledFor('');
                    setSchedulingStatus('draft');
                  }}
                />
              </div>
            </Card>

            {/* Category */}
            <Card className="p-6">
              <h4 className="text-lg font-montserrat font-semibold text-white mb-4">
                Categoria
              </h4>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lime-green mx-auto mb-2"></div>
                  <p className="text-futuristic-gray text-sm">Carregando categorias...</p>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime-green focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </Card>

            {/* Tags */}
            <Card className="p-6">
              <h4 className="text-lg font-montserrat font-semibold text-white mb-4">
                Tags
              </h4>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 focus:ring-lime-green focus:border-transparent"
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-xs text-futuristic-gray mt-2">
                Separe as tags com vírgulas
              </p>
            </Card>

            {/* Featured Image */}
            <Card className="p-6">
              <h4 className="text-lg font-montserrat font-semibold text-white mb-4">
                Imagem Destacada
              </h4>
              <div className="space-y-4">
                <input
                  type="url"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 focus:ring-lime-green focus:border-transparent"
                  placeholder="URL da imagem ou use o Pexels"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={isUploading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center space-x-2"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isUploading}
                  >
                    <Upload className={`${isUploading ? 'animate-spin' : ''} w-4 h-4`} />
                    <span>{isUploading ? 'Fazendo upload...' : 'Upload Direto'}</span>
                  </Button>
                </div>
                {uploadError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-xs">{uploadError}</p>
                  </div>
                )}

                {/* Image Preview with Controls */}
                {featuredImage && (
                  <div className="space-y-4">
                    <div className="border border-neon-purple/20 rounded-lg p-4 bg-darker-surface/50">
                      <div style={getImageAlignmentStyle()}>
                        <img
                          src={featuredImage}
                          alt="Preview"
                          className="rounded-lg shadow-lg object-cover"
                          width={400}
                          height={200}
                          loading="eager"
                          crossOrigin={featuredImage?.includes('images.unsplash.com') ? 'anonymous' : undefined}
                          referrerPolicy={featuredImage?.includes('images.unsplash.com') ? 'no-referrer' : undefined}
                        />
                      </div>
                    </div>

                    {/* Image Controls */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-white mb-2">
                          Alinhamento
                        </label>
                        <div className="flex space-x-2">
                          {[
                            { value: 'left', icon: AlignLeft, label: 'Esquerda' },
                            { value: 'center', icon: AlignCenter, label: 'Centro' },
                            { value: 'right', icon: AlignRight, label: 'Direita' }
                          ].map(({ value, icon: Icon, label }) => (
                            <button
                              key={value}
                              onClick={() => setImageSettings(prev => ({ ...prev, alignment: value as any }))}
                              className={`flex-1 p-2 rounded border transition-colors ${imageSettings.alignment === value
                                ? 'bg-lime-green/20 border-lime-green text-lime-green'
                                : 'bg-darker-surface border-neon-purple/20 text-futuristic-gray hover:text-white'
                                }`}
                              title={label}
                            >
                              <Icon className="w-4 h-4 mx-auto" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white mb-2">
                          Tamanho
                        </label>
                        <select
                          value={imageSettings.size}
                          onChange={(e) => setImageSettings(prev => ({ ...prev, size: e.target.value as any }))}
                          className="w-full px-3 py-2 bg-darker-surface border border-neon-purple/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-lime-green"
                        >
                          <option value="small">Pequeno (200px)</option>
                          <option value="medium">Médio (300px)</option>
                          <option value="large">Grande (400px)</option>
                          <option value="full">Largura Total</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white mb-2">
                          Legenda (opcional)
                        </label>
                        <input
                          type="text"
                          value={imageSettings.caption}
                          onChange={(e) => setImageSettings(prev => ({ ...prev, caption: e.target.value }))}
                          className="w-full px-3 py-2 bg-darker-surface border border-neon-purple/20 rounded text-white text-sm placeholder-futuristic-gray focus:outline-none focus:ring-2 focus:ring-lime-green"
                          placeholder="Descrição da imagem..."
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center space-x-2"
                        onClick={insertImageWithSettings}
                        disabled={!featuredImage}
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Inserir no Conteúdo</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;