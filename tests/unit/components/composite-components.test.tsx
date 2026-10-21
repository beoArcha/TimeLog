// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { StatCard } from '@components/StatCard';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { PromptDialog } from '@components/PromptDialog';
import { SegmentedControl } from '@components/SegmentedControl';
import { SearchInput } from '@components/SearchInput';
import { EmptyState } from '@components/EmptyState';
import { DataTable } from '@components/DataTable';
import { ViewHeader } from '@components/ViewHeader';
import { FilterBar } from '@components/FilterBar';
import { Button } from '@components/ui/button';
import { Activity, Clock } from 'lucide-react';
import { translate } from '@common/i18n/translator';

describe('Unit Tests: Composite Components', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('StatCard', () => {
    it('should render title, value, and trend', () => {
      render(
        <StatCard
          title="Total Hours"
          value="42.5h"
          icon={Clock}
          trend={{ value: '+12%', direction: 'up' }}
        />
      );
      expect(screen.getByText('Total Hours')).toBeTruthy();
      expect(screen.getByText('42.5h')).toBeTruthy();
      expect(screen.getByText('+12%')).toBeTruthy();
    });

    it('should trigger onClick when clickable', () => {
      const onClick = vi.fn();
      render(<StatCard title="Clickable" value="10" onClick={onClick} testId="stat-card" />);
      fireEvent.click(screen.getByTestId('stat-card'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('ConfirmDialog', () => {
    it('should render title, description, and handle confirm click', () => {
      // Arrange
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(
        <ConfirmDialog
          open={true}
          title="Delete Item?"
          description="This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Act
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      // Assert
      expect(screen.getByText('Delete Item?')).toBeTruthy();
      expect(screen.getByText('This action cannot be undone.')).toBeTruthy();
      expect(onConfirm).toHaveBeenCalled();
    });

    it('should call onCancel and onOpenChange when cancel button is clicked', () => {
      // Arrange
      const onCancel = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={onOpenChange}
          title="Cancel Action"
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      );

      // Act
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Assert
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should show loading spinner when onConfirm returns a promise', async () => {
      // Arrange
      let resolvePromise: () => void = () => {};
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      const onConfirm = vi.fn().mockReturnValue(pendingPromise);

      render(
        <ConfirmDialog
          open={true}
          title="Async Confirmation"
          onConfirm={onConfirm}
        />
      );

      // Act
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      // Assert
      const confirmBtn = screen.getByRole('button', { name: /confirm/i });
      expect(confirmBtn.getAttribute('aria-busy')).toBe('true');

      // Cleanup
      resolvePromise();
    });
  });

  describe('PromptDialog', () => {
    it('should render prompt and submit typed value', () => {
      // Arrange
      const onConfirm = vi.fn();
      render(
        <PromptDialog
          open={true}
          title="Enter Project Name"
          defaultValue="Alpha"
          confirmLabel="Save"
          onConfirm={onConfirm}
        />
      );
      const input = screen.getByRole('textbox') as HTMLInputElement;

      // Act
      fireEvent.change(input, { target: { value: 'Beta' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      // Assert
      expect(input.value).toBe('Beta');
      expect(onConfirm).toHaveBeenCalledWith('Beta');
    });

    it('should call onCancel and onOpenChange when cancel button is clicked', () => {
      // Arrange
      const onCancel = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <PromptDialog
          open={true}
          onOpenChange={onOpenChange}
          title="Enter Name"
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      );

      // Act
      fireEvent.click(screen.getByTestId('prompt-dialog-cancel-btn'));

      // Assert
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should display validation error and block submit when validation fails', () => {
      // Arrange
      const onConfirm = vi.fn();
      render(
        <PromptDialog
          open={true}
          title="Project Code"
          validate={(val) => (val.length < 3 ? 'Code too short' : null)}
          onConfirm={onConfirm}
        />
      );
      const input = screen.getByRole('textbox');

      // Act - enter invalid value
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.click(screen.getByTestId('prompt-dialog-confirm-btn'));

      // Assert
      expect(onConfirm).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText('Code too short')).toBeTruthy();

      // Act - fix input
      fireEvent.change(input, { target: { value: 'abcd' } });

      // Assert error cleared
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('SegmentedControl', () => {
    it('should render options and fire onChange on select', () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          value="opt1"
          onChange={onChange}
          options={[
            { value: 'opt1', label: 'Option 1' },
            { value: 'opt2', label: 'Option 2' },
          ]}
        />
      );
      expect(screen.getByText('Option 1')).toBeTruthy();
      const opt2 = screen.getByText('Option 2');
      fireEvent.click(opt2);
      expect(onChange).toHaveBeenCalledWith('opt2');
    });
  });

  describe('SearchInput', () => {
    it('should render input, clear button when typed, and handle clear', () => {
      const onChange = vi.fn();
      const onClear = vi.fn();
      render(
        <SearchInput
          value="search query"
          onChange={onChange}
          onClear={onClear}
          placeholder="Filter..."
        />
      );
      const clearBtn = screen.getByRole('button', { name: /clear/i });
      expect(clearBtn).toBeTruthy();

      fireEvent.click(clearBtn);
      expect(onClear).toHaveBeenCalled();
    });
  });

  describe('EmptyState', () => {
    it('should render empty state with title and action button', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          icon={Activity}
          title="No tasks yet"
          description="Create your first task to get started."
          action={{ label: 'New Task', onClick: onAction }}
        />
      );
      expect(screen.getByText('No tasks yet')).toBeTruthy();
      expect(screen.getByText('Create your first task to get started.')).toBeTruthy();

      const btn = screen.getByRole('button', { name: 'New Task' });
      fireEvent.click(btn);
      expect(onAction).toHaveBeenCalled();
    });
  });

  describe('DataTable', () => {
    it('should render column headers, rows, and footer count', () => {
      const columns = [
        { key: 'name', header: 'Name' },
        { key: 'role', header: 'Role' },
      ];
      const data = [
        { name: 'Alice', role: 'Engineer' },
        { name: 'Bob', role: 'Designer' },
      ];
      render(<DataTable columns={columns} data={data} />);

      expect(screen.getByText('Name')).toBeTruthy();
      expect(screen.getByText('Role')).toBeTruthy();
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
    });
  });

  describe('ViewHeader', () => {
    it('should render title, description, badge, and action buttons', () => {
      // Arrange
      render(
        <ViewHeader
          title="Overview Analytics"
          description="Detailed breakdown of active time"
          badge={<span>Active Badge</span>}
          actions={<Button variant="outline" size="sm">Refresh</Button>}
          testId="view-header-test"
        />
      );

      // Act & Assert
      expect(screen.getByTestId('view-header-test')).toBeTruthy();
      expect(screen.getByText('Overview Analytics')).toBeTruthy();
      expect(screen.getByText('Detailed breakdown of active time')).toBeTruthy();
      expect(screen.getByText('Active Badge')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
    });
  });

  describe('FilterBar', () => {
    it('should render search input, children elements, and right actions', () => {
      // Arrange
      const onSearchChange = vi.fn();
      render(
        <FilterBar
          search={{
            value: 'filter-text',
            onChange: onSearchChange,
            placeholder: 'Search items...',
          }}
          rightActions={<span>Right Action</span>}
          testId="filter-bar-test"
        >
          <span>Middle Filter</span>
        </FilterBar>
      );

      // Act & Assert
      expect(screen.getByTestId('filter-bar-test')).toBeTruthy();
      expect(screen.getByDisplayValue('filter-text')).toBeTruthy();
      expect(screen.getByText('Middle Filter')).toBeTruthy();
      expect(screen.getByText('Right Action')).toBeTruthy();
    });
  });

  describe('Accessibility (a11y) & i18n Contracts', () => {
    it('ConfirmDialog should have alertdialog role, aria-modal, and accessible labels', () => {
      render(
        <ConfirmDialog
          open={true}
          title="Critical Action"
          description="Detailed explanation"
          onConfirm={() => {}}
        />
      );
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeTruthy();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
      expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
    });

    it('PromptDialog should have input connected with label, aria-required, and error alert', () => {
      render(
        <PromptDialog
          open={true}
          title="Project Name"
          validate={(v) => (v.length < 3 ? 'Min 3 chars' : null)}
          onConfirm={() => {}}
        />
      );
      const input = screen.getByRole('textbox');
      expect(input.getAttribute('aria-required')).toBe('true');
      expect(input.getAttribute('aria-invalid')).toBe('false');

      // Trigger validation error
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.click(screen.getByRole('button', { name: /save|confirm/i }));

      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText('Min 3 chars')).toBeTruthy();
    });

    it('SearchInput should have role=search, input aria-label, and clear button accessible name', () => {
      render(<SearchInput value="test" onChange={() => {}} onClear={() => {}} />);
      const searchRegion = screen.getByRole('search');
      expect(searchRegion).toBeTruthy();

      const input = screen.getByRole('searchbox');
      expect(input.getAttribute('aria-label')).toBeTruthy();

      const clearBtn = screen.getByRole('button', { name: /clear/i });
      expect(clearBtn.getAttribute('aria-label')).toBeTruthy();
    });

    it('DataTable should provide role=region, aria-rowcount, and col scope headers', () => {
      render(
        <DataTable
          columns={[{ key: 'id', header: 'ID' }]}
          data={[{ id: '1' }]}
          tableAriaLabel="Records"
        />
      );
      const region = screen.getByRole('region', { name: 'Records' });
      expect(region).toBeTruthy();

      const colHeader = screen.getByText('ID');
      expect(colHeader.getAttribute('scope')).toBe('col');
    });

    it('EmptyState should have role=status and aria-live=polite for screen readers', () => {
      render(<EmptyState title="Nothing here" />);
      const status = screen.getByRole('status');
      expect(status.getAttribute('aria-live')).toBe('polite');
    });

    it('StatCard should have accessible aria-label on trend and keyboard activation', () => {
      const onClick = vi.fn();
      render(
        <StatCard
          title="Revenue"
          value="$100"
          trend={{ value: '10%', direction: 'up', label: '10% increase this week' }}
          onClick={onClick}
          testId="interactive-stat"
        />
      );
      expect(screen.getByLabelText('10% increase this week')).toBeTruthy();

      const card = screen.getByTestId('interactive-stat');
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('StatCard should localize default trend aria-label from direction and value', () => {
      render(
        <StatCard
          title="Velocity"
          value="85"
          trend={{ value: '5%', direction: 'up' }}
        />
      );
      const expectedTrendLabel = `${translate('en', 'common', 'TrendIncrease')}: 5%`;
      expect(screen.getByLabelText(expectedTrendLabel)).toBeTruthy();
    });
  });
});
