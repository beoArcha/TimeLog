import React, { useState, useMemo } from 'react';
import { Smile, X, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Caption } from '@components/ui/typography';
import { HStack, VStack } from '@components/ui/stack';
import { translate } from '@common/i18n/translator';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import {
  CURATED_EMOJIS,
  EMOJI_CATEGORIES,
  EmojiCategoryId,
  getFirstGrapheme,
} from './emojiData';

export interface EmojiPickerProps {
  value?: string | null;
  onChange: (emoji: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  testId?: string;
}

export function EmojiPicker({
  value,
  onChange,
  disabled = false,
  placeholder,
  className,
  testId = 'emoji-picker',
}: EmojiPickerProps) {
  const { locale, customTranslations } = useSafeLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EmojiCategoryId>('all');

  const filteredEmojis = useMemo(() => {
    const query = search.trim().toLowerCase();
    return CURATED_EMOJIS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        item.emoji.includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(query))
      );
    });
  }, [search, selectedCategory]);

  const handleSelectEmoji = (emoji: string) => {
    const grapheme = getFirstGrapheme(emoji);
    onChange(grapheme);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const currentDisplay = value ? getFirstGrapheme(value) : null;
  const selectLabel = translate(locale, 'project', 'SelectEmoji', customTranslations);
  const clearLabel = translate(locale, 'project', 'ClearEmoji', customTranslations);
  const searchPlaceholder = translate(locale, 'project', 'SearchEmoji', customTranslations);

  let triggerContent: React.ReactNode = <Smile className="w-4 h-4 text-muted-foreground" />;
  if (currentDisplay) {
    triggerContent = (
      <span className="text-base select-none leading-none" data-testid={`${testId}-current`}>
        {currentDisplay}
      </span>
    );
  } else if (placeholder) {
    triggerContent = (
      <span className="text-xs text-muted-foreground select-none leading-none">
        {placeholder}
      </span>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        data-testid={`${testId}-trigger`}
        aria-label={selectLabel}
        className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-input bg-card hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${
          className || ''
        }`}
      >
        {triggerContent}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-72 p-2 bg-card border-border shadow-xl rounded-2xl flex flex-col gap-2"
        data-testid={`${testId}-content`}
      >
        <VStack gap="xs" className="w-full">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              data-testid={`${testId}-search-input`}
              className="pl-8 pr-7 py-1 h-8 text-xs w-full bg-muted/40 border-border/60 rounded-xl"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setSearch('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          <HStack gap="2xs" className="w-full overflow-x-auto pb-1 no-scrollbar">
            {EMOJI_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Button
                  key={cat.id}
                  type="button"
                  size="xs"
                  variant={isSelected ? 'secondary' : 'ghost'}
                  onClick={() => setSelectedCategory(cat.id)}
                  data-testid={`${testId}-category-${cat.id}`}
                  className="text-[10px] h-6 px-2 rounded-lg font-mono tracking-tight"
                >
                  {cat.label}
                </Button>
              );
            })}
          </HStack>
        </VStack>

        <div className="grid grid-cols-6 gap-1 p-1 max-h-44 overflow-y-auto rounded-xl bg-muted/20 border border-border/40">
          {filteredEmojis.map((item) => (
            <Button
              key={item.emoji}
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleSelectEmoji(item.emoji)}
              data-testid={`${testId}-emoji-${item.emoji}`}
              title={item.name}
              aria-label={item.name}
              className="w-8 h-8 rounded-lg hover:scale-110 transition-transform text-base p-0 flex items-center justify-center cursor-pointer"
            >
              {item.emoji}
            </Button>
          ))}
          {filteredEmojis.length === 0 && search.trim() && (
            <div className="col-span-6 py-4 flex flex-col items-center justify-center gap-1.5">
              <Caption size="xs" variant="muted">
                {search}
              </Caption>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handleSelectEmoji(search)}
                data-testid={`${testId}-custom-use-btn`}
                className="text-xs h-7 rounded-lg"
              >
                Use &quot;{getFirstGrapheme(search)}&quot;
              </Button>
            </div>
          )}
        </div>

        {value && (
          <HStack justify="between" align="center" className="pt-1 border-t border-border/50 px-1">
            <Caption size="2xs" variant="muted">
              {currentDisplay}
            </Caption>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClear}
              data-testid={`${testId}-clear-btn`}
              className="text-[11px] h-6 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg"
            >
              <X className="w-3 h-3 mr-1" /> {clearLabel}
            </Button>
          </HStack>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default EmojiPicker;
