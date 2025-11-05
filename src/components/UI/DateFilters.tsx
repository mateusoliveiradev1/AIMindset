import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Filter, X } from 'lucide-react';
import Button from './Button';
import Card from './Card';

export interface DateRange {
  startDate: Date;
  endDate: Date;
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
          startDate: today,
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          startDate: yesterday,
          endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          startDate: weekAgo,
          endDate: now
        };
      
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          startDate: monthAgo,
          endDate: now
        };
      
      case 'custom':
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Fim do dia
          return {
            startDate: startDate,
            endDate: endDate
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
    <Card className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 p-3 sm:p-4 ${className}`}>
      <div className="space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-neon-purple flex-shrink-0" />
            <span className="text-white font-medium text-xs sm:text-sm truncate">Filtros de Data</span>
            {isActive && (
              <div className="w-2 h-2 bg-neon-purple rounded-full animate-pulse flex-shrink-0"></div>
            )}
          </div>
          
          {isActive && (
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="text-xs flex-shrink-0"
            >
              <X className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Limpar</span>
            </Button>
          )}
        </div>

        {/* Period Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
          {periods.map((period) => {
            const Icon = period.icon;
            const isSelected = selectedPeriod === period.id;
            
            return (
              <Button
                key={period.id}
                onClick={() => handlePeriodChange(period.id as DatePeriod)}
                variant={isSelected ? "primary" : "outline"}
                size="sm"
                className={`text-xs px-2 py-1.5 sm:px-3 sm:py-2 ${
                  isSelected 
                    ? 'bg-neon-gradient text-white border-neon-purple' 
                    : 'hover:border-neon-purple/50'
                }`}
              >
                <Icon className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{period.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Custom Date Inputs */}
        {showCustomInputs && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 border-t border-neon-purple/20">
            <div>
              <label className="block text-futuristic-gray text-xs mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                max={formatDateForInput(new Date())}
                className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-neon-purple/50 transition-colors"
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
                className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-neon-purple/50 transition-colors"
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
              <span className="ml-1 block sm:inline">
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