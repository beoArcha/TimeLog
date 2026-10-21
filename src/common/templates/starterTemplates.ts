import { ProjectKey } from '@common/i18n/keys';
import { Locale } from '@/src/bindings/Locale';
import { translate, TranslationDictionary } from '@common/i18n/translator';

export interface StarterTemplate {
  id: string;
  nameKey: ProjectKey;
  descriptionKey: ProjectKey;
  icon: string;
  color: string;
  tags: string[];
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'software-dev',
    nameKey: 'TemplateSoftwareDevName',
    descriptionKey: 'TemplateSoftwareDevDesc',
    icon: '💻',
    color: 'violet',
    tags: ['dev', 'engineering', 'qa'],
  },
  {
    id: 'client-consulting',
    nameKey: 'TemplateConsultingName',
    descriptionKey: 'TemplateConsultingDesc',
    icon: '💼',
    color: 'teal',
    tags: ['client', 'consulting', 'billable'],
  },
  {
    id: 'learning-research',
    nameKey: 'TemplateLearningName',
    descriptionKey: 'TemplateLearningDesc',
    icon: '📚',
    color: 'amber',
    tags: ['study', 'research', 'learning'],
  },
  {
    id: 'content-design',
    nameKey: 'TemplateCreativeName',
    descriptionKey: 'TemplateCreativeDesc',
    icon: '🎨',
    color: 'rose',
    tags: ['content', 'design', 'publishing'],
  },
];

export interface ResolvedStarterTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];
}

export function resolveStarterTemplate(
  template: StarterTemplate,
  locale: Locale,
  customTranslations?: Partial<TranslationDictionary>,
): ResolvedStarterTemplate {
  return {
    id: template.id,
    name: translate(locale, 'project', template.nameKey, customTranslations),
    description: translate(locale, 'project', template.descriptionKey, customTranslations),
    icon: template.icon,
    color: template.color,
    tags: template.tags,
  };
}
