import React from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { Locale } from '@bindings/Locale';
import { Button } from '@components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';

const SUPPORTED_LOCALES = ['pl', 'en', 'de', 'es', 'pt-br', 'fr', 'system'] as const;

export const LanguageSelector: React.FC = () => {
  const { localePref, setLocalePref } = useLocale();
  const { layoutVariant } = useSettings();

  const showExpanded = layoutVariant === 'full';

  return (
    <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted/40 transition-all duration-300 text-[10px] font-sans">
      <Languages className="w-3.5 h-3.5 mx-1 sm:mx-1.5 text-blue-500" />

      <div className={showExpanded ? 'lg:hidden' : ''}>
        <Select
          value={localePref}
          onValueChange={(val) => {
            if (val) setLocalePref(val as Locale);
          }}
        >
          <SelectTrigger
            className="h-6 border-0 bg-transparent px-1.5 py-0.5 text-[9px] font-bold uppercase shadow-none focus-visible:ring-1"
            aria-label="Language selection"
          >
            <SelectValue>{localePref.toUpperCase()}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LOCALES.map(l => (
              <SelectItem key={l} value={l} className="text-xs uppercase">
                {l.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showExpanded && (
        <div className="hidden lg:flex items-center">
          {SUPPORTED_LOCALES.map(l => {
            const isActive = localePref === l;
            return (
              <Button
                key={l}
                variant="ghost"
                size="xs"
                onClick={() => setLocalePref(l)}
                className={`px-1.5 py-0.5 h-auto rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-500 text-white border border-blue-600 shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};
