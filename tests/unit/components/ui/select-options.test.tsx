// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import {
  NativeSelect,
  NativeOption,
  NativeOptGroup,
  type NativeSelectOption,
} from '@components/ui/select';

describe('Unit Tests: NativeSelect Options and Primitives', () => {
  afterEach(() => {
    cleanup();
  });

  describe('NativeOption Primitive', () => {
    it('should render option element with data-slot and custom props', () => {
      render(
        <select>
          <NativeOption value="opt1" className="custom-option">
            Option 1
          </NativeOption>
        </select>
      );

      const option = screen.getByRole('option', { name: 'Option 1' }) as HTMLOptionElement;
      expect(option).toBeTruthy();
      expect(option.getAttribute('data-slot')).toBe('native-option');
      expect(option.value).toBe('opt1');
      expect(option.className).toContain('custom-option');
    });

    it('should forward ref to HTMLOptionElement', () => {
      const ref = React.createRef<HTMLOptionElement>();
      render(
        <select>
          <NativeOption ref={ref} value="ref-opt">
            Ref Option
          </NativeOption>
        </select>
      );

      expect(ref.current).toBeInstanceOf(HTMLOptionElement);
      expect(ref.current?.value).toBe('ref-opt');
    });

    it('should support disabled state', () => {
      render(
        <select>
          <NativeOption value="disabled-opt" disabled>
            Disabled Option
          </NativeOption>
        </select>
      );

      const option = screen.getByRole('option', { name: 'Disabled Option' }) as HTMLOptionElement;
      expect(option.disabled).toBe(true);
    });
  });

  describe('NativeOptGroup Primitive', () => {
    it('should render optgroup with data-slot, label, and children', () => {
      const { container } = render(
        <select>
          <NativeOptGroup label="Group 1" className="custom-group">
            <NativeOption value="g1-opt1">Group 1 Option 1</NativeOption>
          </NativeOptGroup>
        </select>
      );

      const optgroup = container.querySelector('[data-slot="native-optgroup"]') as HTMLOptGroupElement;
      expect(optgroup).toBeTruthy();
      expect(optgroup.tagName.toLowerCase()).toBe('optgroup');
      expect(optgroup.label).toBe('Group 1');
      expect(optgroup.className).toContain('custom-group');

      const option = screen.getByRole('option', { name: 'Group 1 Option 1' });
      expect(option).toBeTruthy();
    });

    it('should forward ref to HTMLOptGroupElement', () => {
      const ref = React.createRef<HTMLOptGroupElement>();
      render(
        <select>
          <NativeOptGroup ref={ref} label="Ref Group">
            <NativeOption value="1">Option</NativeOption>
          </NativeOptGroup>
        </select>
      );

      expect(ref.current).toBeInstanceOf(HTMLOptGroupElement);
      expect(ref.current?.label).toBe('Ref Group');
    });
  });

  describe('NativeSelect with options prop', () => {
    const mockOptions: NativeSelectOption[] = [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana', disabled: true },
      { value: 42, label: 'Number Value' },
    ];

    it('should render options from options prop when children is not provided', () => {
      render(<NativeSelect options={mockOptions} defaultValue="apple" />);

      const select = screen.getByRole('combobox');
      expect(select).toBeTruthy();
      expect(select.getAttribute('data-slot')).toBe('native-select');

      const appleOpt = screen.getByRole('option', { name: 'Apple' }) as HTMLOptionElement;
      expect(appleOpt).toBeTruthy();
      expect(appleOpt.value).toBe('apple');
      expect(appleOpt.getAttribute('data-slot')).toBe('native-option');
      expect(appleOpt.disabled).toBe(false);

      const bananaOpt = screen.getByRole('option', { name: 'Banana' }) as HTMLOptionElement;
      expect(bananaOpt).toBeTruthy();
      expect(bananaOpt.disabled).toBe(true);

      const numOpt = screen.getByRole('option', { name: 'Number Value' }) as HTMLOptionElement;
      expect(numOpt).toBeTruthy();
      expect(numOpt.value).toBe('42');
    });

    it('should prefer children over options prop when children is provided', () => {
      render(
        <NativeSelect options={mockOptions}>
          <NativeOption value="override">Override Child</NativeOption>
        </NativeSelect>
      );

      expect(screen.getByRole('option', { name: 'Override Child' })).toBeTruthy();
      expect(screen.queryByRole('option', { name: 'Apple' })).toBeNull();
    });

    it('should render empty select when neither children nor options is provided', () => {
      const { container } = render(<NativeSelect />);
      const select = container.querySelector('select');
      expect(select).toBeTruthy();
      expect(select?.children.length).toBe(0);
    });

    it('should forward ref to HTMLSelectElement', () => {
      const ref = React.createRef<HTMLSelectElement>();
      render(<NativeSelect ref={ref} options={mockOptions} />);
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });
});
