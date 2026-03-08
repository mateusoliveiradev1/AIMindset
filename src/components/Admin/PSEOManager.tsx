// src/components/Admin/PSEOManager.tsx
import React, { useState, useEffect } from 'react';
import {
    Database, Plus, Wand2, Search, Trash2, Edit3,
    ExternalLink, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { supabase } from '../../lib/supabase';
import { generatePSEOContent, generateMassPSEOVariables } from '../../utils/geminiPSEO';
import { toast } from 'sonner';

interface PSEOPage {
    id: string;
    template_name: string;
    slug: string;
    page_type: string;
    variables: any;
    is_published: boolean;
    created_at: string;
}

export const PSEOManager: React.FC = () => {
    const [pages, setPages] = useState<PSEOPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [pageType, setPageType] = useState('comparison');
    const [variables, setVariables] = useState('{\n  "subject": "IA",\n  "n": 5,\n  "year": 2024\n}');

    // Mass Gen states
    const [activeTab, setActiveTab] = useState<'individual' | 'bulk'>('individual');
    const [rootSubject, setRootSubject] = useState('');
    const [massCount, setMassCount] = useState(5);
    const [massProgress, setMassProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('programmatic_pages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPages(data || []);
        } catch (error) {
            console.error('Erro ao carregar pSEO pages:', error);
            toast.error('Erro ao carregar páginas pSEO.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (template: string, varsStr: string) => {
        try {
            const vars = JSON.parse(varsStr);
            setIsGenerating(true);
            toast.info('Gemini está gerando o conteúdo programático...');

            const content = await generatePSEOContent(template, vars);

            if (content) {
                const slug = template.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-');

                const { error } = await supabase.from('programmatic_pages').insert({
                    title: content.title || template,
                    template_name: template,
                    page_type: pageType,
                    variables: vars,
                    slug: slug,
                    content: content.content,
                    meta_title: content.metaTitle,
                    meta_description: content.metaDescription,
                    keywords: content.keywords,
                    is_published: true
                });

                if (error) throw error;

                toast.success('Página pSEO gerada e publicada com sucesso!');
                setShowForm(false);
                loadPages();
            }
        } catch (error) {
            console.error('Erro na geração pSEO:', error);
            toast.error('Erro ao gerar conteúdo com Gemini.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleMassGenerate = async () => {
        if (!rootSubject || !templateName) {
            toast.error('Informe o tema raiz e o template.');
            return;
        }

        try {
            setIsGenerating(true);
            toast.info('Descobrindo nichos e variações com Gemini...');

            const variations = await generateMassPSEOVariables(rootSubject, massCount);

            if (!variations || variations.length === 0) {
                throw new Error('Nenhuma variação gerada.');
            }

            setMassProgress({ current: 0, total: variations.length });
            toast.info(`Iniciando geração de ${variations.length} páginas...`);

            for (let i = 0; i < variations.length; i++) {
                const vars = variations[i];
                setMassProgress({ current: i + 1, total: variations.length });

                const content = await generatePSEOContent(templateName, vars);

                if (content) {
                    const slug = vars.subject?.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, '-') || `page-${Date.now()}`;

                    await supabase.from('programmatic_pages').insert({
                        title: content.title || templateName.replace('{subject}', vars.subject),
                        template_name: templateName,
                        page_type: pageType,
                        variables: vars,
                        slug: slug,
                        content: content.content,
                        meta_title: content.metaTitle,
                        meta_description: content.metaDescription,
                        keywords: content.keywords,
                        is_published: true
                    });
                }

                // Pequeno delay para evitar rate limiting agressivo
                await new Promise(r => setTimeout(r, 1000));
            }

            toast.success(`${variations.length} páginas pSEO geradas com sucesso!`);
            setShowForm(false);
            loadPages();
        } catch (error) {
            console.error('Erro na geração massiva:', error);
            toast.error('Falha na geração em massa.');
        } finally {
            setIsGenerating(false);
            setMassProgress({ current: 0, total: 0 });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir esta página permanentemente?')) return;

        try {
            const { error } = await supabase.from('programmatic_pages').delete().eq('id', id);
            if (error) throw error;
            toast.success('Página removida.');
            loadPages();
        } catch (error) {
            toast.error('Erro ao remover página.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <Database className="w-6 h-6 mr-2 text-neon-purple" />
                        Programmatic SEO (pSEO)
                    </h2>
                    <p className="text-futuristic-gray mt-1">Gere centenas de páginas otimizadas com IA automaticamente.</p>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    variant={showForm ? 'outline' : 'primary'}
                    className="flex items-center space-x-2"
                >
                    {showForm ? 'Cancelar' : <Plus className="w-4 h-4" />}
                    <span>{showForm ? 'Voltar' : 'Nova Página pSEO'}</span>
                </Button>
            </div>

            {showForm && (
                <Card className="glass-effect border-neon-purple/30">
                    <div className="p-6 space-y-4">
                        <div className="flex border-b border-white/10 mb-4">
                            <button
                                onClick={() => setActiveTab('individual')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'individual' ? 'text-lime-green border-b-2 border-lime-green' : 'text-futuristic-gray'}`}
                            >
                                Geração Individual
                            </button>
                            <button
                                onClick={() => setActiveTab('bulk')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'bulk' ? 'text-lime-green border-b-2 border-lime-green' : 'text-futuristic-gray'}`}
                            >
                                Geração em Massa (IA)
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Template da Página</label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    className="w-full bg-darker-surface border border-neon-purple/20 rounded px-4 py-2 text-white focus:ring-2 focus:ring-neon-purple"
                                    placeholder="Ex: Melhores ferramentas para {subject}"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Tipo de Página</label>
                                <select
                                    value={pageType}
                                    onChange={(e) => setPageType(e.target.value as any)}
                                    className="w-full bg-darker-surface border border-neon-purple/20 rounded px-4 py-2 text-white"
                                >
                                    <option value="comparison">Comparação</option>
                                    <option value="listicle">Lista/Listicle</option>
                                    <option value="guide">Guia Detalhado</option>
                                </select>
                            </div>
                        </div>

                        {activeTab === 'individual' ? (
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Variáveis (JSON)</label>
                                <textarea
                                    value={variables}
                                    onChange={(e) => setVariables(e.target.value)}
                                    rows={5}
                                    className="w-full bg-darker-surface border border-neon-purple/20 rounded px-4 py-2 text-white font-mono text-sm"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-lime-green/5 p-4 rounded-lg border border-lime-green/10">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Tema Raiz (Nicho)</label>
                                    <input
                                        type="text"
                                        value={rootSubject}
                                        onChange={(e) => setRootSubject(e.target.value)}
                                        className="w-full bg-darker-surface border border-neon-purple/20 rounded px-4 py-2 text-white"
                                        placeholder="Ex: Marketing Digital, Saúde, Finanças"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Qtd. de Páginas</label>
                                    <input
                                        type="number"
                                        value={massCount}
                                        onChange={(e) => setMassCount(parseInt(e.target.value))}
                                        className="w-full bg-darker-surface border border-neon-purple/20 rounded px-4 py-2 text-white"
                                        min={1}
                                        max={50}
                                    />
                                </div>
                            </div>
                        )}

                        {massProgress.total > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-futuristic-gray">
                                    <span>Processando {massProgress.current} de {massProgress.total}</span>
                                    <span>{Math.round((massProgress.current / massProgress.total) * 100)}%</span>
                                </div>
                                <div className="w-full bg-darker-surface h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-lime-green h-full transition-all duration-500"
                                        style={{ width: `${(massProgress.current / massProgress.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full py-3"
                            disabled={isGenerating || (activeTab === 'individual' ? !templateName : !rootSubject)}
                            onClick={activeTab === 'individual' ? () => handleGenerate(templateName, variables) : handleMassGenerate}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {activeTab === 'bulk' ? 'Gerando em Massa...' : 'Gerando com Gemini 1.5 Flash...'}
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    {activeTab === 'bulk' ? 'Iniciar Geração em Massa' : 'Gerar Página Otimizada'}
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-lime-green animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pages.map((page) => (
                        <Card key={page.id} className="glass-effect hover:border-lime-green/30 transition-all">
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold uppercase tracking-wider text-lime-green bg-lime-green/10 px-2 py-1 rounded">
                                        {page.page_type}
                                    </span>
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleDelete(page.id)} className="text-futuristic-gray hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h4 className="text-white font-semibold line-clamp-2">{page.template_name}</h4>

                                <div className="flex items-center text-xs text-futuristic-gray">
                                    <Search className="w-3 h-3 mr-1" />
                                    <span>/{page.slug}</span>
                                </div>

                                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                                    <span className="text-[10px] text-futuristic-gray italic">
                                        {new Date(page.created_at).toLocaleDateString()}
                                    </span>
                                    <a
                                        href={`/pseo/${page.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-lime-green flex items-center hover:underline"
                                    >
                                        Ver Página <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {pages.length === 0 && !showForm && (
                        <div className="col-span-full py-12 text-center">
                            <Database className="w-12 h-12 mx-auto text-futuristic-gray/20 mb-4" />
                            <p className="text-futuristic-gray">Nenhuma página pSEO gerada ainda.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>
                                Criar Primeiro Template
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
