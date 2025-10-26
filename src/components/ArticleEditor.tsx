import React, { useState, useEffect } from 'react';
import Card from './UI/Card';
import Button from './UI/Button';
import { useArticles } from '../hooks/useArticles';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// import LazyImage from './Performance/LazyImage';
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
  Shield
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
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    alignment: 'center',
    size: 'medium',
    caption: ''
  });

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

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `articles/${fileName}`;

      console.log('📤 INICIANDO UPLOAD PÚBLICO:', {
        fileName,
        filePath,
        fileSize: file.size,
        fileType: file.type
      });

      // Usar cliente singleton existente para evitar múltiplas instâncias GoTrueClient
      const { supabase: publicClient } = await import('../lib/supabase');

      // Upload para o Supabase Storage (bucket público)
      const { data, error } = await publicClient.storage
        .from('articles')
        .upload(filePath, file, {
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
    console.log('🔥 INICIANDO SALVAMENTO - ArticleEditor.handleSave()');
    console.log('📊 DADOS INICIAIS:', {
      title: title.length,
      content: content.length,
      excerpt: excerpt.length,
      tags: tags.length,
      timestamp: new Date().toISOString()
    });

    // Verificar rate limiting para salvamento de artigos
    if (!RateLimiter.canPerformAction('article_save', 10, 60000)) { // 10 salvamentos por minuto
      console.log('❌ RATE LIMIT ATINGIDO');
      alert('Muitas tentativas de salvamento. Aguarde um momento.');
      return;
    }

    // Validação básica
    if (!validators.required(title.trim()) || !validators.required(content.trim())) {
      console.log('❌ VALIDAÇÃO BÁSICA FALHOU:', {
        titleValid: validators.required(title.trim()),
        contentValid: validators.required(content.trim())
      });
      alert('Por favor, preencha pelo menos o título e o conteúdo.');
      return;
    }

    // Validar comprimento dos campos - removido limite de título para permitir textos longos
    // if (title.trim().length > 500) { // Removido limite para permitir títulos longos
    //   alert('O título deve ter no máximo 500 caracteres.');
    //   return;
    // }

    // Removido limite de resumo para permitir textos longos
    // if (excerpt.trim().length > 1000) { // Removido limite para permitir resumos longos
    //   alert('O resumo deve ter no máximo 1000 caracteres.');
    //   return;
    // }

    // Meta description removido - coluna não existe na tabela
    // if (metaDescription.trim().length > 160) {
    //   console.log('❌ META DESCRIPTION MUITO LONGA:', metaDescription.trim().length);
    //   alert('A meta descrição deve ter no máximo 160 caracteres.');
    //   return;
    // }

    console.log('🧹 INICIANDO SANITIZAÇÃO DOS DADOS');
    
    // Sanitizar dados
    const sanitizedTitle = sanitizeName(title.trim());
    const sanitizedExcerpt = sanitizeMessage(excerpt.trim());
    // const sanitizedMetaDescription = sanitizeMessage(metaDescription.trim()); // Removido
    const sanitizedContent = sanitizeMessage(content.trim());
    const sanitizedTags = sanitizeMessage(tags.trim());
    const sanitizedFeaturedImage = featuredImage.trim() ? SecurityHeaders.sanitizeUrl(featuredImage.trim()) : '';

    console.log('📋 DADOS SANITIZADOS:', {
      titleLength: sanitizedTitle.length,
      excerptLength: sanitizedExcerpt.length,
      contentLength: sanitizedContent.length,
      tagsLength: sanitizedTags.length,
      imageUrl: sanitizedFeaturedImage ? 'presente' : 'ausente'
    });

    if (!sanitizedTitle || !sanitizedContent) {
      console.log('❌ SANITIZAÇÃO FALHOU:', {
        sanitizedTitle: !!sanitizedTitle,
        sanitizedContent: !!sanitizedContent
      });
      alert('Dados inválidos detectados. Verifique o conteúdo.');
      return;
    }

    const articleData: ArticleData = {
      title: sanitizedTitle,
      slug: slug.trim() || generateSlug(sanitizedTitle),
      excerpt: sanitizedExcerpt,
      // metaDescription: sanitizedMetaDescription, // Removido - coluna não existe
      content: sanitizedContent,
      category: category,
      tags: sanitizedTags,
      featuredImage: sanitizedFeaturedImage,
      published: isPublished
    };

    console.log('📦 DADOS FINAIS PARA SALVAMENTO:', {
      title: articleData.title.substring(0, 50) + '...',
      slug: articleData.slug,
      contentSize: articleData.content.length,
      contentSizeKB: (new TextEncoder().encode(articleData.content).length / 1024).toFixed(2),
      totalDataSize: JSON.stringify(articleData).length,
      totalDataSizeKB: (new TextEncoder().encode(JSON.stringify(articleData)).length / 1024).toFixed(2),
      category: articleData.category,
      published: articleData.published
    });

    console.log('🚀 CHAMANDO onSave() - PASSANDO PARA useArticles');
    
    if (onSave) {
      try {
        console.log('⏰ TIMESTAMP ANTES DO onSave:', new Date().toISOString());
        await onSave(articleData);
        console.log('✅ onSave() CONCLUÍDO COM SUCESSO');
      } catch (error) {
        console.error('💥 ERRO NO onSave():', {
          name: error.name,
          message: error.message,
          stack: error.stack?.substring(0, 500)
        });
      }
    } else {
      console.log('⚠️ onSave não definido - nenhuma ação executada');
    }
  };

  const getImageSizeStyle = () => {
    const sizes = {
      small: { width: '200px', height: '120px' },
      medium: { width: '300px', height: '180px' },
      large: { width: '400px', height: '240px' },
      full: { width: '100%', height: '300px' }
    };
    return sizes[imageSettings.size];
  };

  const getImageAlignmentStyle = () => {
    const alignments = {
      left: { textAlign: 'left' as const },
      center: { textAlign: 'center' as const },
      right: { textAlign: 'right' as const }
    };
    return alignments[imageSettings.alignment];
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-montserrat font-bold text-white">
          {showPreview ? 'Preview do Artigo' : 'Editor de Artigo'}
        </h2>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>{showPreview ? 'Editor' : 'Preview'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </Button>
        </div>
      </div>

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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
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
                </ReactMarkdown>
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
                 {/* Meta Description removido - coluna não existe na tabela
                 <div>
                   <label className="block text-sm font-montserrat font-medium text-white mb-2">
                     Meta Description *
                   </label>
                   <textarea
                     value={metaDescription}
                     onChange={(e) => setMetaDescription(e.target.value)}
                     rows={2}
                     maxLength={160}
                     className="w-full px-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:ring-2 focus:ring-lime-green focus:border-transparent resize-none"
                     placeholder="Descrição para SEO (máximo 160 caracteres)..."
                   />
                   <div className="flex justify-between items-center mt-1">
                     <p className="text-xs text-futuristic-gray">
                       <span className={metaDescription.length > 150 ? 'text-yellow-400' : metaDescription.length > 160 ? 'text-red-400' : 'text-lime-green'}>
                         {metaDescription.length}/160
                       </span> caracteres
                     </p>
                     <p className="text-xs text-futuristic-gray">
                       💡 Ideal: 150-160 caracteres para SEO
                     </p>
                   </div>
                 </div>
                 */}
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
                     <Upload className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
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
                               className={`flex-1 p-2 rounded border transition-colors ${
                                 imageSettings.alignment === value
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