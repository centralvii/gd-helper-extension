import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  isAction?: boolean; // For items like "+ Создать раздел..."
  badge?: string;
}

export interface SelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md';
  leftIcon?: React.ReactNode;
  id?: string;
  name?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  disabled = false,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  size = 'md',
  leftIcon,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string, optDisabled?: boolean) => {
    if (optDisabled) return;
    onChange(optValue);
    setIsOpen(false);
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-[12px] rounded-lg min-h-[30px]'
      : 'px-3 py-1.5 text-[13px] rounded-[10px] min-h-[36px]';

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`gd-select-trigger w-full flex items-center justify-between gap-2 border text-left transition-all cursor-pointer ${
          isOpen
            ? 'bg-white border-gd-green ring-4 ring-emerald-500/15'
            : 'bg-gd-fill border-transparent hover:bg-slate-200/70'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : ''
        } ${sizeClasses} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leftIcon && <span className="flex-shrink-0 text-slate-400">{leftIcon}</span>}
          {selectedOption ? (
            <span className="flex items-center gap-1.5 truncate text-slate-900 font-medium">
              {selectedOption.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="px-1.5 py-px rounded-full bg-gd-green-light text-gd-green text-[10px] font-bold flex-shrink-0 ml-1">
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        {/* Custom Chevron Down */}
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-gd-green' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 mt-1.5 gd-glass bg-white/90 rounded-[13px] shadow-gd-float p-1 overflow-y-auto max-h-64 animate-slide-down origin-top ${dropdownClassName}`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-center text-slate-400 text-[11px]">
              Нет доступных вариантов
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-[13px] transition-colors cursor-pointer ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-50'
                      : opt.isAction
                      ? 'text-gd-green font-semibold hover:bg-gd-green-light border-t border-gd-border mt-0.5'
                      : isSelected
                      ? 'text-slate-900 font-semibold'
                      : 'text-slate-900 hover:bg-gd-fill font-normal'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="px-1.5 py-px rounded-full bg-gd-green-light text-gd-green text-[10px] font-bold flex-shrink-0">
                        {opt.badge}
                      </span>
                    )}
                  </div>

                  {isSelected && !opt.isAction && (
                    <Check className="w-4 h-4 text-gd-green flex-shrink-0 ml-1" strokeWidth={2.5} />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
