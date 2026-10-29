// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { EditProjectDialog } from '@/src/layouts/parts/EditProjectDialog';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: EditProjectDialog', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const baseProject = {
    id: 'p-100',
    name: 'Project Alpha',
    color: 'teal',
    description: 'Alpha description',
    icon: '⚡',
    tags: ['core', 'v1'],
  };

  it('should render dialog when open with initial project details populated', () => {
    // Arrange
    const state = getMockOxyFlowState();

    // Act
    render(
      <MockProviders state={state}>
        <EditProjectDialog
          open={true}
          onOpenChange={vi.fn()}
          project={baseProject}
          onSave={vi.fn()}
        />
      </MockProviders>,
    );

    // Assert
    const nameInput = screen.getByLabelText(/Project Name/i) as HTMLInputElement;
    const iconInput = screen.getByLabelText(/Emoji Icon/i) as HTMLInputElement;
    const descInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    const tagsInput = screen.getByLabelText(/Tags/i) as HTMLInputElement;

    expect(nameInput.value).toBe('Project Alpha');
    expect(iconInput.value).toBe('⚡');
    expect(descInput.value).toBe('Alpha description');
    expect(tagsInput.value).toBe('core, v1');
  });

  it('should call onSave with trimmed values and close dialog when Save button is clicked', () => {
    // Arrange
    const state = getMockOxyFlowState();
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <MockProviders state={state}>
        <EditProjectDialog
          open={true}
          onOpenChange={onOpenChange}
          project={baseProject}
          onSave={onSave}
        />
      </MockProviders>,
    );

    // Act
    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(onSave).toHaveBeenCalledWith({
      id: 'p-100',
      name: 'Project Alpha',
      color: 'teal',
      description: 'Alpha description',
      icon: '⚡',
      tags: ['core', 'v1'],
      allowConcurrency: false,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should allow modifying name, color, description and tags', () => {
    // Arrange
    const state = getMockOxyFlowState();
    const onSave = vi.fn();

    render(
      <MockProviders state={state}>
        <EditProjectDialog
          open={true}
          onOpenChange={vi.fn()}
          project={baseProject}
          onSave={onSave}
        />
      </MockProviders>,
    );

    // Act
    const nameInput = screen.getByLabelText(/Project Name/i);
    fireEvent.change(nameInput, { target: { value: 'Renamed Project' } });

    const descInput = screen.getByLabelText(/Description/i);
    fireEvent.change(descInput, { target: { value: 'New description' } });

    const tagsInput = screen.getByLabelText(/Tags/i);
    fireEvent.change(tagsInput, { target: { value: 'frontend, ui' } });

    const roseColorBtn = screen.getByRole('button', { name: /rose/i });
    fireEvent.click(roseColorBtn);

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    // Assert
    expect(onSave).toHaveBeenCalledWith({
      id: 'p-100',
      name: 'Renamed Project',
      color: 'rose',
      description: 'New description',
      icon: '⚡',
      tags: ['frontend', 'ui'],
      allowConcurrency: false,
    });
  });

  it('should support picking and saving multi-byte compound emoji without truncation', () => {
    // Arrange
    const state = getMockOxyFlowState();
    const onSave = vi.fn();

    render(
      <MockProviders state={state}>
        <EditProjectDialog
          open={true}
          onOpenChange={vi.fn()}
          project={baseProject}
          onSave={onSave}
        />
      </MockProviders>,
    );

    // Open EmojiPicker
    const pickerTrigger = screen.getByTestId('edit-project-emoji-picker-trigger');
    fireEvent.click(pickerTrigger);

    // Select Rocket emoji
    const rocketBtn = screen.getByTestId('edit-project-emoji-picker-emoji-🚀');
    fireEvent.click(rocketBtn);

    // Save
    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: '🚀',
      })
    );
  });

  it('should allow typing multi-byte compound emoji directly without truncation', () => {
    // Arrange
    const state = getMockOxyFlowState();
    const onSave = vi.fn();

    render(
      <MockProviders state={state}>
        <EditProjectDialog
          open={true}
          onOpenChange={vi.fn()}
          project={baseProject}
          onSave={onSave}
        />
      </MockProviders>,
    );

    const iconInput = screen.getByLabelText(/Emoji Icon/i);
    // Compound ZWJ emoji (technologist)
    fireEvent.change(iconInput, { target: { value: '👨‍💻' } });

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: '👨‍💻',
      })
    );
  });

  it('should close dialog when Cancel button is clicked', () => {
    // Arrange
    const state = getMockOxyFlowState();
    const onOpenChange = vi.fn();

    render(
      <MockProviders state={state}>
        <EditProjectDialog
          open={true}
          onOpenChange={onOpenChange}
          project={baseProject}
          onSave={vi.fn()}
        />
      </MockProviders>,
    );

    // Act
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should disable Save button when project name is empty', () => {
    // Arrange
    const state = getMockOxyFlowState();

    render(
      <MockProviders state={state}>
        <EditProjectDialog
          open={true}
          onOpenChange={vi.fn()}
          project={baseProject}
          onSave={vi.fn()}
        />
      </MockProviders>,
    );

    const nameInput = screen.getByLabelText(/Project Name/i);
    fireEvent.change(nameInput, { target: { value: '   ' } });

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
