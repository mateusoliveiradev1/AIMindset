import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Filter, X } from 'lucide-react';
import Button from './Button';
import Card from './Card';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DateFiltersProps {
  onDateRangeChange: (range: DateRange | null) => void;
  className?: string;
}

export type DatePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';

const DateFilters: React.FC<DateFiltersProps> = ({ onDateRangeChange, className = '' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  // Função para calcular as datas baseadas no período selecionado
  const calculateDateRange = (period: DatePeriod): DateRange | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
        };
      
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          startDate: yesterday.toISOString(),
          endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
        };
      
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          startDate: weekAgo.toISOString(),
          endDate: now.toISOString()
        };
      
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          startDate: monthAgo.toISOString(),
          endDate: now.toISOString()
        };
      
      case 'custom':
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Fim do dia
          return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          };
        }
        return null;
      
      case 'all':
      default:
        return null;
    }
  };

  // Atualizar o range quando o período ou datas customizadas mudarem
  useEffect(() => {
    const range = calculateDateRange(selectedPeriod);
    onDateRangeChange(range);
  }, [selectedPeriod, customStartDate, customEndDate, onDateRangeChange]);

  const handlePeriodChange = (period: DatePeriod) => {
    setSelectedPeriod(period);
    setShowCustomInputs(period === 'custom');
    
    if (period !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const clearFilters = () => {
    setSelectedPeriod('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setShowCustomInputs(false);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const periods = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'today', label: 'Hoje', icon: Clock },
    { id: 'yesterday', label: 'Ontem', icon: Clock },
    { id: 'week', label: 'Última Semana', icon: Calendar },
    { id: 'month', label: 'Último Mês', icon: Calendar },
    { id: 'custom', label: 'Personalizado', icon: Calendar }
  ];

  const isActive = selectedPeriod !== 'all';

  return (
    <Card className={`glass-effect p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-neon-purple" />
            <span className="text-white font-medium text-sm">Filtros de Data</span>
            {isActive && (
              <div className="w-2 h-2 bg-neon-purple rounded-full animate-pulse"></div>
            )}
          </div>
          
          {isActive && (
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Period Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {periods.map((period) => {
            const Icon = period.icon;
            const isSelected = selectedPeriod === period.id;
            
            return (
              <Button
                key={period.id}
                onClick={() => handlePeriodChange(period.id as DatePeriod)}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`text-xs ${
                  isSelected 
                    ? 'bg-neon-gradient text-white border-neon-purple' 
                    : 'hover:border-neon-purple/50'
                }`}
              >
                <Icon className="w-3 h-3 mr-1" />
                {period.label}
              </Button>
            );
          })}
        </div>

        {/* Custom Date Inputs */}
        {showCustomInputs && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neon-purple/20">
            <div>
              <label className="block text-futuristic-gray text-xs mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                max={formatDateForInput(new Date())}
                className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white text-sm focus:outline-none focus:border-neon-purple/50 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-futuristic-gray text-xs mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
                max={formatDateForInput(new Date())}
                className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white text-sm focus:outline-none focus:border-neon-purple/50 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Active Filter Indicator */}
        {isActive && (
          <div className="text-xs text-neon-purple bg-neon-purple/10 px-2 py-1 rounded border border-neon-purple/20">
            <span className="font-medium">Filtro ativo:</span> {
              periods.find(p => p.id === selectedPeriod)?.label
            }
            {selectedPeriod === 'custom' && customStartDate && customEndDate && (
              <span className="ml-1">
                ({new Date(customStartDate).toLocaleDateString('pt-BR')} - {new Date(customEndDate).toLocaleDateString('pt-BR')})
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DateFilters;