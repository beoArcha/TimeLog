import { describe, expect, it } from 'vitest';
import {
  COMPONENT_REGISTRY,
  ContentCategory,
  ComponentCategory,
  HTML_ELEMENT_CATEGORY_MAP,
  getComponentMetadata,
  getEffectiveContentCategory,
  getNativeHtmlElementCategory,
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
  'text',
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
          const expectedCategory = HTML_ELEMENT_CATEGORY_MAP[meta.defaultTag];
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

  describe('Grid layout metadata consistency', () => {
    it('declares selfCategory as flow matching its defaultTag div', () => {
      const grid = COMPONENT_REGISTRY.Grid;
      expect(grid.defaultTag).toBe('div');
      expect(grid.selfCategory).toBe('flow');
    });

    it('contains exactly div, section, and article in supportedAs and does not allow ul or ol', () => {
      const grid = COMPONENT_REGISTRY.Grid;
      expect(grid.supportedAs).toEqual(['div', 'section', 'article']);
      expect(grid.supportedAs).not.toContain('ul');
      expect(grid.supportedAs).not.toContain('ol');
    });
  });

  describe('NativeOption and NativeOptGroup form metadata consistency', () => {
    it('registers NativeOption and NativeOptGroup in form category with selfCategory form-option', () => {
      const optionMeta = COMPONENT_REGISTRY.NativeOption;
      expect(optionMeta).toBeDefined();
      expect(optionMeta.category).toBe('form');
      expect(optionMeta.defaultTag).toBe('option');
      expect(optionMeta.selfCategory).toBe('form-option');
      expect(optionMeta.allowedChildCategories).toEqual(['text']);
      expect(optionMeta.forbiddenChildTags).toBeUndefined();

      const optGroupMeta = COMPONENT_REGISTRY.NativeOptGroup;
      expect(optGroupMeta).toBeDefined();
      expect(optGroupMeta.category).toBe('form');
      expect(optGroupMeta.defaultTag).toBe('optgroup');
      expect(optGroupMeta.selfCategory).toBe('form-option');
      expect(optGroupMeta.allowedChildCategories).toEqual(['form-option', 'transparent']);
      expect(optGroupMeta.allowedChildTags).toEqual(['option', 'NativeOption']);
    });

    it('verifies NativeSelect only permits form-option components as children', () => {
      const selectMeta = COMPONENT_REGISTRY.NativeSelect;
      expect(selectMeta.allowedChildCategories).toContain('form-option');
      expect(selectMeta.allowedChildTags).toContain('NativeOption');
      expect(selectMeta.allowedChildTags).toContain('NativeOptGroup');
    });
  });

  describe('helper functions', () => {
    it('getComponentMetadata returns metadata for registered components', () => {
      expect(getComponentMetadata('VStack')).toBeDefined();
      expect(getComponentMetadata('Button')?.defaultTag).toBe('button');
      expect(getComponentMetadata('NativeOption')?.defaultTag).toBe('option');
      expect(getComponentMetadata('NativeOptGroup')?.defaultTag).toBe('optgroup');
      expect(getComponentMetadata('NonExistent')).toBeUndefined();
    });

    it('isDesignSystemComponent correctly identifies members', () => {
      expect(isDesignSystemComponent('VStack')).toBe(true);
      expect(isDesignSystemComponent('Badge')).toBe(true);
      expect(isDesignSystemComponent('NativeOption')).toBe(true);
      expect(isDesignSystemComponent('NativeOptGroup')).toBe(true);
      expect(isDesignSystemComponent('div')).toBe(false);
      expect(isDesignSystemComponent('CustomWidget')).toBe(false);
    });

    it('getEffectiveContentCategory returns undefined when asProp is dynamic', () => {
      const textMeta = COMPONENT_REGISTRY.Text;
      const badgeMeta = COMPONENT_REGISTRY.Badge;
      const vstackMeta = COMPONENT_REGISTRY.VStack;

      expect(getEffectiveContentCategory(textMeta, 'dynamic')).toBeUndefined();
      expect(getEffectiveContentCategory(badgeMeta, 'dynamic')).toBeUndefined();
      expect(getEffectiveContentCategory(vstackMeta, 'dynamic')).toBeUndefined();
    });

    it('getNativeHtmlElementCategory classifies standard native HTML elements', () => {
      expect(getNativeHtmlElementCategory('a')).toBe('interactive');
      expect(getNativeHtmlElementCategory('button')).toBe('interactive');
      expect(getNativeHtmlElementCategory('input')).toBe('interactive');
      expect(getNativeHtmlElementCategory('span')).toBe('phrasing');
      expect(getNativeHtmlElementCategory('div')).toBe('flow');
      expect(getNativeHtmlElementCategory('h1')).toBe('heading');
      expect(getNativeHtmlElementCategory('section')).toBe('sectioning');
      expect(getNativeHtmlElementCategory('option')).toBe('form-option');
      expect(getNativeHtmlElementCategory('tr')).toBe('table-structure');
      expect(getNativeHtmlElementCategory('custom-unknown-element')).toBeUndefined();
    });
  });
});
