// src/pages/PSEOArticle.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Tag, ArrowLeft, Wand2, ExternalLink } from 'lucide-react';
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
                <div className="min-h-screen flex items-center justify-center bg-darker-surface">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green shadow-[0_0_15px_rgba(163,230,53,0.5)]"></div>
                </div>
            </Layout>
        );
    }

    if (!page) {
        return (
            <Layout>
                <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-darker-surface">
                    <h1 className="text-6xl font-bold text-white mb-4 font-orbitron">404</h1>
                    <p className="text-futuristic-gray mb-8 font-roboto">Página não encontrada ou em manutenção.</p>
                    <Link to="/" className="text-lime-green hover:text-white flex items-center transition-all bg-white/5 px-6 py-3 rounded-full border border-white/10">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a Base
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
                canonicalUrl: `https://aimindset.com.br/pseo/${slug}`,
                schemaData: {
                    "@context": "https://schema.org",
                    "@type": "Article",
                    "headline": page.title,
                    "description": page.meta_description,
                    "author": {
                        "@type": "Organization",
                        "name": "AIMindset"
                    },
                    "datePublished": page.created_at,
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": `https://aimindset.com.br/pseo/${slug}`
                    }
                }
            }} />

            {/* Premium Hero Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-radial from-neon-purple/20 via-transparent to-transparent opacity-50 blur-3xl -z-10"></div>

                <div className="max-w-6xl mx-auto px-4">
                    <Link to="/" className="inline-flex items-center text-futuristic-gray hover:text-lime-green mb-12 transition-all group font-roboto text-sm uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Navigation / Base
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-8">
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <span className="px-3 py-1 bg-neon-purple/10 border border-neon-purple/20 text-neon-purple rounded text-[10px] font-orbitron tracking-tighter uppercase">
                                    Inteligência Artificial 2026
                                </span>
                                <div className="flex items-center text-futuristic-gray text-xs font-roboto">
                                    <Calendar className="w-3 h-3 mr-2 text-lime-green" />
                                    {new Date(page.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>

                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-8 font-orbitron tracking-tight">
                                {page.title}
                            </h1>

                            <div className="flex flex-wrap gap-2">
                                {page.keywords?.slice(0, 5).map(tag => (
                                    <span key={tag} className="text-[10px] font-roboto bg-white/5 text-futuristic-gray px-3 py-1 rounded-full border border-white/5 hover:border-lime-green/30 transition-colors">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Content Section */}
            <section className="max-w-6xl mx-auto px-4 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <main className="lg:col-span-8">
                        <Card className="glass-effect p-8 md:p-12 border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-lime-green/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="prose prose-invert prose-lime max-w-none 
                                prose-headings:font-orbitron prose-headings:tracking-tight prose-headings:text-white
                                prose-p:font-roboto prose-p:text-futuristic-gray prose-p:leading-relaxed prose-p:text-lg
                                prose-strong:text-white prose-strong:font-bold
                                prose-a:text-lime-green prose-a:no-underline hover:prose-a:underline
                                prose-img:rounded-2xl prose-img:border prose-img:border-white/10
                                prose-pre:bg-[#0A0F1A] prose-pre:border prose-pre:border-white/5
                                prose-table:border prose-table:border-white/10 prose-th:bg-white/5 prose-th:px-4 prose-th:py-3 prose-td:px-4 prose-td:py-3">
                                <MarkdownLazy>{page.content}</MarkdownLazy>
                            </div>
                        </Card>
                    </main>

                    {/* Sidebar / Contextual Utility */}
                    <aside className="lg:col-span-4 space-y-8">
                        <Card className="glass-effect p-6 border-white/10 sticky top-32">
                            <h3 className="text-white font-orbitron text-lg mb-6 flex items-center">
                                <Wand2 className="w-5 h-5 mr-3 text-lime-green" />
                                Master AI insights
                            </h3>
                            <p className="text-futuristic-gray font-roboto text-sm mb-8 leading-relaxed">
                                Este guia foi sintetizado por nossos algoritmos de análise de mercado para fornecer o máximo de clareza estratégica.
                            </p>

                            <Link to="/newsletter">
                                <Button className="w-full font-orbitron tracking-tighter shadow-[0_0_20px_rgba(163,230,53,0.2)]">
                                    Inscrever-se na Newsletter
                                </Button>
                            </Link>

                            <div className="mt-8 pt-8 border-t border-white/5">
                                <h4 className="text-white font-orbitron text-xs uppercase tracking-widest mb-4">Compartilhar</h4>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-futuristic-gray hover:text-lime-green hover:border-lime-green transition-all cursor-pointer">
                                        <ExternalLink className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </aside>
                </div>
            </section>
        </Layout>
    );
};

export default PSEOArticle;
