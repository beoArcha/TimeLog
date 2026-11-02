import { describe, expect, it } from 'vitest';
import {
  COMPONENT_REGISTRY,
  ContentCategory,
  ComponentCategory,
  getComponentMetadata,
  getEffectiveContentCategory,
  isDesignSystemComponent,
} from '../registry/component-registry';

const VALID_CONTENT_CATEGORIES: ContentCategory[] = [
  'flow',
  'phrasing',
  'heading',
  'sectioning',
  'interactive',
  'embedded',
  'table-structure',
  'form-option',
  'transparent',
];

const VALID_COMPONENT_CATEGORIES: ComponentCategory[] = [
  'layout',
  'typography',
  'inline',
  'form',
  'surface',
  'table',
  'feedback',
  'interactive',
];

/**
 * Expected category mapping according to standard HTML semantic model:
 * Ensures components do not declare contradictory categories for their rendered HTML tags.
 */
const TAG_CATEGORY_MAP: Record<string, ContentCategory> = {
  div: 'flow',
  p: 'flow',
  span: 'phrasing',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  strong: 'phrasing',
  em: 'phrasing',
  mark: 'phrasing',
  del: 'phrasing',
  ins: 'phrasing',
  abbr: 'phrasing',
  code: 'phrasing',
  kbd: 'phrasing',
  button: 'interactive',
  select: 'interactive',
  label: 'phrasing',
  table: 'flow',
  thead: 'table-structure',
  tbody: 'table-structure',
  tfoot: 'table-structure',
  tr: 'table-structure',
  th: 'table-structure',
  td: 'table-structure',
};

describe('Component Registry Consistency', () => {
  it('contains registered design system components', () => {
    expect(Object.keys(COMPONENT_REGISTRY).length).toBeGreaterThan(0);
  });

  describe('every component metadata entry', () => {
    for (const [key, meta] of Object.entries(COMPONENT_REGISTRY)) {
      describe(`Component: ${key}`, () => {
        it('matches registry key name', () => {
          expect(meta.name).toBe(key);
        });

        it('has a valid component category', () => {
          expect(VALID_COMPONENT_CATEGORIES).toContain(meta.category);
        });

        it('has a valid, non-empty defaultTag in lowercase', () => {
          expect(meta.defaultTag).toBeDefined();
          expect(typeof meta.defaultTag).toBe('string');
          expect(meta.defaultTag.length).toBeGreaterThan(0);
          expect(meta.defaultTag).toBe(meta.defaultTag.toLowerCase());
        });

        it('has a valid selfCategory', () => {
          expect(VALID_CONTENT_CATEGORIES).toContain(meta.selfCategory);
        });

        it('has valid allowedChildCategories', () => {
          expect(Array.isArray(meta.allowedChildCategories)).toBe(true);
          for (const childCat of meta.allowedChildCategories) {
            expect(VALID_CONTENT_CATEGORIES).toContain(childCat);
          }
        });

        if (meta.supportedAs) {
          it('supportedAs is an array of non-empty tags and includes defaultTag', () => {
            expect(Array.isArray(meta.supportedAs)).toBe(true);
            expect(meta.supportedAs.length).toBeGreaterThan(0);
            for (const asTag of meta.supportedAs) {
              expect(typeof asTag).toBe('string');
              expect(asTag.length).toBeGreaterThan(0);
            }
            expect(meta.supportedAs).toContain(meta.defaultTag);
          });
        }

        it('has no contradictions between defaultTag and selfCategory', () => {
          const expectedCategory = TAG_CATEGORY_MAP[meta.defaultTag];
          if (expectedCategory) {
            expect(
              meta.selfCategory,
              `Component <${meta.name}> renders default tag <${meta.defaultTag}> but declared contradictory selfCategory '${meta.selfCategory}' instead of '${expectedCategory}'`
            ).toBe(expectedCategory);
          }
        });

        if (meta.allowedChildTags && meta.forbiddenChildTags) {
          it('has no overlapping allowed and forbidden child tags', () => {
            const forbiddenSet = new Set(meta.forbiddenChildTags);
            for (const allowedTag of meta.allowedChildTags!) {
              expect(forbiddenSet.has(allowedTag)).toBe(false);
            }
          });
        }
      });
    }
  });

  describe('Badge semantic and category consistency', () => {
    it('declares selfCategory as flow matching its defaultTag div', () => {
      const badge = COMPONENT_REGISTRY.Badge;
      expect(badge.defaultTag).toBe('div');
      expect(badge.selfCategory).toBe('flow');
    });

    it('becomes phrasing only when polymorphic as="span" is applied', () => {
      const badge = COMPONENT_REGISTRY.Badge;
      expect(getEffectiveContentCategory(badge)).toBe('flow');
      expect(getEffectiveContentCategory(badge, 'div')).toBe('flow');
      expect(getEffectiveContentCategory(badge, 'span')).toBe('phrasing');
    });
  });

  describe('InlineCluster semantic and category consistency', () => {
    it('declares selfCategory as flow matching its defaultTag div', () => {
      const cluster = COMPONENT_REGISTRY.InlineCluster;
      expect(cluster.defaultTag).toBe('div');
      expect(cluster.selfCategory).toBe('flow');
    });

    it('becomes phrasing when polymorphic as="span" is applied', () => {
      const cluster = COMPONENT_REGISTRY.InlineCluster;
      expect(getEffectiveContentCategory(cluster)).toBe('flow');
      expect(getEffectiveContentCategory(cluster, 'div')).toBe('flow');
      expect(getEffectiveContentCategory(cluster, 'span')).toBe('phrasing');
    });
  });

  describe('helper functions', () => {
    it('getComponentMetadata returns metadata for registered components', () => {
      expect(getComponentMetadata('VStack')).toBeDefined();
      expect(getComponentMetadata('Button')?.defaultTag).toBe('button');
      expect(getComponentMetadata('NonExistent')).toBeUndefined();
    });

    it('isDesignSystemComponent correctly identifies members', () => {
      expect(isDesignSystemComponent('VStack')).toBe(true);
      expect(isDesignSystemComponent('Badge')).toBe(true);
      expect(isDesignSystemComponent('div')).toBe(false);
      expect(isDesignSystemComponent('CustomWidget')).toBe(false);
    });
  });
});
