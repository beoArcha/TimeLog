// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Strong, Em, Mark, Del, Ins, Abbr } from '@components/ui/typography';

describe('Unit Tests: Inline Semantic Typography Primitives', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Strong Primitive', () => {
    it('should render strong tag with data-slot and font-semibold without hardcoded text color or font size', () => {
      render(<Strong>Important text</Strong>);
      const element = screen.getByText('Important text');
      expect(element.tagName.toLowerCase()).toBe('strong');
      expect(element.getAttribute('data-slot')).toBe('strong');
      expect(element.className).toContain('font-semibold');
      // Should inherit parent color - no hardcoded text-foreground or font size
      expect(element.className).not.toContain('text-foreground');
      expect(element.className).not.toMatch(/\btext-(xs|sm|base|lg|xl|2xl|3xl|2xs)\b/);
    });

    it('should preserve native attributes (id, title, aria-*) and pass ref', () => {
      const ref = React.createRef<HTMLElement>();
      render(
        <Strong
          ref={ref}
          id="custom-strong-id"
          title="Strong Tooltip"
          aria-label="Accessible Strong"
        >
          Important with attributes
        </Strong>
      );
      const element = screen.getByText('Important with attributes');
      expect(ref.current).toBe(element);
      expect(element.getAttribute('id')).toBe('custom-strong-id');
      expect(element.getAttribute('title')).toBe('Strong Tooltip');
      expect(element.getAttribute('aria-label')).toBe('Accessible Strong');
    });

    it('should merge custom className', () => {
      render(<Strong className="tracking-wide text-primary">Styled Strong</Strong>);
      const element = screen.getByText('Styled Strong');
      expect(element.className).toContain('tracking-wide');
      expect(element.className).toContain('text-primary');
      expect(element.className).toContain('font-semibold');
    });
  });

  describe('Em Primitive', () => {
    it('should render em tag with data-slot and italic without hardcoded text color or font size', () => {
      render(<Em>Emphasized text</Em>);
      const element = screen.getByText('Emphasized text');
      expect(element.tagName.toLowerCase()).toBe('em');
      expect(element.getAttribute('data-slot')).toBe('em');
      expect(element.className).toContain('italic');
      // Should inherit parent color - no hardcoded text-foreground or font size
      expect(element.className).not.toContain('text-foreground');
      expect(element.className).not.toMatch(/\btext-(xs|sm|base|lg|xl|2xl|3xl|2xs)\b/);
    });

    it('should preserve native attributes (id, title, aria-*) and pass ref', () => {
      const ref = React.createRef<HTMLElement>();
      render(
        <Em
          ref={ref}
          id="custom-em-id"
          title="Em Tooltip"
          aria-label="Accessible Em"
        >
          Emphasized with attributes
        </Em>
      );
      const element = screen.getByText('Emphasized with attributes');
      expect(ref.current).toBe(element);
      expect(element.getAttribute('id')).toBe('custom-em-id');
      expect(element.getAttribute('title')).toBe('Em Tooltip');
      expect(element.getAttribute('aria-label')).toBe('Accessible Em');
    });

    it('should merge custom className', () => {
      render(<Em className="text-amber-500">Styled Em</Em>);
      const element = screen.getByText('Styled Em');
      expect(element.className).toContain('text-amber-500');
      expect(element.className).toContain('italic');
    });
  });

  describe('Mark Primitive', () => {
    it('should render mark element with highlight styles, data-slot, and forward ref', () => {
      const ref = React.createRef<HTMLElement>();
      render(<Mark ref={ref}>Highlighted text</Mark>);
      const element = screen.getByText('Highlighted text');
      expect(ref.current).toBe(element);
      expect(element.tagName.toLowerCase()).toBe('mark');
      expect(element.getAttribute('data-slot')).toBe('mark');
      expect(element.className).toContain('bg-primary/20');
      expect(element.className).toContain('text-foreground');
      expect(element.className).toContain('rounded-xs');
      expect(element.className).toContain('px-1');
    });

    it('should merge custom className', () => {
      render(<Mark className="bg-yellow-200">Custom Mark</Mark>);
      const element = screen.getByText('Custom Mark');
      expect(element.className).toContain('bg-yellow-200');
    });
  });

  describe('Del Primitive', () => {
    it('should render del element with line-through styles, data-slot, and forward ref', () => {
      const ref = React.createRef<HTMLElement>();
      render(<Del ref={ref}>Deleted text</Del>);
      const element = screen.getByText('Deleted text');
      expect(ref.current).toBe(element);
      expect(element.tagName.toLowerCase()).toBe('del');
      expect(element.getAttribute('data-slot')).toBe('del');
      expect(element.className).toContain('line-through');
      expect(element.className).toContain('text-muted-foreground');
    });

    it('should merge custom className', () => {
      render(<Del className="opacity-75">Styled Del</Del>);
      const element = screen.getByText('Styled Del');
      expect(element.className).toContain('opacity-75');
      expect(element.className).toContain('line-through');
    });
  });

  describe('Ins Primitive', () => {
    it('should render ins element with underline and decoration styles, data-slot, and forward ref', () => {
      const ref = React.createRef<HTMLElement>();
      render(<Ins ref={ref}>Inserted text</Ins>);
      const element = screen.getByText('Inserted text');
      expect(ref.current).toBe(element);
      expect(element.tagName.toLowerCase()).toBe('ins');
      expect(element.getAttribute('data-slot')).toBe('ins');
      expect(element.className).toContain('underline');
      expect(element.className).toContain('text-foreground');
      expect(element.className).toContain('decoration-emerald-500');
    });

    it('should merge custom className', () => {
      render(<Ins className="font-mono">Styled Ins</Ins>);
      const element = screen.getByText('Styled Ins');
      expect(element.className).toContain('font-mono');
      expect(element.className).toContain('underline');
    });
  });

  describe('Abbr Primitive', () => {
    it('should render abbr element with dotted underline, cursor-help, title attribute, and forward ref', () => {
      const ref = React.createRef<HTMLElement>();
      render(<Abbr ref={ref} title="HyperText Markup Language">HTML</Abbr>);
      const element = screen.getByText('HTML');
      expect(ref.current).toBe(element);
      expect(element.tagName.toLowerCase()).toBe('abbr');
      expect(element.getAttribute('data-slot')).toBe('abbr');
      expect(element.getAttribute('title')).toBe('HyperText Markup Language');
      expect(element.className).toContain('underline');
      expect(element.className).toContain('decoration-dotted');
      expect(element.className).toContain('cursor-help');
    });

    it('should merge custom className', () => {
      render(<Abbr className="text-primary">CSS</Abbr>);
      const element = screen.getByText('CSS');
      expect(element.className).toContain('text-primary');
      expect(element.className).toContain('cursor-help');
    });
  });
});
