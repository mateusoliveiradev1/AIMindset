import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Filter, Calendar, Tag, SortAsc, SortDesc, X } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface FilterDropdownProps {
  title: string;
  options: FilterOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  allowClear?: boolean;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  title,
  options,
  selectedValue,
  onSelect,
  placeholder = "Selecionar...",
  className = "",
  icon = <Filter className="w-4 h-4" />,
  allowClear = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(option => option.value === selectedValue);

  // Calcular posição do dropdown
  const calculatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
      
      // Implementar scroll lock mais robusto
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
      
      // Restaurar scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
      
      // Garantir que o scroll seja restaurado na limpeza
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen, calculatePosition, handleClickOutside]);

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect('');
  };

  const handleToggle = () => {
    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen(!isOpen);
  };

  // Componente do dropdown que será renderizado via portal
  const DropdownContent = () => (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        style={{ zIndex: 999998 }}
        onClick={() => setIsOpen(false)}
      />
      
      {/* Dropdown Menu */}
      <div 
        ref={dropdownRef}
        className="fixed bg-dark-surface/95 backdrop-blur-md border-2 border-neon-purple/30 rounded-lg shadow-xl shadow-black/50 overflow-hidden animate-in slide-in-from-top-2 duration-200 min-w-[200px]"
        style={{
          top: position.top,
          left: position.left,
          width: Math.max(position.width, 200),
          zIndex: 999999
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-neon-purple/20 bg-dark-surface/50">
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>

        {/* Options */}
        <div className="max-h-64 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.value)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left
                transition-all duration-200
                hover:bg-neon-purple/10 hover:text-white
                ${selectedValue === option.value 
                  ? 'bg-lime-green/10 text-lime-green border-r-2 border-lime-green' 
                  : 'text-futuristic-gray'
                }
              `}
            >
              {option.icon && (
                <div className={`flex-shrink-0 ${
                  selectedValue === option.value ? 'text-lime-green' : 'text-futuristic-gray'
                }`}>
                  {option.icon}
                </div>
              )}
              <span className="text-sm font-medium">{option.label}</span>
              
              {selectedValue === option.value && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-lime-green rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer (if needed) */}
        {options.length === 0 && (
          <div className="px-4 py-6 text-center text-futuristic-gray text-sm">
            Nenhuma opção disponível
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className={`
          flex items-center justify-between w-full px-4 py-3
          bg-dark-surface/60 backdrop-blur-sm
          border-2 border-neon-purple/30 
          rounded-lg text-white
          transition-all duration-300 ease-out
          hover:border-neon-purple/50 hover:bg-dark-surface/80
          focus:outline-none focus:border-lime-green focus:ring-2 focus:ring-lime-green/20
          ${isOpen ? 'border-lime-green ring-2 ring-lime-green/20 bg-dark-surface/90' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <div className={`transition-colors duration-200 ${
            isOpen ? 'text-lime-green' : 'text-futuristic-gray'
          }`}>
            {icon}
          </div>
          <span className="text-sm font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear Button */}
          {allowClear && selectedValue && (
            <div
              onClick={handleClear}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
              className="p-1 rounded-full hover:bg-futuristic-gray/20 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3 text-futuristic-gray hover:text-white" />
            </div>
          )}
          
          {/* Chevron */}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-lime-green' : 'text-futuristic-gray'
          }`} />
        </div>
      </button>

      {/* Render dropdown via portal */}
      {isOpen && createPortal(<DropdownContent />, document.body)}
    </div>
  );
};

export default FilterDropdown;