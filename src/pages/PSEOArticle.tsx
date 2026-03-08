// src/pages/PSEOArticle.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Tag, ArrowLeft } from 'lucide-react';
import { MarkdownLazy } from '../components/Performance/MarkdownLazy';
import SEOManager from '../components/SEO/SEOManager';
import Layout from '../components/Layout/Layout';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { supabase } from '../lib/supabase';

interface PSEOPage {
    title: string;
    content: string;
    meta_title: string;
    meta_description: string;
    keywords: string[];
    created_at: string;
}

const PSEOArticle: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [page, setPage] = useState<PSEOPage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('programmatic_pages')
                    .select('*')
                    .eq('slug', slug)
                    .eq('is_published', true)
                    .single();

                if (error) throw error;
                setPage(data);
            } catch (error) {
                console.error('Erro ao buscar página pSEO:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPage();
    }, [slug]);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green"></div>
                </div>
            </Layout>
        );
    }

    if (!page) {
        return (
            <Layout>
                <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                    <p className="text-futuristic-gray mb-8">Página não encontrada ou ainda não publicada.</p>
                    <Link to="/" className="text-lime-green hover:underline flex items-center">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o início
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <SEOManager metadata={{
                title: page.meta_title || `${page.title} | AIMindset`,
                description: page.meta_description,
                keywords: page.keywords,
                type: 'article',
                canonicalUrl: `https://aimindset.com.br/pseo/${slug}`
            }} />

            <article className="max-w-4xl mx-auto px-4 py-12 md:py-20">
                <Link to="/" className="inline-flex items-center text-futuristic-gray hover:text-lime-green mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Link>

                <header className="mb-12">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                        {page.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-futuristic-gray text-sm">
                        <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-neon-purple" />
                            {new Date(page.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        {page.keywords && page.keywords.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-lime-green" />
                                <div className="flex gap-2">
                                    {page.keywords.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-xs bg-lime-green/10 text-lime-green px-2 py-1 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <Card className="glass-effect p-8 md:p-12 mb-12">
                    <div className="prose prose-invert prose-lime max-w-none prose-headings:text-white prose-a:text-lime-green">
                        <MarkdownLazy content={page.content} />
                    </div>
                </Card>

                <div className="mt-20 pt-12 border-t border-white/5 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Gostou deste conteúdo?</h2>
                    <p className="text-futuristic-gray mb-8">Inscreva-se na nossa newsletter para receber mais insights sobre IA.</p>
                    <Link to="/newsletter">
                        <Button size="lg" className="px-12">Assinar Newsletter</Button>
                    </Link>
                </div>
            </article>
        </Layout>
    );
};

export default PSEOArticle;
