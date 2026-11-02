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
    it('should render strong element with semantic styles and data-slot', () => {
      render(<Strong>Important text</Strong>);
      const element = screen.getByText('Important text');
      expect(element.tagName.toLowerCase()).toBe('strong');
      expect(element.getAttribute('data-slot')).toBe('strong');
      expect(element.className).toContain('font-semibold');
      expect(element.className).toContain('text-foreground');
    });

    it('should merge custom className', () => {
      render(<Strong className="tracking-wide">Styled Strong</Strong>);
      const element = screen.getByText('Styled Strong');
      expect(element.className).toContain('tracking-wide');
      expect(element.className).toContain('font-semibold');
    });
  });

  describe('Em Primitive', () => {
    it('should render em element with italic styles and data-slot', () => {
      render(<Em>Emphasized text</Em>);
      const element = screen.getByText('Emphasized text');
      expect(element.tagName.toLowerCase()).toBe('em');
      expect(element.getAttribute('data-slot')).toBe('em');
      expect(element.className).toContain('italic');
      expect(element.className).toContain('text-foreground');
    });

    it('should merge custom className', () => {
      render(<Em className="text-amber-500">Styled Em</Em>);
      const element = screen.getByText('Styled Em');
      expect(element.className).toContain('text-amber-500');
      expect(element.className).toContain('italic');
    });
  });

  describe('Mark Primitive', () => {
    it('should render mark element with highlight styles and data-slot', () => {
      render(<Mark>Highlighted text</Mark>);
      const element = screen.getByText('Highlighted text');
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
    it('should render del element with line-through styles and data-slot', () => {
      render(<Del>Deleted text</Del>);
      const element = screen.getByText('Deleted text');
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
    it('should render ins element with underline and decoration styles', () => {
      render(<Ins>Inserted text</Ins>);
      const element = screen.getByText('Inserted text');
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
    it('should render abbr element with dotted underline and cursor-help', () => {
      render(<Abbr title="HyperText Markup Language">HTML</Abbr>);
      const element = screen.getByText('HTML');
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
