import React, { useState } from 'react';
import { Monitor, Database, Activity, AlertTriangle, Bell, TestTube, BarChart3 } from 'lucide-react';
import { BackendLogsTab } from './BackendLogsTab';
import { AppLogsTab } from './AppLogsTab';
import { SystemLogsTab } from './SystemLogsTab';
import AlertsManagement from './AlertsManagement';
import TestLogging from '../TestLogging';
import LogsDashboard from './LogsDashboard';

export const LogsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'backend' | 'app' | 'system' | 'alerts' | 'test'>('dashboard');

  const subTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, description: 'Gráficos e estatísticas dos logs' },
    { id: 'backend', label: 'Backend Logs', icon: Database, description: 'Logs de mudanças no banco de dados' },
    { id: 'app', label: 'App Logs', icon: Activity, description: 'Logs de eventos da aplicação' },
    { id: 'system', label: 'System Logs', icon: AlertTriangle, description: 'Logs do sistema e alertas' },
    { id: 'alerts', label: 'Alertas', icon: Bell, description: 'Gerenciar alertas automáticos' },
    { id: 'test', label: 'Test Logs', icon: TestTube, description: 'Testar inserção de logs' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-orbitron font-bold text-white flex items-center">
            <Monitor className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 mr-2 sm:mr-3 text-neon-purple flex-shrink-0" />
            <span className="truncate">Logs &amp; Monitoramento</span>
          </h2>
          <p className="text-futuristic-gray text-xs sm:text-sm mt-1 hidden sm:block">
            Monitore atividades do sistema, eventos da aplicação e mudanças no banco de dados
          </p>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex space-x-1 bg-darker-surface/50 p-1 rounded-lg backdrop-blur-sm overflow-x-auto scrollbar-hide">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 rounded-md font-montserrat font-medium transition-all duration-300 whitespace-nowrap min-w-0 ${
                activeSubTab === tab.id
                  ? 'bg-neon-gradient text-white shadow-lg'
                  : 'text-futuristic-gray hover:text-white hover:bg-dark-surface/50'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm font-medium truncate">{tab.label}</div>
                <div className="text-xs opacity-75 hidden lg:block truncate">{tab.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
        {activeSubTab === 'dashboard' && <LogsDashboard />}
        {activeSubTab === 'backend' && <BackendLogsTab />}
        {activeSubTab === 'app' && <AppLogsTab />}
        {activeSubTab === 'system' && <SystemLogsTab />}
        {activeSubTab === 'alerts' && <AlertsManagement />}
        {activeSubTab === 'test' && <TestLogging />}
      </div>
    </div>
  );
};