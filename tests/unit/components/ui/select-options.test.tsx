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

    it('should pass disabled, value, label, and native HTMLOptionElement attributes', () => {
      const ref = React.createRef<HTMLOptionElement>();
      render(
        <select>
          <NativeOption
            ref={ref}
            value="detailed-opt"
            label="Detailed Label"
            disabled
            id="opt-custom-id"
            title="Option Title"
            aria-label="Accessible Option"
          >
            Detailed Child
          </NativeOption>
        </select>
      );

      const option = ref.current as HTMLOptionElement;
      expect(option).toBeTruthy();
      expect(option.value).toBe('detailed-opt');
      expect(option.label).toBe('Detailed Label');
      expect(option.disabled).toBe(true);
      expect(option.getAttribute('id')).toBe('opt-custom-id');
      expect(option.getAttribute('title')).toBe('Option Title');
      expect(option.getAttribute('aria-label')).toBe('Accessible Option');
    });

    it('should fallback to label attribute when children are not provided', () => {
      render(
        <select>
          <NativeOption value="label-fallback" label="Fallback Text" />
        </select>
      );

      const option = screen.getByRole('option', { name: 'Fallback Text' }) as HTMLOptionElement;
      expect(option).toBeTruthy();
      expect(option.textContent).toBe('Fallback Text');
      expect(option.label).toBe('Fallback Text');
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

    it('should forward ref and pass disabled, label, and native HTMLOptGroupElement attributes', () => {
      const ref = React.createRef<HTMLOptGroupElement>();
      render(
        <select>
          <NativeOptGroup
            ref={ref}
            label="Disabled Group"
            disabled
            id="grp-custom-id"
            aria-label="Accessible Group"
          >
            <NativeOption value="1">Option in group</NativeOption>
          </NativeOptGroup>
        </select>
      );

      expect(ref.current).toBeInstanceOf(HTMLOptGroupElement);
      expect(ref.current?.label).toBe('Disabled Group');
      expect(ref.current?.disabled).toBe(true);
      expect(ref.current?.getAttribute('id')).toBe('grp-custom-id');
      expect(ref.current?.getAttribute('aria-label')).toBe('Accessible Group');
    });
  });

  describe('NativeSelect Precedence and Rendering Contracts', () => {
    const mockOptions: NativeSelectOption[] = [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana', disabled: true },
      { value: 42, label: 'Number Value' },
    ];

    it('should render options via options prop when children is not provided', () => {
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

    it('should render via children (<NativeOption>, <NativeOptGroup>) when options is omitted', () => {
      render(
        <NativeSelect defaultValue="child2">
          <NativeOptGroup label="Fruit Group">
            <NativeOption value="child1">Child 1</NativeOption>
            <NativeOption value="child2">Child 2</NativeOption>
          </NativeOptGroup>
        </NativeSelect>
      );

      const optGroup = screen.getByRole('group') as HTMLOptGroupElement;
      expect(optGroup).toBeTruthy();
      expect(optGroup.label).toBe('Fruit Group');
      expect(screen.getByRole('option', { name: 'Child 1' })).toBeTruthy();
      expect(screen.getByRole('option', { name: 'Child 2' })).toBeTruthy();
    });

    it('should give precedence to options prop when both options and children are present', () => {
      render(
        <NativeSelect options={mockOptions}>
          <NativeOption value="override-child">Ignored Child Option</NativeOption>
          <NativeOptGroup label="Ignored Group">
            <NativeOption value="nested">Ignored Nested</NativeOption>
          </NativeOptGroup>
        </NativeSelect>
      );

      // options prop takes precedence
      expect(screen.getByRole('option', { name: 'Apple' })).toBeTruthy();
      expect(screen.getByRole('option', { name: 'Banana' })).toBeTruthy();
      expect(screen.getByRole('option', { name: 'Number Value' })).toBeTruthy();

      // children should not be rendered
      expect(screen.queryByRole('option', { name: 'Ignored Child Option' })).toBeNull();
      expect(screen.queryByRole('group')).toBeNull();
      expect(screen.queryByRole('option', { name: 'Ignored Nested' })).toBeNull();
    });

    it('should render empty select when neither children nor options is provided', () => {
      const { container } = render(<NativeSelect />);
      const select = container.querySelector('select');
      expect(select).toBeTruthy();
      expect(select?.children.length).toBe(0);
    });

    it('should forward ref and native select attributes (disabled, name, id)', () => {
      const ref = React.createRef<HTMLSelectElement>();
      render(
        <NativeSelect
          ref={ref}
          options={mockOptions}
          disabled
          name="select-name"
          id="select-id"
          aria-label="Fruit Select"
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
      expect(ref.current?.disabled).toBe(true);
      expect(ref.current?.name).toBe('select-name');
      expect(ref.current?.id).toBe('select-id');
      expect(ref.current?.getAttribute('aria-label')).toBe('Fruit Select');
    });
  });
});
