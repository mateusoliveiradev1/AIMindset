import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ArticleEditor from '@/components/ArticleEditor';
import { useArticles } from '@/hooks/useArticles';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import SEOManager from '@/components/SEO/SEOManager';

export default function AdminEditor() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const articleId = params.get('id');
  const articleSlug = params.get('slug');

  const { articles, categories, getArticleById, createArticle, updateArticle, refreshArticles } = useArticles();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [initialData, setInitialData] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      // Carregar por ID, se presente
      if (articleId) {
        setLoading(true);
        try {
          const data = await getArticleById(articleId);
          if (data) {
            setInitialData(data);
          } else {
            toast.error('Artigo não encontrado');
          }
        } catch (err: any) {
          toast.error(err?.message || 'Erro ao carregar artigo');
        } finally {
          setLoading(false);
        }
        return;
      }

      // Carregar por slug, se presente
      if (articleSlug) {
        setLoading(true);
        try {
          // Tentar encontrar entre artigos já carregados
          let found = (articles || []).find((a) => a.slug === articleSlug);

          // Se não encontrado, buscar diretamente no Supabase por slug
          if (!found) {
            const { data, error } = await supabase
              .from('articles')
              .select('*')
              .eq('slug', articleSlug)
              .single();

            if (error) throw error;
            found = data || null;
          }

          if (found) {
            setInitialData(found);
          } else {
            toast.error('Artigo não encontrado');
          }
        } catch (err: any) {
          toast.error(err?.message || 'Erro ao carregar artigo');
        } finally {
          setLoading(false);
        }
      }
    };
    load();
  }, [articleId, articleSlug, getArticleById, articles]);

  const onCancel = () => navigate('/admin/articles');

  const onSave = async (articleData: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string; // slug
    tags: string;
    featuredImage: string;
    published: boolean;
  }) => {
    try {
      // Mapear categoria slug -> id
      const selectedCategory = categories.find((cat) => cat.slug === articleData.category) || categories[0];
      if (!selectedCategory) {
        toast.error('Categoria inválida');
        return;
      }

      const tagsArray = Array.isArray(articleData.tags)
        ? articleData.tags
        : (articleData.tags || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

      const payload = {
        title: articleData.title,
        slug:
          articleData.slug ||
          articleData.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim(),
        excerpt: articleData.excerpt || '',
        content: articleData.content,
        image_url: articleData.featuredImage || '',
        category_id: selectedCategory.id,
        author_id: user?.id || '',
        published: Boolean(articleData.published),
        tags: tagsArray,
      };

      // Permitir salvar usando ID de param ou ID do dado inicial (caso slug)
      const targetId = articleId || initialData?.id;
      // Guarda de não alteração: comparar payload com dados iniciais
      if (targetId && initialData) {
        const normalizeTags = (v: any) => Array.isArray(v) ? v : (typeof v === 'string' ? v.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
        const newSnap: any = {
          title: payload.title,
          excerpt: payload.excerpt,
          content: payload.content,
          image_url: payload.image_url,
          category_id: payload.category_id,
          author_id: payload.author_id,
          published: payload.published,
          tags: normalizeTags(payload.tags),
          slug: payload.slug
        };
        const oldSnap: any = {
          title: (initialData as any)?.title,
          excerpt: (initialData as any)?.excerpt,
          content: (initialData as any)?.content,
          image_url: (initialData as any)?.image_url,
          category_id: (initialData as any)?.category_id,
          author_id: (initialData as any)?.author_id,
          published: (initialData as any)?.published,
          tags: normalizeTags((initialData as any)?.tags),
          slug: (initialData as any)?.slug
        };
        const fields = ['title','excerpt','content','image_url','category_id','author_id','published','tags','slug'] as const;
        const changed = fields.some((k) => JSON.stringify(newSnap[k]) !== JSON.stringify(oldSnap[k]));
        if (!changed) {
          toast.warning('Nenhuma alteração detectada. Nada foi salvo.');
          return;
        }
      }

      const ok = targetId ? await updateArticle(targetId, payload) : await createArticle(payload as any);

      if (ok) {
        toast.success(targetId ? 'Artigo atualizado!' : 'Artigo criado!');
        await refreshArticles();
        navigate('/admin/articles');
      } else {
        toast.error('Não foi possível salvar o artigo');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar artigo');
    }
  };

  return (
    <div className="space-y-8">
      <SEOManager
        metadata={{
          title: 'Editor de Artigos - Admin AIMindset',
          description: 'Crie e edite artigos do blog na área administrativa.',
          keywords: ['admin', 'editor', 'artigos', 'blog', 'aimindset', 'conteúdo'],
          canonicalUrl: 'https://aimindset.com.br/admin/editor',
          type: 'webpage',
          language: 'pt-BR',
          robots: 'noindex, nofollow',
          breadcrumbs: [
            { name: 'Admin', url: 'https://aimindset.com.br/admin', position: 1 },
            { name: 'Editor', url: 'https://aimindset.com.br/admin/editor', position: 2 }
          ]
        }}
      />
      {/* Header */}
      <div>
        <h2 className="text-2xl font-orbitron font-bold text-white">{articleId || articleSlug ? 'Editar Artigo' : 'Novo Artigo'}</h2>
        <p className="text-futuristic-gray text-sm">Crie ou edite artigos do blog.</p>
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="text-futuristic-gray text-sm">Carregando...</div>
        ) : (
          <ArticleEditor initialData={initialData || undefined} onSave={onSave} onCancel={onCancel} />
        )}
      </div>
    </div>
  );
}