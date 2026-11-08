// @vitest-environment jsdom
import { JSDOM } from 'jsdom';

if (typeof document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  });
  const g = globalThis as unknown as Record<string, unknown>;
  g.window = dom.window;
  g.document = dom.window.document;
  g.navigator = dom.window.navigator;
  g.HTMLElement = dom.window.HTMLElement;
  g.HTMLInputElement = dom.window.HTMLInputElement;
  g.Node = dom.window.Node;
  g.MutationObserver = dom.window.MutationObserver;
  g.getComputedStyle = dom.window.getComputedStyle;
}

import React from 'react';
import { render, within, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { DataTable, type DataTableColumn } from '@components/DataTable';
import { TableRow, TableCell } from '@components/ui/table';

interface TestItem {
  id: string;
  name: string;
  role: string;
}

const mockColumns: DataTableColumn<TestItem>[] = [
  { key: 'name', header: 'Name' },
  { key: 'role', header: 'Role' },
];

const mockData: TestItem[] = [
  { id: '1', name: 'Alice', role: 'Engineer' },
  { id: '2', name: 'Bob', role: 'Designer' },
  { id: '3', name: 'Charlie', role: 'Manager' },
];

describe('Unit Tests: DataTable ARIA Semantics and Accessibility', () => {
  afterEach(cleanup);

  it('renders table headers and data rows with text content', () => {
    const { container } = render(<DataTable columns={mockColumns} data={mockData} />);
    const view = within(container);

    expect(view.getByText('Name')).toBeTruthy();
    expect(view.getByText('Role')).toBeTruthy();
    expect(view.getByText('Alice')).toBeTruthy();
    expect(view.getByText('Bob')).toBeTruthy();
    expect(view.getByText('Charlie')).toBeTruthy();
    expect(view.getByText('3')).toBeTruthy();
  });

  it('sets header row to aria-rowindex="1" and data rows starting at "2"', () => {
    const { container } = render(<DataTable columns={mockColumns} data={mockData} />);

    const headerRows = container.querySelectorAll('thead tr');
    expect(headerRows.length).toBe(1);
    expect(headerRows[0].getAttribute('aria-rowindex')).toBe('1');

    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows.length).toBe(3);
    expect(bodyRows[0].getAttribute('aria-rowindex')).toBe('2');
    expect(bodyRows[1].getAttribute('aria-rowindex')).toBe('3');
    expect(bodyRows[2].getAttribute('aria-rowindex')).toBe('4');
  });

  it('calculates aria-rowcount by adding 1 for the header row when totalCount is not provided', () => {
    const { container } = render(<DataTable columns={mockColumns} data={mockData} />);

    const table = container.querySelector('table');
    expect(table).toBeTruthy();
    // 3 data rows + 1 header row = 4
    expect(table?.getAttribute('aria-rowcount')).toBe('4');
  });

  it('calculates aria-rowcount using totalCount + 1 when totalCount is provided for pagination or virtualization', () => {
    const { container } = render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        totalCount={100}
      />
    );

    const table = container.querySelector('table');
    expect(table).toBeTruthy();
    // totalCount 100 + 1 header row = 101
    expect(table?.getAttribute('aria-rowcount')).toBe('101');
  });

  it('applies rowIndexOffset to data rows for paginated slices', () => {
    const { container } = render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        totalCount={50}
        rowIndexOffset={10}
      />
    );

    const bodyRows = container.querySelectorAll('tbody tr');
    // Header is row 1; offset 10 makes first data row rowindex 12 (10 + 0 + 2)
    expect(bodyRows[0].getAttribute('aria-rowindex')).toBe('12');
    expect(bodyRows[1].getAttribute('aria-rowindex')).toBe('13');
    expect(bodyRows[2].getAttribute('aria-rowindex')).toBe('14');
  });

  it('sets aria-rowcount to 1 when dataset is empty and no totalCount is provided', () => {
    const { container } = render(
      <DataTable
        columns={mockColumns}
        data={[]}
        emptyTitle="No records found"
      />
    );

    const table = container.querySelector('table');
    expect(table).toBeTruthy();
    // 0 data rows + 1 header row = 1
    expect(table?.getAttribute('aria-rowcount')).toBe('1');
    const view = within(container);
    expect(view.getByText('No records found')).toBeTruthy();
  });

  it('exposes correct aria-colcount and 1-based aria-colindex on headers and cells', () => {
    const { container } = render(<DataTable columns={mockColumns} data={mockData} />);

    const table = container.querySelector('table');
    expect(table?.getAttribute('aria-colcount')).toBe('2');

    const headers = container.querySelectorAll('th');
    expect(headers.length).toBe(2);
    expect(headers[0].getAttribute('aria-colindex')).toBe('1');
    expect(headers[1].getAttribute('aria-colindex')).toBe('2');

    const firstRowCells = container.querySelectorAll('tbody tr:first-child td');
    expect(firstRowCells.length).toBe(2);
    expect(firstRowCells[0].getAttribute('aria-colindex')).toBe('1');
    expect(firstRowCells[1].getAttribute('aria-colindex')).toBe('2');
  });

  it('delegates row rendering to custom renderRow callback when provided', () => {
    const { container } = render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        renderRow={(item, index) => (
          <TableRow key={item.id} data-testid={`custom-row-${index}`}>
            <TableCell>{item.name} (Custom)</TableCell>
            <TableCell>{item.role}</TableCell>
          </TableRow>
        )}
      />
    );

    const view = within(container);
    expect(view.getByTestId('custom-row-0')).toBeTruthy();
    expect(view.getByText('Alice (Custom)')).toBeTruthy();
  });

  it('provides accessible region role and accessible label', () => {
    const { container } = render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        tableAriaLabel="Employees Directory"
      />
    );

    const view = within(container);
    const region = view.getByRole('region', { name: 'Employees Directory' });
    expect(region).toBeTruthy();
  });
});
