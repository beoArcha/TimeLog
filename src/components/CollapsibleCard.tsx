import React, { useState } from 'react';
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';
import { useSettings } from '@common/hooks/SettingsContext';


interface CollapsibleCardProps {
  title?: React.ReactNode;
  icon?: LucideIcon | React.ElementType;
  iconColor?: string;
  titleColor?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  headerRight?: React.ReactNode;
  wrapperClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  titleNode?: React.ReactNode;
  onClick?: () => void;
  headerTestId?: string;
}

export default function CollapsibleCard({ 
  title, 
  icon: Icon, 
  iconColor, 
  titleColor,
  children, 
  defaultExpanded = true,
  headerRight,
  wrapperClassName,
  headerClassName,
  contentClassName,
  titleNode,
  onClick,
  headerTestId
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { resolvedTheme } = useSettings();;

  const isLight = resolvedTheme === 'light';
  
  const defaultWrapper = `p-6 rounded-3xl border transition-all flex flex-col gap-4 ${isLight ? 'bg-[#FCFAF7] border-[#DFD7CB] shadow-sm' : 'bg-white/5 border-white/5'}`;
  const defaultHeader = `text-sm font-bold flex items-center gap-2 ${titleColor ? titleColor : isLight ? 'text-[#2C2421]' : 'text-white'}`;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (onClick) onClick();
  };

  return (
    <div className={wrapperClassName || defaultWrapper}>
      <div 
        role="button"
        tabIndex={0}
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={handleToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); } }}
        aria-expanded={isExpanded}
        aria-controls={`collapsible-content-${headerTestId ?? 'card'}`}
        data-testid={headerTestId}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${iconColor || 'text-slate-400'}`} />}
          {titleNode ? titleNode : (
            <h3 className={headerClassName || defaultHeader}>
              {title}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-3">
          {headerRight && <div onClick={e => e.stopPropagation()}>{headerRight}</div>}
          {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
        </div>
      </div>
      
      {isExpanded && (
        <div
          id={`collapsible-content-${headerTestId ?? 'card'}`}
          className={`animate-in fade-in slide-in-from-top-2 duration-300 ${contentClassName || ''}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
