import React, { useState } from 'react';
import { Monitor, Database, Activity, AlertTriangle, Bell, TestTube } from 'lucide-react';
import { BackendLogsTab } from './BackendLogsTab';
import { AppLogsTab } from './AppLogsTab';
import { SystemLogsTab } from './SystemLogsTab';
import AlertsManagement from './AlertsManagement';
import TestLogging from '../TestLogging';

export const LogsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'backend' | 'app' | 'system' | 'alerts' | 'test'>('backend');

  const subTabs = [
    { id: 'backend', label: 'Backend Logs', icon: Database, description: 'Logs de mudanças no banco de dados' },
    { id: 'app', label: 'App Logs', icon: Activity, description: 'Logs de eventos da aplicação' },
    { id: 'system', label: 'System Logs', icon: AlertTriangle, description: 'Logs do sistema e alertas' },
    { id: 'alerts', label: 'Alertas', icon: Bell, description: 'Gerenciar alertas automáticos' },
    { id: 'test', label: 'Test Logs', icon: TestTube, description: 'Testar inserção de logs' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white flex items-center">
            <Monitor className="w-8 h-8 mr-3 text-neon-purple" />
            Logs &amp; Monitoramento
          </h2>
          <p className="text-futuristic-gray text-sm mt-1">
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
              className={`flex items-center space-x-2 px-4 py-3 rounded-md font-montserrat font-medium transition-all duration-300 whitespace-nowrap min-w-0 ${
                activeSubTab === tab.id
                  ? 'bg-neon-gradient text-white shadow-lg'
                  : 'text-futuristic-gray hover:text-white hover:bg-dark-surface/50'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <div className="text-sm font-medium">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {activeSubTab === 'backend' && <BackendLogsTab />}
        {activeSubTab === 'app' && <AppLogsTab />}
        {activeSubTab === 'system' && <SystemLogsTab />}
        {activeSubTab === 'alerts' && <AlertsManagement />}
        {activeSubTab === 'test' && <TestLogging />}
      </div>
    </div>
  );
};