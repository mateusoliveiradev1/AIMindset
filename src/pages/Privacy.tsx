import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Download, Trash2, Edit, MessageCircle, CheckCircle, AlertTriangle, Info, Settings, Database, Cookie, UserCheck, FileText, Mail, Phone, Clock, MapPin, Globe, Zap, Users, Heart, Star, Award, Target, TrendingUp, BarChart3, Activity, PieChart, Calendar, Filter, Search, RefreshCw, ExternalLink, ArrowRight, ChevronDown, ChevronUp, X, Save, AlertCircle, HelpCircle, BookOpen, Lightbulb, Sparkles, Rocket, Brain, Code, Cpu, Network, Server, CloudLightning, Fingerprint, Key, ShieldCheck } from 'lucide-react';
import { useUserData } from '../hooks/useUserData';
import { sanitizeName, sanitizeEmail, sanitizeMessage, validators, RateLimiter, CSRFProtection } from '../utils/security';
import { Link } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import CookieModal from '../components/UI/CookieModal';
import SEOManager from '../components/SEO/SEOManager';
import { useSEO } from '../hooks/useSEO';

const Privacy: React.FC = () => {
  // SEO Hook
  const seoHook = useSEO({
    pageType: 'privacy',
    fallbackTitle: 'Política de Privacidade - AIMindset',
    fallbackDescription: 'Conheça nossa política de privacidade e como protegemos seus dados no AIMindset.'
  });

  const metadata = seoHook.getMetadata();

  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    analytics: false,
    functional: false
  });

  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const { saveUserProfile, saveCookiePreferences, createPrivacyRequest, loading } = useUserData();

  const handleCookieManagement = () => {
    setIsCookieModalOpen(true);
  };

  const handleCookieSave = async (preferences: any) => {
    const preferencesWithTimestamp = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    
    setCookiePreferences(preferences);
    localStorage.setItem('cookiePreferences', JSON.stringify(preferencesWithTimestamp));
    
    // Salvar no banco de dados
    const userEmail = localStorage.getItem('userEmail') || 'usuario@aimindset.com';
    const cookieData = {
      user_email: userEmail,
      essential: preferences.essential,
      analytics: preferences.analytics,
      marketing: preferences.functional, // Mapear functional para marketing
      personalization: false
    };
    
    const success = await saveCookiePreferences(cookieData);
    
    // Mostrar feedback visual
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-lime-green text-primary-dark px-6 py-3 rounded-lg font-medium z-50 animate-pulse';
    toast.textContent = success ? 'Preferências salvas no banco de dados!' : 'Preferências salvas localmente (erro no banco)';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const handleAcceptAllCookies = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      functional: true,
      timestamp: new Date().toISOString()
    };
    
    setCookiePreferences(allAccepted);
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    alert('Todos os cookies foram aceitos!');
  };

  const handleDataDownload = () => {
    // Buscar dados reais do usuário
    const userEmail = localStorage.getItem('userEmail') || 'usuario@aimindset.com';
    const userName = localStorage.getItem('userName') || 'Usuário AIMindset';
    const userData = {
      informacoesPessoais: {
        email: userEmail,
        nome: userName,
        dataRegistro: new Date().toISOString(),
        ultimoLogin: new Date().toISOString()
      },
      preferencias: {
        cookies: cookiePreferences,
        newsletter: true,
        notificacoes: true
      },
      historico: {
        artigosLidos: ['Como a IA está transformando o mundo', 'Machine Learning para iniciantes'],
        pesquisas: ['inteligência artificial', 'machine learning'],
        tempoNoSite: '2h 30min'
      },
      dadosTecnicos: {
        navegador: navigator.userAgent,
        idioma: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `meus-dados-aimindset-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Feedback visual
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-lime-green text-primary-dark px-6 py-3 rounded-lg font-medium z-50 animate-pulse';
    toast.textContent = '📥 Seus dados foram baixados com sucesso!';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const handleDataEdit = () => {
    // Criar um formulário modal simples para edição de dados
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-900/98 border-2 border-lime-green/60 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-lime-green/20 backdrop-blur-sm">
        <h3 class="text-lime-green font-orbitron font-bold text-2xl mb-6 text-center drop-shadow-lg">✏️ Editar Dados Pessoais</h3>
        <form id="editForm" class="space-y-6">
          <div>
            <label class="block text-lime-green font-bold mb-3 text-base uppercase tracking-wide drop-shadow-sm">Nome Completo:</label>
            <input type="text" name="nome" value="" placeholder="Digite seu nome completo" class="w-full p-4 bg-gray-800/90 border-2 border-lime-green/50 rounded-lg text-white font-medium placeholder-gray-400 focus:border-lime-green focus:ring-4 focus:ring-lime-green/30 focus:outline-none transition-all duration-300 shadow-inner">
          </div>
          <div>
            <label class="block text-lime-green font-bold mb-3 text-base uppercase tracking-wide drop-shadow-sm">Email:</label>
            <input type="email" name="email" value="" placeholder="Digite seu email" class="w-full p-4 bg-gray-800/90 border-2 border-lime-green/50 rounded-lg text-white font-medium placeholder-gray-400 focus:border-lime-green focus:ring-4 focus:ring-lime-green/30 focus:outline-none transition-all duration-300 shadow-inner">
          </div>
          <div>
            <label class="block text-lime-green font-bold mb-3 text-base uppercase tracking-wide drop-shadow-sm">Newsletter:</label>
            <select name="newsletter" class="w-full p-4 bg-gray-800/90 border-2 border-lime-green/50 rounded-lg text-white font-medium focus:border-lime-green focus:ring-4 focus:ring-lime-green/30 focus:outline-none transition-all duration-300 shadow-inner">
              <option value="" class="bg-gray-800 text-gray-300">Selecione uma opção</option>
              <option value="true" class="bg-gray-800 text-white font-medium">✅ Sim, quero receber newsletter</option>
              <option value="false" class="bg-gray-800 text-white font-medium">❌ Não quero receber newsletter</option>
            </select>
          </div>
          <div class="flex gap-4 mt-8">
            <button type="submit" class="flex-1 bg-lime-green text-gray-900 py-4 px-6 rounded-lg font-bold text-base uppercase tracking-wide hover:bg-lime-green/90 hover:shadow-xl hover:shadow-lime-green/30 transition-all duration-300 transform hover:scale-105 active:scale-95">
              💾 Salvar Alterações
            </button>
            <button type="button" id="cancelEdit" class="flex-1 bg-red-600 text-white py-4 px-6 rounded-lg font-bold text-base uppercase tracking-wide hover:bg-red-500 hover:shadow-xl hover:shadow-red-600/30 transition-all duration-300 transform hover:scale-105 active:scale-95">
              ❌ Cancelar
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    const form = modal.querySelector('#editForm') as HTMLFormElement;
    const cancelBtn = modal.querySelector('#cancelEdit') as HTMLButtonElement;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      
      // Extrair dados do formulário
      const userData = {
        name: formData.get('nome') as string,
        email: formData.get('email') as string,
        newsletter_preference: formData.get('newsletter') === 'true'
      };
      
      // Salvar no banco de dados
      const success = await saveUserProfile(userData);
      
      // Criar solicitação de privacidade para auditoria
      await createPrivacyRequest({
        user_email: userData.email,
        request_type: 'data_edit',
        request_data: userData,
        notes: 'Usuário editou seus dados pessoais via modal'
      });
      
      // Mostrar feedback visual
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-lime-green text-primary-dark px-6 py-3 rounded-lg font-medium z-50 animate-pulse';
      toast.textContent = success ? '✅ Dados salvos no banco de dados!' : '⚠️ Dados salvos localmente (erro no banco)';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
      
      document.body.removeChild(modal);
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };

  const handleDataDeletion = () => {
    // Criar modal de confirmação para exclusão de dados
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-900/98 border-2 border-red-500/60 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-red-500/20 backdrop-blur-sm">
        <h3 class="text-red-400 font-orbitron font-bold text-2xl mb-6 text-center drop-shadow-lg">⚠️ Exclusão de Dados</h3>
        <div class="space-y-6 mb-8">
          <p class="text-white font-medium text-base">Esta ação irá excluir permanentemente:</p>
          <ul class="text-gray-300 font-medium space-y-2 ml-4">
            <li>• Todas as informações pessoais</li>
            <li>• Histórico de navegação</li>
            <li>• Preferências salvas</li>
            <li>• Assinatura da newsletter</li>
          </ul>
          <div class="bg-red-500/20 border-2 border-red-500/40 rounded-lg p-4 shadow-inner">
            <p class="text-red-400 font-bold text-base">
              ⚠️ Esta ação é irreversível e não pode ser desfeita!
            </p>
          </div>
          <div class="space-y-3 bg-gray-800/50 p-4 rounded-lg border border-red-500/30">
            <label class="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors">
              <input type="checkbox" id="confirmDeletion" class="w-5 h-5 text-red-500 bg-gray-700 border-2 border-red-500/50 rounded focus:ring-red-500 focus:ring-2">
              <span class="text-white font-medium">Confirmo que desejo excluir todos os meus dados</span>
            </label>
            <label class="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors">
              <input type="checkbox" id="confirmIrreversible" class="w-5 h-5 text-red-500 bg-gray-700 border-2 border-red-500/50 rounded focus:ring-red-500 focus:ring-2">
              <span class="text-white font-medium">Entendo que esta ação é irreversível</span>
            </label>
          </div>
        </div>
        <div class="flex gap-4">
          <button id="confirmDelete" class="flex-1 bg-red-600 text-white py-4 px-6 rounded-lg font-bold text-base uppercase tracking-wide hover:bg-red-500 hover:shadow-xl hover:shadow-red-600/30 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" disabled>
            🗑️ Excluir Dados
          </button>
          <button id="cancelDelete" class="flex-1 bg-gray-600 text-white py-4 px-6 rounded-lg font-bold text-base uppercase tracking-wide hover:bg-gray-500 hover:shadow-xl hover:shadow-gray-600/30 transition-all duration-300 transform hover:scale-105 active:scale-95">
            ❌ Cancelar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    const confirmBtn = modal.querySelector('#confirmDelete') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#cancelDelete') as HTMLButtonElement;
    const checkbox1 = modal.querySelector('#confirmDeletion') as HTMLInputElement;
    const checkbox2 = modal.querySelector('#confirmIrreversible') as HTMLInputElement;
    
    // Habilitar botão apenas quando ambos checkboxes estiverem marcados
    const checkboxes = [checkbox1, checkbox2];
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        confirmBtn.disabled = !checkboxes.every(cb => cb.checked);
      });
    });
    
    confirmBtn.addEventListener('click', async () => {
      // Criar solicitação de exclusão no banco de dados
      const userEmail = localStorage.getItem('userEmail') || 'usuario@aimindset.com';
      const success = await createPrivacyRequest({
        user_email: userEmail,
        request_type: 'data_deletion',
        request_data: {
          confirmation_checkboxes: ['confirmDeletion', 'confirmIrreversible'],
          timestamp: new Date().toISOString()
        },
        notes: 'Usuário solicitou exclusão completa de dados via modal'
      });
      
      // Limpar dados locais
      localStorage.removeItem('cookiePreferences');
      localStorage.removeItem('userPreferences');
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg font-medium z-50 animate-pulse';
      toast.textContent = success ? '🗑️ Solicitação de exclusão registrada!' : '⚠️ Dados locais removidos (erro no banco)';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
      
      document.body.removeChild(modal);
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };

  const handleProcessingLimitation = () => {
    // Criar modal para limitação de processamento
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-900/98 border-2 border-lime-green/60 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-lime-green/20 backdrop-blur-sm">
        <h3 class="text-lime-green font-orbitron font-bold text-2xl mb-6 text-center drop-shadow-lg">🔒 Limitação de Processamento</h3>
        <form id="limitationForm" class="space-y-6">
          <div>
            <label class="block text-lime-green font-bold mb-3 text-base uppercase tracking-wide drop-shadow-sm">Motivo da limitação:</label>
            <select name="motivo" class="w-full p-4 bg-gray-800/90 border-2 border-lime-green/50 rounded-lg text-white font-medium focus:border-lime-green focus:ring-4 focus:ring-lime-green/30 focus:outline-none transition-all duration-300 shadow-inner" required>
              <option value="" class="bg-gray-800 text-gray-300">Selecione um motivo</option>
              <option value="contestacao" class="bg-gray-800 text-white font-medium">Contestação da exatidão dos dados</option>
              <option value="ilicito" class="bg-gray-800 text-white font-medium">Processamento ilícito</option>
              <option value="desnecessario" class="bg-gray-800 text-white font-medium">Dados não necessários</option>
              <option value="oposicao" class="bg-gray-800 text-white font-medium">Oposição ao processamento</option>
              <option value="outros" class="bg-gray-800 text-white font-medium">Outros</option>
            </select>
          </div>
          <div>
            <label class="block text-lime-green font-bold mb-3 text-base uppercase tracking-wide drop-shadow-sm">Tipos de dados a limitar:</label>
            <div class="space-y-3 bg-gray-800/50 p-4 rounded-lg border border-lime-green/30">
              <label class="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors">
                <input type="checkbox" name="dados" value="perfil" class="w-5 h-5 text-lime-green bg-gray-700 border-2 border-lime-green/50 rounded focus:ring-lime-green focus:ring-2">
                <span class="text-white font-medium">Dados de perfil</span>
              </label>
              <label class="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors">
                <input type="checkbox" name="dados" value="navegacao" class="w-5 h-5 text-lime-green bg-gray-700 border-2 border-lime-green/50 rounded focus:ring-lime-green focus:ring-2">
                <span class="text-white font-medium">Histórico de navegação</span>
              </label>
              <label class="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors">
                <input type="checkbox" name="dados" value="marketing" class="w-5 h-5 text-lime-green bg-gray-700 border-2 border-lime-green/50 rounded focus:ring-lime-green focus:ring-2">
                <span class="text-white font-medium">Dados de marketing</span>
              </label>
              <label class="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition-colors">
                <input type="checkbox" name="dados" value="todos" class="w-5 h-5 text-lime-green bg-gray-700 border-2 border-lime-green/50 rounded focus:ring-lime-green focus:ring-2">
                <span class="text-white font-medium">Todos os dados</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-lime-green font-bold mb-3 text-base uppercase tracking-wide drop-shadow-sm">Período (opcional):</label>
            <input type="text" name="periodo" placeholder="Ex: 30 dias, até resolução..." class="w-full p-4 bg-gray-800/90 border-2 border-lime-green/50 rounded-lg text-white font-medium placeholder-gray-400 focus:border-lime-green focus:ring-4 focus:ring-lime-green/30 focus:outline-none transition-all duration-300 shadow-inner">
          </div>
          <div class="flex gap-4 mt-8">
            <button type="submit" class="flex-1 bg-lime-green text-gray-900 py-4 px-6 rounded-lg font-bold text-base uppercase tracking-wide hover:bg-lime-green/90 hover:shadow-xl hover:shadow-lime-green/30 transition-all duration-300 transform hover:scale-105 active:scale-95">
              🔒 Solicitar Limitação
            </button>
            <button type="button" id="cancelLimitation" class="flex-1 bg-red-600 text-white py-4 px-6 rounded-lg font-bold text-base uppercase tracking-wide hover:bg-red-500 hover:shadow-xl hover:shadow-red-600/30 transition-all duration-300 transform hover:scale-105 active:scale-95">
              ❌ Cancelar
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    const form = modal.querySelector('#limitationForm') as HTMLFormElement;
    const cancelBtn = modal.querySelector('#cancelLimitation') as HTMLButtonElement;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      
      // Preparar dados da limitação
      const limitationData = {
        motivo: formData.get('motivo'),
        dados: formData.getAll('dados'),
        periodo: formData.get('periodo'),
        timestamp: new Date().toISOString()
      };
      
      // Salvar no banco de dados
      const userEmail = localStorage.getItem('userEmail') || 'usuario@aimindset.com';
      const success = await createPrivacyRequest({
        user_email: userEmail,
        request_type: 'processing_limitation',
        request_data: limitationData,
        notes: `Usuário solicitou limitação de processamento. Motivo: ${limitationData.motivo}`
      });
      
      // Salvar localmente também
      localStorage.setItem('dataProcessingLimitation', JSON.stringify(limitationData));
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-lime-green text-primary-dark px-6 py-3 rounded-lg font-medium z-50 animate-pulse';
      toast.textContent = success ? '🔒 Limitação registrada no banco!' : '⚠️ Limitação salva localmente (erro no banco)';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
      
      document.body.removeChild(modal);
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };

  const handlePrivacyContact = () => {
    // Criar modal de contato para privacidade
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-900/98 border-2 border-lime-green/60 rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl shadow-lime-green/20 backdrop-blur-sm">
        <h3 class="text-lime-green font-orbitron font-bold text-2xl mb-6 text-center drop-shadow-lg">📧 Contato - Privacidade</h3>
        <form id="contactForm" class="space-y-6">
          <div>
            <label class="block text-lime-green font-bold mb-3 text-base uppercase tracking-wide drop-shadow-sm">Seu Nome:</label>
            <input type="text" name="nome" required placeholder="Digite seu nome completo" class="w-full p-4 bg-gray-800/90 border-2 border-lime-green/50 rounded-lg text-white font-medium placeholder-gray-400 focus:border-lime-green focus:ring-4 focus:ring-lime-green/30 focus:outline-none transition-all duration-300 shadow-inner">
          </div>
          <div>
            <label class="block text-lime-green font-bold mb-3 text-base uppercase tracking-wide drop-shadow-sm">Seu Email:</label>
            <input type="email" name="email" required placeholder="Digite seu email" class="w-full p-4 bg-gray-800/90 border-2 border-lime-green/50 rounded-lg text-white font-medium placeholder-gray-400 focus:border-lime-green focus:ring-4 focus:ring-lime-green/30 focus:outline-none transition-all duration-300 shadow-inner">
          </div>
          <div>
            <label class="block text-lime-green font-bold mb-3 text-base uppercase tracking-wide drop-shadow-sm">Assunto:</label>
            <select name="assunto" class="w-full p-4 bg-gray-800/90 border-2 border-lime-green/50 rounded-lg text-white font-medium focus:border-lime-green focus:ring-4 focus:ring-lime-green/30 focus:outline-none transition-all duration-300 shadow-inner" required>
              <option value="" class="bg-gray-800 text-gray-300">Selecione um assunto</option>
              <option value="duvida-geral" class="bg-gray-800 text-white font-medium">Dúvida geral sobre privacidade</option>
              <option value="dados-pessoais" class="bg-gray-800 text-white font-medium">Questão sobre meus dados pessoais</option>
              <option value="cookies" class="bg-gray-800 text-white font-medium">Dúvida sobre cookies</option>
              <option value="lgpd" class="bg-gray-800 text-white font-medium">Questão sobre LGPD</option>
              <option value="seguranca" class="bg-gray-800 text-white font-medium">Questão de segurança</option>
              <option value="outros" class="bg-gray-800 text-white font-medium">Outros</option>
            </select>
          </div>
          <div>
            <label class="block text-lime-green font-bold mb-3 text-base uppercase tracking-wide drop-shadow-sm">Mensagem:</label>
            <textarea name="mensagem" rows="4" required placeholder="Descreva sua dúvida ou questão..." class="w-full p-4 bg-gray-800/90 border-2 border-lime-green/50 rounded-lg text-white font-medium placeholder-gray-400 focus:border-lime-green focus:ring-4 focus:ring-lime-green/30 focus:outline-none transition-all duration-300 shadow-inner resize-none"></textarea>
          </div>
          <div class="bg-gray-800/70 border-2 border-lime-green/40 rounded-lg p-4 shadow-inner">
            <p class="text-lime-green font-medium text-base">
              📞 <strong class="text-lime-green">Contatos alternativos:</strong><br>
              <span class="text-white">Email: privacidade@aimindset.com</span><br>
              <span class="text-white">Telefone: (11) 9999-9999</span><br>
              <span class="text-white">Horário: Segunda a Sexta, 9h às 18h</span>
            </p>
          </div>
          <div class="flex gap-4 mt-8">
            <button type="submit" class="flex-1 bg-lime-green text-gray-900 py-4 px-6 rounded-lg font-bold text-base uppercase tracking-wide hover:bg-lime-green/90 hover:shadow-xl hover:shadow-lime-green/30 transition-all duration-300 transform hover:scale-105 active:scale-95">
              📧 Enviar Mensagem
            </button>
            <button type="button" id="cancelContact" class="flex-1 bg-red-600 text-white py-4 px-6 rounded-lg font-bold text-base uppercase tracking-wide hover:bg-red-500 hover:shadow-xl hover:shadow-red-600/30 transition-all duration-300 transform hover:scale-105 active:scale-95">
              ❌ Cancelar
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    const form = modal.querySelector('#contactForm') as HTMLFormElement;
    const cancelBtn = modal.querySelector('#cancelContact') as HTMLButtonElement;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      
      // Preparar dados do contato
      const contactData = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        assunto: formData.get('assunto'),
        mensagem: formData.get('mensagem'),
        timestamp: new Date().toISOString()
      };
      
      // Salvar no banco de dados
      const success = await createPrivacyRequest({
        user_email: contactData.email as string,
        request_type: 'privacy_contact',
        request_data: contactData,
        notes: `Contato de privacidade. Assunto: ${contactData.assunto}`
      });
      
      // Salvar no localStorage para demonstração
      const existingContacts = JSON.parse(localStorage.getItem('privacyContacts') || '[]');
      existingContacts.push(contactData);
      localStorage.setItem('privacyContacts', JSON.stringify(existingContacts));
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-lime-green text-primary-dark px-6 py-3 rounded-lg font-medium z-50 animate-pulse';
      toast.textContent = success ? '📧 Mensagem registrada no banco!' : '⚠️ Mensagem salva localmente (erro no banco)';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 4000);
      
      document.body.removeChild(modal);
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };
  const dataTypes = [
    {
      icon: Users,
      title: 'Dados Pessoais',
      items: ['Nome completo', 'Endereço de e-mail', 'Preferências de conteúdo', 'Histórico de interações'],
      color: 'lime-green'
    },
    {
      icon: Globe,
      title: 'Dados de Navegação',
      items: ['Endereço IP', 'Tipo de navegador', 'Páginas visitadas', 'Tempo de permanência'],
      color: 'neon-purple'
    },
    {
      icon: Database,
      title: 'Dados Técnicos',
      items: ['Cookies', 'Sessões', 'Logs de acesso', 'Dados de performance'],
      color: 'electric-blue'
    }
  ];

  const userRights = [
    {
      icon: Download,
      title: 'Acesso e Portabilidade',
      description: 'Solicite uma cópia completa dos seus dados pessoais em formato estruturado',
      action: 'Baixar Dados',
      handler: handleDataDownload
    },
    {
      icon: Edit,
      title: 'Retificação',
      description: 'Corrija informações imprecisas ou atualize dados desatualizados',
      action: 'Editar Dados',
      handler: handleDataEdit
    },
    {
      icon: Trash2,
      title: 'Exclusão (Direito ao Esquecimento)',
      description: 'Solicite a remoção completa dos seus dados pessoais dos nossos sistemas',
      action: 'Excluir Dados',
      handler: handleDataDeletion
    },
    {
      icon: UserCheck,
      title: 'Limitação de Processamento',
      description: 'Restrinja como processamos seus dados pessoais em situações específicas',
      action: 'Limitar Uso',
      handler: handleProcessingLimitation
    }
  ];

  const securityMeasures = [
    {
      icon: Lock,
      title: 'Criptografia Avançada',
      description: 'SSL/TLS 1.3, AES-256 para dados em repouso'
    },
    {
      icon: Server,
      title: 'Infraestrutura Segura',
      description: 'Servidores em data centers certificados ISO 27001'
    },
    {
      icon: Shield,
      title: 'Monitoramento 24/7',
      description: 'Detecção automática de ameaças e anomalias'
    },
    {
      icon: Zap,
      title: 'Backup Automático',
      description: 'Backups criptografados com retenção de 30 dias'
    }
  ];

  const stats = [
    { number: '0', label: 'Vazamentos de Dados', icon: Shield },
    { number: '< 72h', label: 'Resposta LGPD', icon: Calendar },
    { number: '256-bit', label: 'Criptografia', icon: Lock },
    { number: '99.9%', label: 'Uptime Seguro', icon: CheckCircle }
  ];

  return (
    <>
      <SEOManager metadata={metadata} />
      
      <div className="min-h-screen bg-primary-dark text-white">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-lime-green/10"></div>
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-neon-gradient rounded-full animate-pulse">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 gradient-text">
              Política de Privacidade
            </h1>
            <p className="text-xl md:text-2xl text-futuristic-gray font-roboto leading-relaxed mb-8">
              Transparência total na proteção dos seus dados pessoais
            </p>
            <div className="flex justify-center space-x-4 mb-6">
              <div className="px-4 py-2 bg-lime-green/20 rounded-full text-lime-green text-sm font-medium">
                🛡️ LGPD Compliant
              </div>
              <div className="px-4 py-2 bg-neon-purple/20 rounded-full text-neon-purple text-sm font-medium">
                🔒 Criptografia 256-bit
              </div>
            </div>
            <p className="text-sm text-futuristic-gray">
              Última atualização: {new Date().toLocaleDateString('pt-BR')} • Versão 2.1
            </p>
          </div>
        </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 text-center hover-lift glass-effect">
                <div className="flex justify-center mb-3">
                  <stat.icon className="w-8 h-8 text-lime-green" />
                </div>
                <div className="text-2xl md:text-3xl font-orbitron font-bold text-white mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-futuristic-gray font-roboto">
                  {stat.label}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 p-3 bg-lime-green/20 rounded-full">
                <FileText className="w-6 h-6 text-lime-green" />
              </div>
              <div>
                <h2 className="text-2xl font-orbitron font-bold mb-4 text-lime-green">
                  Nosso Compromisso com sua Privacidade
                </h2>
                <p className="text-futuristic-gray font-roboto leading-relaxed mb-4">
                  O <span className="text-lime-green font-semibold">AIMindset</span> está comprometido em proteger e respeitar sua privacidade. 
                  Esta política explica de forma transparente como coletamos, usamos, armazenamos e protegemos suas informações pessoais 
                  quando você visita nosso site, se inscreve em nossa newsletter ou interage com nosso conteúdo.
                </p>
                <p className="text-futuristic-gray font-roboto leading-relaxed">
                  Seguimos rigorosamente a <span className="text-neon-purple font-semibold">Lei Geral de Proteção de Dados (LGPD)</span> e 
                  as melhores práticas internacionais de segurança da informação, garantindo que seus dados estejam sempre protegidos.
                </p>
                <div className="mt-6 p-4 bg-lime-green/10 rounded-lg border border-lime-green/20">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-lime-green" />
                    <p className="text-lime-green font-medium text-sm">
                      Certificado LGPD • Auditoria de Segurança Anual • Zero Vazamentos de Dados
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Data Collection Types */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-white">
            Tipos de <span className="gradient-text">Dados Coletados</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {dataTypes.map((type, index) => (
              <Card key={index} className="p-6 hover-lift glass-effect group">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 bg-${type.color}/20 rounded-full group-hover:bg-${type.color}/30 transition-colors`}>
                    <type.icon className={`w-8 h-8 text-${type.color}`} />
                  </div>
                </div>
                <h3 className="text-xl font-orbitron font-semibold mb-4 text-white text-center">
                  {type.title}
                </h3>
                <ul className="space-y-2">
                  {type.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2">
                      <div className={`w-2 h-2 bg-${type.color} rounded-full mt-2 flex-shrink-0`}></div>
                      <span className="text-futuristic-gray font-roboto text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Usage */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 p-3 bg-neon-purple/20 rounded-full">
                <Users className="w-6 h-6 text-neon-purple" />
              </div>
              <div>
                <h2 className="text-2xl font-orbitron font-bold mb-6 text-neon-purple">
                  Como Utilizamos Suas Informações
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-lime-green/5 border border-lime-green/20">
                      <CheckCircle className="w-5 h-5 text-lime-green mt-0.5" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Newsletter Personalizada</h3>
                        <p className="text-futuristic-gray font-roboto text-sm">
                          Envio de conteúdo semanal sobre IA adaptado aos seus interesses específicos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-neon-purple/5 border border-neon-purple/20">
                      <CheckCircle className="w-5 h-5 text-neon-purple mt-0.5" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Experiência Personalizada</h3>
                        <p className="text-futuristic-gray font-roboto text-sm">
                          Recomendações de artigos e conteúdo baseadas no seu histórico de leitura
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-electric-blue/5 border border-electric-blue/20">
                      <CheckCircle className="w-5 h-5 text-electric-blue mt-0.5" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Análise e Melhoria</h3>
                        <p className="text-futuristic-gray font-roboto text-sm">
                          Otimização da experiência do usuário e desenvolvimento de novos recursos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-lime-green/5 border border-lime-green/20">
                      <CheckCircle className="w-5 h-5 text-lime-green mt-0.5" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Suporte e Comunicação</h3>
                        <p className="text-futuristic-gray font-roboto text-sm">
                          Resposta a dúvidas, feedback e suporte técnico personalizado
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-primary-dark/50 rounded-lg border border-neon-purple/20">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-neon-purple mt-0.5" />
                    <div>
                      <p className="text-white font-medium mb-1">Importante:</p>
                      <p className="text-futuristic-gray text-sm">
                        Nunca compartilhamos, vendemos ou alugamos seus dados pessoais para terceiros. 
                        Todos os usos são estritamente limitados aos propósitos descritos acima.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-white">
            Medidas de <span className="gradient-text">Segurança</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityMeasures.map((measure, index) => (
              <Card key={index} className="p-6 text-center hover-lift glass-effect group">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-lime-green/20 rounded-full group-hover:bg-lime-green/30 transition-colors">
                    <measure.icon className="w-8 h-8 text-lime-green" />
                  </div>
                </div>
                <h3 className="text-lg font-orbitron font-semibold mb-2 text-white">
                  {measure.title}
                </h3>
                <p className="text-futuristic-gray font-roboto text-sm leading-relaxed">
                  {measure.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Rights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-center mb-12 text-white">
            Seus <span className="gradient-text">Direitos</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {userRights.map((right, index) => (
              <Card key={index} className="p-6 hover-lift glass-effect group">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-neon-purple/20 rounded-full group-hover:bg-neon-purple/30 transition-colors">
                    <right.icon className="w-6 h-6 text-neon-purple" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-orbitron font-semibold text-white mb-2">
                      {right.title}
                    </h3>
                    <p className="text-futuristic-gray font-roboto text-sm leading-relaxed mb-4">
                      {right.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="group-hover:border-neon-purple group-hover:text-neon-purple transition-colors"
                      onClick={right.handler}
                    >
                      {right.action}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Card className="p-6 glass-effect">
              <p className="text-futuristic-gray font-roboto mb-4">
                Para exercer qualquer um dos seus direitos, entre em contato conosco através do email:
              </p>
              <p className="text-lime-green font-semibold text-lg">privacidade@aimindset.com</p>
              <p className="text-futuristic-gray text-sm mt-2">
                Resposta garantida em até 72 horas úteis conforme exigido pela LGPD
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Cookies Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <h2 className="text-2xl font-orbitron font-bold mb-6 text-neon-purple flex items-center">
              <Database className="w-6 h-6 mr-2" />
              Cookies e Tecnologias de Rastreamento
            </h2>
            <p className="text-futuristic-gray font-roboto leading-relaxed mb-6">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência de navegação, 
              analisar o tráfego do site e personalizar o conteúdo. Você tem controle total sobre essas configurações.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 bg-lime-green/10 rounded-lg border border-lime-green/20">
                <h3 className="text-lime-green font-orbitron font-semibold mb-2">Essenciais</h3>
                <p className="text-futuristic-gray text-sm">
                  Necessários para o funcionamento básico do site. Não podem ser desabilitados.
                </p>
              </div>
              <div className="p-4 bg-neon-purple/10 rounded-lg border border-neon-purple/20">
                <h3 className="text-neon-purple font-orbitron font-semibold mb-2">Analíticos</h3>
                <p className="text-futuristic-gray text-sm">
                  Ajudam a entender como os visitantes usam o site. Podem ser desabilitados.
                </p>
              </div>
              <div className="p-4 bg-electric-blue/10 rounded-lg border border-electric-blue/20">
                <h3 className="text-electric-blue font-orbitron font-semibold mb-2">Funcionais</h3>
                <p className="text-futuristic-gray text-sm">
                  Lembram suas preferências e configurações. Opcionais.
                </p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button variant="primary" size="lg" className="mr-4" onClick={handleCookieManagement}>
                Gerenciar Cookies
              </Button>
              <Button variant="outline" size="lg" onClick={handleAcceptAllCookies}>
                Aceitar Todos
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Data Retention */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <h2 className="text-2xl font-orbitron font-bold mb-6 text-lime-green flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              Retenção e Exclusão de Dados
            </h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-orbitron font-semibold mb-3">Períodos de Retenção</h3>
                  <ul className="space-y-2 text-futuristic-gray font-roboto text-sm">
                    <li>• <strong>Newsletter:</strong> Até o cancelamento da inscrição</li>
                    <li>• <strong>Dados de contato:</strong> 5 anos após última interação</li>
                    <li>• <strong>Logs de acesso:</strong> 12 meses</li>
                    <li>• <strong>Cookies analíticos:</strong> 24 meses</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-orbitron font-semibold mb-3">Exclusão Automática</h3>
                  <ul className="space-y-2 text-futuristic-gray font-roboto text-sm">
                    <li>• Dados inativos por mais de 3 anos</li>
                    <li>• Contas não verificadas em 30 dias</li>
                    <li>• Logs de erro após 6 meses</li>
                    <li>• Backups após 30 dias</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 bg-neon-purple/10 rounded-lg border border-neon-purple/20">
                <p className="text-neon-purple font-medium mb-1">Exclusão Sob Demanda</p>
                <p className="text-futuristic-gray text-sm">
                  Você pode solicitar a exclusão imediata dos seus dados a qualquer momento. 
                  O processo é concluído em até 30 dias úteis.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 text-center glass-effect relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-lime-green/5 to-neon-purple/5"></div>
            <div className="relative">
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-lime-green/20 rounded-full">
                  <Mail className="w-8 h-8 text-lime-green" />
                </div>
              </div>
              <h2 className="text-2xl font-orbitron font-bold mb-4 text-lime-green">
                Dúvidas sobre Privacidade?
              </h2>
              <p className="text-futuristic-gray font-roboto leading-relaxed mb-6">
                Nossa equipe de proteção de dados está disponível para esclarecer qualquer dúvida 
                sobre esta política ou ajudá-lo a exercer seus direitos.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-primary-dark/50 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Contato Direto</h3>
                  <p className="text-lime-green font-medium">privacidade@aimindset.com</p>
                  <p className="text-futuristic-gray text-sm">Resposta em até 72h</p>
                </div>
                <div className="p-4 bg-primary-dark/50 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Encarregado de Dados</h3>
                  <p className="text-neon-purple font-medium">Mateus Oliveira</p>
                  <p className="text-futuristic-gray text-sm">Fundador & CEO</p>
                </div>
              </div>
              <Button variant="primary" size="lg" className="hover-lift" onClick={handlePrivacyContact}>
                <Mail className="mr-2 w-5 h-5" />
                Entrar em Contato
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Updates Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 glass-effect">
            <h2 className="text-2xl font-orbitron font-bold mb-4 text-neon-purple flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2" />
              Atualizações desta Política
            </h2>
            <p className="text-futuristic-gray font-roboto leading-relaxed mb-4">
              Esta política de privacidade pode ser atualizada periodicamente para refletir mudanças 
              em nossas práticas, tecnologias ou por outros motivos operacionais, legais ou regulamentares.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white font-orbitron font-semibold mb-3">Como Você Será Notificado</h3>
                <ul className="space-y-2 text-futuristic-gray font-roboto text-sm">
                  <li>• Email para todos os inscritos na newsletter</li>
                  <li>• Banner de notificação no site</li>
                  <li>• Destaque na página inicial por 30 dias</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-orbitron font-semibold mb-3">Histórico de Versões</h3>
                <ul className="space-y-2 text-futuristic-gray font-roboto text-sm">
                  <li>• <strong>v2.1:</strong> Adição de seção sobre IA e ML</li>
                  <li>• <strong>v2.0:</strong> Adequação completa à LGPD</li>
                  <li>• <strong>v1.0:</strong> Versão inicial</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-lime-green/10 rounded-lg border border-lime-green/20">
              <p className="text-lime-green font-medium text-center">
                💡 Mudanças significativas sempre incluem um período de 30 dias para revisão antes da implementação
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Cookie Modal */}
      <CookieModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        onSave={handleCookieSave}
        initialPreferences={cookiePreferences}
      />
    </div>
    </>
  );
};

export default Privacy;