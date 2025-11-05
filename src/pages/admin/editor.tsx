import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ArticleEditor from '@/components/ArticleEditor';
import { useArticles } from '@/hooks/useArticles';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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