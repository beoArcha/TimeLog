import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@components/ui/button';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@/src/bindings/Locale';
import {
  STARTER_TEMPLATES,
  StarterTemplate,
  resolveStarterTemplate,
} from '@common/templates/starterTemplates';
import { PROJECT_COLORS } from './LayoutStyles';

export interface ProjectEmptyStateProps {
  onApplyTemplate: (template: StarterTemplate) => void;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export function ProjectEmptyState({
  onApplyTemplate,
  locale = 'en',
  customTranslations,
}: ProjectEmptyStateProps) {
  return (
    <div
      data-testid="project-empty-state"
      className="p-4 rounded-2xl border border-dashed border-border bg-card/60 backdrop-blur-sm flex flex-col gap-3 my-2"
    >
      <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
        <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
        <span>{translate(locale, 'project', 'StarterTemplatesHeading', customTranslations)}</span>
      </div>

      <p className="text-[11px] text-muted-foreground leading-snug">
        {translate(locale, 'project', 'StarterTemplatesSubheading', customTranslations)}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
        {STARTER_TEMPLATES.map((tmpl) => {
          const resolved = resolveStarterTemplate(tmpl, locale, customTranslations);
          const colorDef =
            PROJECT_COLORS.find((c) => c.name === tmpl.color) || PROJECT_COLORS[0];

          return (
            <Button
              key={tmpl.id}
              type="button"
              variant="outline"
              data-testid={`starter-template-${tmpl.id}`}
              onClick={() => onApplyTemplate(tmpl)}
              aria-label={`${resolved.name} - ${resolved.description}`}
              className="group h-auto p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/80 hover:border-orange-500/40 text-left flex flex-col items-start gap-1 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0 leading-none" role="img" aria-hidden="true">
                    {resolved.icon}
                  </span>
                  <span className="font-semibold text-xs text-foreground truncate group-hover:text-orange-500 transition-colors">
                    {resolved.name}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                {resolved.description}
              </p>

              <div className="flex items-center gap-1 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${colorDef.bg} shrink-0`}
                  aria-hidden="true"
                />
                <span className="text-[9px] font-mono text-muted-foreground/80">
                  #{resolved.tags[0]}
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectEmptyState;
