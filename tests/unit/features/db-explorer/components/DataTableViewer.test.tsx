// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import DataTableViewer from '@features/db-explorer/components/DataTableViewer';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';

describe('DataTableViewer', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the projects table by default with all project rows', () => {
    // Arrange
    const projects = [
      aProject({ id: 'proj-1', name: 'Alpha Project' }),
      aProject({ id: 'proj-2', name: 'Beta Project' }),
    ];

    // Act
    render(
      <MockProviders dataState={{ projects }}>
        <DataTableViewer />
      </MockProviders>
    );

    // Assert
    expect(screen.getByTestId('data-table-viewer')).not.toBeNull();
    expect(screen.getByText('Alpha Project')).not.toBeNull();
    expect(screen.getByText('Beta Project')).not.toBeNull();
  });

  it('should switch to tasks table when tasks button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const tasks = [
      aTask({ id: 'task-1', name: 'Develop Feature X' }),
    ];

    render(
      <MockProviders dataState={{ tasks }}>
        <DataTableViewer />
      </MockProviders>
    );

    // Act
    const tasksBtn = screen.getByTestId('select-table-tasks');
    await user.click(tasksBtn);

    // Assert
    expect(screen.getByText('Develop Feature X')).not.toBeNull();
  });

  it('should filter rows based on search input', async () => {
    // Arrange
    const user = userEvent.setup();
    const projects = [
      aProject({ id: 'proj-apple', name: 'Apple Research' }),
      aProject({ id: 'proj-banana', name: 'Banana Harvest' }),
    ];

    render(
      <MockProviders dataState={{ projects }}>
        <DataTableViewer />
      </MockProviders>
    );

    // Act
    const searchInput = screen.getByTestId('table-viewer-search');
    await user.type(searchInput, 'banana');

    // Assert
    expect(screen.queryByText('Apple Research')).toBeNull();
    expect(screen.getByText('Banana Harvest')).not.toBeNull();
  });

  it('should paginate rows and enable next page button when rows exceed page size', async () => {
    // Arrange
    const user = userEvent.setup();
    const projects = Array.from({ length: 15 }, (_, i) =>
      aProject({ id: `p-${i + 1}`, name: `Project ${i + 1}` })
    );

    render(
      <MockProviders dataState={{ projects }}>
        <DataTableViewer />
      </MockProviders>
    );

    // Act & Assert
    expect(screen.getByText('Project 1')).not.toBeNull();
    expect(screen.queryByText('Project 15')).toBeNull();

    const nextBtn = screen.getByTestId('pagination-next');
    expect(nextBtn).not.toBeNull();
    await user.click(nextBtn);

    expect(screen.getByText('Project 15')).not.toBeNull();
  });

  it('should open row details dialog and close it upon close button click', async () => {
    // Arrange
    const user = userEvent.setup();
    const projects = [aProject({ id: 'proj-details', name: 'Detailed Project' })];

    render(
      <MockProviders dataState={{ projects }}>
        <DataTableViewer />
      </MockProviders>
    );

    // Act: open details
    const detailsBtn = screen.getByTestId('row-details-btn-proj-details');
    await user.click(detailsBtn);

    // Assert dialog opened
    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(within(dialog).getByText(/Detailed Project/i)).not.toBeNull();

    // Act: close dialog
    const closeBtn = screen.getByTestId('close-row-details');
    await user.click(closeBtn);

    // Assert dialog closed
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should allow inline editing of a cell and trigger project update', async () => {
    // Arrange
    const user = userEvent.setup();
    const handleUpdateProjectMock = vi.fn().mockResolvedValue(undefined);
    const projects = [aProject({ id: 'proj-edit', name: 'Original Name' })];

    render(
      <MockProviders
        dataState={{
          projects,
          handleUpdateProject: handleUpdateProjectMock,
        }}
      >
        <DataTableViewer />
      </MockProviders>
    );

    // Act: trigger edit via edit button
    const editBtn = screen.getByTestId('row-edit-btn-proj-edit');
    await user.click(editBtn);

    // Edit input appears
    const input = screen.getByTestId('inline-cell-input');
    await user.clear(input);
    await user.type(input, 'New Edited Name');

    // Save inline edit
    const saveBtn = screen.getByTestId('inline-cell-save');
    await user.click(saveBtn);

    // Assert
    expect(handleUpdateProjectMock).toHaveBeenCalledWith('proj-edit', 'New Edited Name', projects[0].color);
  });

  it('should render correctly when composed via the composite pattern with explicit subcomponents', () => {
    // Arrange
    const projects = [aProject({ id: 'proj-comp', name: 'Composite Project' })];

    // Act
    render(
      <MockProviders dataState={{ projects }}>
        <DataTableViewer>
          <DataTableViewer.Header />
          <DataTableViewer.Toolbar>
            <DataTableViewer.TableSelector />
            <DataTableViewer.Search />
          </DataTableViewer.Toolbar>
          <DataTableViewer.Table />
          <DataTableViewer.Pagination />
        </DataTableViewer>
      </MockProviders>
    );

    // Assert
    expect(screen.getByTestId('data-table-viewer')).not.toBeNull();
    expect(screen.getByTestId('table-viewer-search')).not.toBeNull();
    expect(screen.getByText('Composite Project')).not.toBeNull();
    expect(screen.getByTestId('pagination-prev')).not.toBeNull();
  });
});

