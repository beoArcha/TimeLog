// @vitest-environment jsdom
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SidebarProjectForm } from '@layouts/parts/sidebar/SidebarProjectForm';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

describe('SidebarProjectForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render primary tier in collapsed state by default when mounted', () => {
    // Arrange
    const onAdd = vi.fn();

    // Act
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm onAddProject={onAdd} locale="en" />
      </MockProviders>
    );

    // Assert
    expect(container.querySelector('#new-project-input')).not.toBeNull();
    expect(container.querySelector('#add-project-btn')).not.toBeNull();
    expect(container.querySelector('#sidebar-project-toggle-advanced')).not.toBeNull();
    expect(container.querySelector('#sidebar-project-advanced-drawer')).toBeNull();
    expect(container.querySelector('#sidebar-project-toggle-advanced')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('should expand advanced drawer when toggle button is clicked', () => {
    // Arrange
    const onAdd = vi.fn();
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm onAddProject={onAdd} locale="en" />
      </MockProviders>
    );
    const toggleBtn = container.querySelector('#sidebar-project-toggle-advanced') as HTMLButtonElement;

    // Act
    fireEvent.click(toggleBtn);

    // Assert
    expect(container.querySelector('#sidebar-project-advanced-drawer')).not.toBeNull();
    expect(container.querySelector('#sidebar-project-description-input')).not.toBeNull();
    expect(container.querySelector('#sidebar-project-icon-input')).not.toBeNull();
    expect(container.querySelector('#sidebar-project-tags-input')).not.toBeNull();
    expect(container.querySelector('#new-project-concurrency')).not.toBeNull();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
  });

  it('should collapse advanced drawer when toggle button is clicked again', () => {
    // Arrange
    const onAdd = vi.fn();
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm onAddProject={onAdd} locale="en" />
      </MockProviders>
    );
    const toggleBtn = container.querySelector('#sidebar-project-toggle-advanced') as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    expect(container.querySelector('#sidebar-project-advanced-drawer')).not.toBeNull();

    // Act
    fireEvent.click(toggleBtn);

    // Assert
    expect(container.querySelector('#sidebar-project-advanced-drawer')).toBeNull();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should submit project payload with primary values when submitted without expanding drawer', () => {
    // Arrange
    const onAdd = vi.fn();
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm onAddProject={onAdd} locale="en" />
      </MockProviders>
    );
    const input = container.querySelector('#new-project-input') as HTMLInputElement;
    const colorBtn = container.querySelector('#color-picker-teal') as HTMLButtonElement;
    const addBtn = container.querySelector('#add-project-btn') as HTMLButtonElement;

    // Act
    fireEvent.change(input, { target: { value: 'Primary Project' } });
    fireEvent.click(colorBtn);
    fireEvent.click(addBtn);

    // Assert
    expect(onAdd).toHaveBeenCalledWith('Primary Project', 'teal', null, null, null, false);
  });

  it('should submit project payload with advanced options when drawer fields are populated', () => {
    // Arrange
    const onAdd = vi.fn();
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm onAddProject={onAdd} locale="en" />
      </MockProviders>
    );
    const input = container.querySelector('#new-project-input') as HTMLInputElement;
    const toggleBtn = container.querySelector('#sidebar-project-toggle-advanced') as HTMLButtonElement;
    fireEvent.change(input, { target: { value: 'Advanced Project' } });
    fireEvent.click(toggleBtn);

    const descInput = container.querySelector('#sidebar-project-description-input') as HTMLTextAreaElement;
    const iconInput = container.querySelector('#sidebar-project-icon-input') as HTMLInputElement;
    const tagsInput = container.querySelector('#sidebar-project-tags-input') as HTMLInputElement;
    const switchBtn = container.querySelector('#new-project-concurrency') as HTMLElement;
    const addBtn = container.querySelector('#add-project-btn') as HTMLButtonElement;

    // Act
    fireEvent.change(descInput, { target: { value: 'Deep architecture description' } });
    fireEvent.change(iconInput, { target: { value: '🚀' } });
    fireEvent.change(tagsInput, { target: { value: 'frontend, ui, core' } });
    fireEvent.click(switchBtn);
    fireEvent.click(addBtn);

    // Assert
    expect(onAdd).toHaveBeenCalledWith(
      'Advanced Project',
      'violet',
      'Deep architecture description',
      '🚀',
      ['frontend', 'ui', 'core'],
      true
    );
  });

  it('should submit project when Enter key is pressed in project name input', () => {
    // Arrange
    const onAdd = vi.fn();
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm onAddProject={onAdd} locale="en" />
      </MockProviders>
    );
    const input = container.querySelector('#new-project-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Enter Key Project' } });

    // Act
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Assert
    expect(onAdd).toHaveBeenCalledWith('Enter Key Project', 'violet', null, null, null, false);
  });

  it('should not submit project when project name is empty or only whitespace', () => {
    // Arrange
    const onAdd = vi.fn();
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm onAddProject={onAdd} locale="en" />
      </MockProviders>
    );
    const input = container.querySelector('#new-project-input') as HTMLInputElement;
    const addBtn = container.querySelector('#add-project-btn') as HTMLButtonElement;

    // Act
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(addBtn);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Assert
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('should reset form inputs and collapse advanced drawer after successful submission', () => {
    // Arrange
    const onAdd = vi.fn();
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm onAddProject={onAdd} locale="en" />
      </MockProviders>
    );
    const input = container.querySelector('#new-project-input') as HTMLInputElement;
    const toggleBtn = container.querySelector('#sidebar-project-toggle-advanced') as HTMLButtonElement;
    fireEvent.change(input, { target: { value: 'Reset Project' } });
    fireEvent.click(toggleBtn);
    const descInput = container.querySelector('#sidebar-project-description-input') as HTMLTextAreaElement;
    fireEvent.change(descInput, { target: { value: 'Temporary text' } });
    const addBtn = container.querySelector('#add-project-btn') as HTMLButtonElement;

    // Act
    fireEvent.click(addBtn);

    // Assert
    expect(input.value).toBe('');
    expect(container.querySelector('#sidebar-project-advanced-drawer')).toBeNull();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should render Paintbrush custom color swatch and hidden color input', () => {
    // Arrange & Act
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm onAddProject={vi.fn()} locale="en" />
      </MockProviders>
    );

    // Assert
    const customSwatch = container.querySelector('#color-picker-custom');
    const customInput = container.querySelector('#custom-color-input') as HTMLInputElement;

    expect(customSwatch).not.toBeNull();
    expect(customInput).not.toBeNull();
    expect(customSwatch?.getAttribute('aria-label')).toBe('Custom Color');
    expect(customInput?.type).toBe('color');
  });

  it('should allow picking arbitrary HEX color via custom color input and submit it', () => {
    // Arrange
    const onAdd = vi.fn();
    const onColorChange = vi.fn();
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm
          onAddProject={onAdd}
          onColorChange={onColorChange}
          locale="en"
        />
      </MockProviders>
    );

    const input = container.querySelector('#new-project-input') as HTMLInputElement;
    const customInput = container.querySelector('#custom-color-input') as HTMLInputElement;
    const addBtn = container.querySelector('#add-project-btn') as HTMLButtonElement;

    // Act: enter name, select custom hex color, and submit
    fireEvent.change(input, { target: { value: 'Custom Color Project' } });
    fireEvent.change(customInput, { target: { value: '#3b82f6' } });
    fireEvent.click(addBtn);

    // Assert
    expect(onColorChange).toHaveBeenCalledWith('#3b82f6');
    expect(onAdd).toHaveBeenCalledWith(
      'Custom Color Project',
      '#3b82f6',
      null,
      null,
      null,
      false
    );
  });

  it('should switch back to palette color after selecting custom color', () => {
    // Arrange
    const onAdd = vi.fn();
    const { container } = render(
      <MockProviders>
        <SidebarProjectForm onAddProject={onAdd} locale="en" />
      </MockProviders>
    );

    const input = container.querySelector('#new-project-input') as HTMLInputElement;
    const customInput = container.querySelector('#custom-color-input') as HTMLInputElement;
    const emeraldSwatch = container.querySelector('#color-picker-emerald') as HTMLButtonElement;
    const addBtn = container.querySelector('#add-project-btn') as HTMLButtonElement;

    // Act
    fireEvent.change(input, { target: { value: 'Switched Project' } });
    fireEvent.change(customInput, { target: { value: '#ff4400' } });
    fireEvent.click(emeraldSwatch);
    fireEvent.click(addBtn);

    // Assert
    expect(onAdd).toHaveBeenCalledWith(
      'Switched Project',
      'emerald',
      null,
      null,
      null,
      false
    );
  });
});
