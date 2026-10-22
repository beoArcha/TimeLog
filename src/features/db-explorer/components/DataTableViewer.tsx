/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from 'react';
import { Search, Eye, Edit3, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@components/ui/table';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { Heading, Text, Caption, MonoText } from '@components/ui/typography';
import { HStack, VStack } from '@components/ui/stack';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@components/ui/dialog';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';
import { useData } from '@common/hooks/DataContext';
import { ContextException } from '@common/exceptions';
import { cn } from '@/lib/utils';

export interface TableOption {
  id: string;
  label: string;
}

export const DEFAULT_DB_TABLES: readonly TableOption[] = [
  { id: 'projects', label: 'projects' },
  { id: 'tasks', label: 'tasks' },
  { id: 'time_logs', label: 'time_logs' },
  { id: 'holidays_leaves', label: 'holidays_leaves' },
  { id: 'patch_logs', label: 'patch_logs' },
];

export interface EditingCellState {
  rowId: string;
  column: string;
  value: string;
}

export interface DataTableViewerContextValue<T extends Record<string, unknown> = Record<string, unknown>> {
  data: T[];
  columns: string[];
  filteredRows: T[];
  paginatedRows: T[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  totalPages: number;
  effectivePage: number;
  startIndex: number;
  tables: readonly TableOption[];
  activeTable: string;
  onSelectTable: (tableId: string) => void;
  onCellEdit?: (rowId: string, column: string, newValue: string) => void | Promise<void>;
  editingCell: EditingCellState | null;
  setEditingCell: React.Dispatch<React.SetStateAction<EditingCellState | null>>;
  detailRow: T | null;
  setDetailRow: React.Dispatch<React.SetStateAction<T | null>>;
  resolveRowId: (item: T, index: number) => string;
  formatCellValue: (val: unknown) => string;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  searchable: boolean;
  className?: string;
}

const DataTableViewerContext = createContext<DataTableViewerContextValue | null>(null);

export function useDataTableViewerContext<T extends Record<string, unknown> = Record<string, unknown>>(): DataTableViewerContextValue<T> {
  const ctx = useContext(DataTableViewerContext);
  if (!ctx) {
    throw new ContextException(
      'DataTableViewer subcomponents must be used within a DataTableViewer composite component',
      'ERR_DATA_TABLE_VIEWER_CONTEXT'
    );
  }
  return ctx as DataTableViewerContextValue<T>;
}

export function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function resolveNullableText(
  currentValue: string | null,
  column: string,
  targetColumn: string,
  newValue: string
): string | null {
  if (column !== targetColumn) {
    return currentValue;
  }
  const trimmed = newValue.trim();
  return trimmed === '' ? null : trimmed;
}

export interface DataTableViewerProps<T extends Record<string, unknown> = Record<string, unknown>> {
  title?: string;
  description?: string;
  tables?: readonly TableOption[];
  activeTable?: string;
  onSelectTable?: (tableId: string) => void;
  data?: T[];
  columns?: string[];
  keyExtractor?: (item: T, index: number) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  onCellEdit?: (rowId: string, column: string, newValue: string) => void | Promise<void>;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Composite Subcomponent: Header
 * Renders title, description, and record count badge.
 */
export function DataTableViewerHeader({ className }: { className?: string }) {
  const { title, description, filteredRows } = useDataTableViewerContext();
  const { locale, customTranslations } = useSafeLocale();

  const resolvedTitle =
    title || translate(locale, 'database', 'InteractiveTableViewer', customTranslations);
  const resolvedDescription =
    description || translate(locale, 'database', 'DbDesc', customTranslations);

  return (
    <VStack gap="xs" className={className}>
      <HStack justify="between" align="center" className="flex-wrap gap-2">
        <Heading level={3} className="text-base sm:text-lg font-bold">
          {resolvedTitle}
        </Heading>
        <Badge variant="outline" size="sm" className="font-mono text-xs">
          {filteredRows.length} {translate(locale, 'database', 'Records', customTranslations)}
        </Badge>
      </HStack>
      <Caption variant="muted">{resolvedDescription}</Caption>
    </VStack>
  );
}

/**
 * Composite Subcomponent: Toolbar
 * Flex layout container for table switcher and search input.
 */
export function DataTableViewerToolbar({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <HStack justify="between" align="center" className={cn('flex-wrap gap-3', className)}>
      {children}
    </HStack>
  );
}

/**
 * Composite Subcomponent: TableSelector
 * Renders table selection buttons for switching database entities.
 */
export function DataTableViewerTableSelector({ className }: { className?: string }) {
  const { tables, activeTable, onSelectTable } = useDataTableViewerContext();

  if (!tables || tables.length === 0) {
    return null;
  }

  return (
    <HStack gap="xs" className={cn('flex-wrap', className)}>
      {tables.map((tbl) => {
        const isSelected = activeTable === tbl.id;
        return (
          <Button
            key={tbl.id}
            data-testid={`select-table-${tbl.id}`}
            variant={isSelected ? 'default' : 'outline'}
            size="xs"
            onClick={() => onSelectTable(tbl.id)}
            className="font-mono text-xs uppercase"
          >
            {tbl.label}
          </Button>
        );
      })}
    </HStack>
  );
}

/**
 * Composite Subcomponent: Search
 * Renders search input box with filter query binding.
 */
export function DataTableViewerSearch({ className }: { className?: string }) {
  const { searchable, searchQuery, setSearchQuery, setCurrentPage, searchPlaceholder } =
    useDataTableViewerContext();
  const { locale, customTranslations } = useSafeLocale();

  if (!searchable) {
    return null;
  }

  const resolvedPlaceholder =
    searchPlaceholder || translate(locale, 'database', 'SearchInTable', customTranslations);

  return (
    <HStack gap="xs" className={cn('w-full sm:w-auto min-w-[220px]', className)}>
      <Search className="w-4 h-4 text-muted-foreground shrink-0" />
      <Input
        data-testid="table-viewer-search"
        type="search"
        placeholder={resolvedPlaceholder}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setCurrentPage(1);
        }}
        className="h-8 text-xs font-mono"
      />
    </HStack>
  );
}

export interface DataTableViewerCellProps {
  key?: React.Key;
  rowId: string;
  column: string;
  value: unknown;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Composite Subcomponent: Cell
 * Renders a single cell with display text or inline editing input.
 */
export function DataTableViewerCell({
  rowId,
  column,
  value,
  onSave,
  onCancel,
}: DataTableViewerCellProps) {
  const { editingCell, setEditingCell, onCellEdit } = useDataTableViewerContext();
  const isEditing = editingCell?.rowId === rowId && editingCell?.column === column;

  const handleDoubleClick = () => {
    if (!onCellEdit) return;
    setEditingCell({
      rowId,
      column,
      value: value === null || value === undefined ? '' : String(value),
    });
  };

  return (
    <TableCell
      className="py-2 px-3 max-w-[200px] truncate"
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <HStack gap="xs" align="center">
          <Input
            autoFocus
            data-testid="inline-cell-input"
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onCancel();
            }}
            className="h-6 text-xs font-mono py-0 px-1.5"
          />
          <Button
            data-testid="inline-cell-save"
            variant="ghost"
            size="xs"
            onClick={onSave}
            className="h-6 w-6 p-0 text-emerald-500"
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={onCancel}
            className="h-6 w-6 p-0 text-rose-500"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </HStack>
      ) : (
        <span
          title={formatCellValue(value)}
          className="cursor-pointer hover:underline text-foreground"
        >
          {formatCellValue(value)}
        </span>
      )}
    </TableCell>
  );
}

export interface DataTableViewerRowProps<T extends Record<string, unknown> = Record<string, unknown>> {
  key?: React.Key;
  row: T;
  index: number;
}

/**
 * Composite Subcomponent: Row
 * Renders a table row with index, data cells, and action triggers.
 */
export function DataTableViewerRow<T extends Record<string, unknown>>({
  row,
  index,
}: DataTableViewerRowProps<T>) {
  const {
    columns,
    startIndex,
    resolveRowId,
    setDetailRow,
    onCellEdit,
    setEditingCell,
    editingCell,
  } = useDataTableViewerContext<T>();
  const { locale, customTranslations } = useSafeLocale();

  const rowId = resolveRowId(row, startIndex + index);

  const handleSaveCell = async () => {
    if (!editingCell || !onCellEdit) return;
    const { rowId: targetId, column, value } = editingCell;
    setEditingCell(null);
    await onCellEdit(targetId, column, value);
  };

  const handleCancelCell = () => {
    setEditingCell(null);
  };

  const handleEditClick = () => {
    if (!onCellEdit) return;
    const colToEdit = columns[1] ?? 'name';
    setEditingCell({
      rowId,
      column: colToEdit,
      value: row[colToEdit] === null || row[colToEdit] === undefined ? '' : String(row[colToEdit]),
    });
  };

  return (
    <TableRow
      data-testid={`table-row-${rowId}`}
      className="hover:bg-muted/40 transition-colors border-b border-border/40"
    >
      <TableCell className="py-2 px-3 text-muted-foreground text-center">
        {startIndex + index + 1}
      </TableCell>
      {columns.map((col) => (
        <DataTableViewerCell
          key={col}
          rowId={rowId}
          column={col}
          value={row[col]}
          onSave={handleSaveCell}
          onCancel={handleCancelCell}
        />
      ))}
      <TableCell className="py-2 px-3 text-right whitespace-nowrap">
        <HStack gap="xs" justify="end">
          <Button
            data-testid={`row-details-btn-${rowId}`}
            variant="ghost"
            size="xs"
            onClick={() => setDetailRow(row)}
            className="h-7 px-2 font-mono text-2xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            {translate(locale, 'database', 'RowDetails', customTranslations)}
          </Button>
          {onCellEdit && (
            <Button
              data-testid={`row-edit-btn-${rowId}`}
              variant="ghost"
              size="xs"
              onClick={handleEditClick}
              className="h-7 px-2 font-mono text-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
          )}
        </HStack>
      </TableCell>
    </TableRow>
  );
}

/**
 * Composite Subcomponent: Table
 * Renders the tabular layout containing headers and row composites.
 */
export function DataTableViewerTable({ className }: { className?: string }) {
  const { columns, paginatedRows } = useDataTableViewerContext();
  const { locale, customTranslations } = useSafeLocale();

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border bg-muted/20', className)}>
      <Table className="w-full text-left font-mono text-xs">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/50">
            <TableHead className="py-2 px-3 w-12 text-center">#</TableHead>
            {columns.map((col) => (
              <TableHead key={col} className="py-2 px-3 whitespace-nowrap font-bold text-foreground">
                {col}
              </TableHead>
            ))}
            <TableHead className="py-2 px-3 text-right">
              {translate(locale, 'database', 'ActionsLabel', customTranslations)}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">
                {translate(locale, 'database', 'NoRowsFound', customTranslations)}
              </TableCell>
            </TableRow>
          ) : (
            paginatedRows.map((row, idx) => (
              <DataTableViewerRow key={idx} row={row} index={idx} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Composite Subcomponent: Pagination
 * Renders page counter and pagination navigation buttons.
 */
export function DataTableViewerPagination({ className }: { className?: string }) {
  const { effectivePage, totalPages, setCurrentPage } = useDataTableViewerContext();
  const { locale, customTranslations } = useSafeLocale();

  return (
    <HStack justify="between" align="center" className={cn('flex-wrap gap-2 text-xs font-mono', className)}>
      <Text size="xs" variant="muted">
        {translate(locale, 'database', 'Page', customTranslations)} {effectivePage}{' '}
        {translate(locale, 'database', 'OfPages', customTranslations)} {totalPages}
      </Text>
      <HStack gap="xs">
        <Button
          data-testid="pagination-prev"
          variant="outline"
          size="xs"
          disabled={effectivePage <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="flex items-center gap-1 font-mono text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {translate(locale, 'database', 'PreviousPage', customTranslations)}
        </Button>
        <Button
          data-testid="pagination-next"
          variant="outline"
          size="xs"
          disabled={effectivePage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className="flex items-center gap-1 font-mono text-xs"
        >
          {translate(locale, 'database', 'NextPage', customTranslations)}
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </HStack>
    </HStack>
  );
}

/**
 * Composite Subcomponent: DetailModal
 * Renders modal dialog displaying all properties of inspected row.
 */
export function DataTableViewerDetailModal() {
  const { detailRow, setDetailRow, activeTable, resolveRowId } = useDataTableViewerContext();
  const { locale, customTranslations } = useSafeLocale();

  if (!detailRow) {
    return null;
  }

  const rowId = resolveRowId(detailRow, 0);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && setDetailRow(null)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {translate(locale, 'database', 'RowDetails', customTranslations)}: {rowId}
          </DialogTitle>
          <DialogDescription>
            {activeTable ? `TABLE ${activeTable} • ` : ''}
            {Object.keys(detailRow).length} properties
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[360px] overflow-y-auto space-y-2 p-2 bg-muted/40 rounded-xl border border-border">
          {Object.entries(detailRow).map(([k, v]) => (
            <div key={k} className="flex justify-between items-start gap-4 py-1 border-b border-border/30 text-xs font-mono">
              <span className="font-bold text-muted-foreground">{k}:</span>
              <MonoText size="xs" className="text-right break-all">
                {formatCellValue(v)}
              </MonoText>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            data-testid="close-row-details"
            variant="default"
            size="sm"
            onClick={() => setDetailRow(null)}
          >
            {translate(locale, 'common', 'Close', customTranslations)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Composite Component Root: DataTableViewer
 *
 * Implements the Composite Pattern. When children are passed, it serves as the
 * composite context coordinator for custom subcomponent arrangement.
 * When children are omitted, it renders the default complete composite composition.
 */
export function DataTableViewer<T extends Record<string, unknown> = Record<string, unknown>>({
  title,
  description,
  tables: propsTables,
  activeTable: propsActiveTable,
  onSelectTable: propsOnSelectTable,
  data: propsData,
  columns: customColumns,
  keyExtractor,
  searchable = true,
  searchPlaceholder,
  pageSize = 10,
  onCellEdit: propsOnCellEdit,
  className,
  children,
}: DataTableViewerProps<T>) {
  const dataContext = useData();

  const [internalActiveTable, setInternalActiveTable] = useState('projects');
  const [internalSearchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState<EditingCellState | null>(null);
  const [detailRow, setDetailRow] = useState<T | null>(null);

  const tables = propsTables ?? DEFAULT_DB_TABLES;
  const activeTable = propsActiveTable ?? internalActiveTable;

  const data = useMemo<T[]>(() => {
    if (propsData) {
      return propsData;
    }
    switch (activeTable) {
      case 'projects':
        return (dataContext?.projects ?? []) as unknown as T[];
      case 'tasks':
        return (dataContext?.tasks ?? []) as unknown as T[];
      case 'time_logs':
        return (dataContext?.logs ?? []) as unknown as T[];
      case 'holidays_leaves':
        return (dataContext?.holidays ?? []) as unknown as T[];
      case 'patch_logs':
        return (dataContext?.patches ?? []) as unknown as T[];
      default:
        return [] as T[];
    }
  }, [propsData, activeTable, dataContext]);

  const onSelectTable = (tblId: string) => {
    setSearchQuery('');
    setCurrentPage(1);
    setEditingCell(null);
    if (propsOnSelectTable) {
      propsOnSelectTable(tblId);
    } else {
      setInternalActiveTable(tblId);
    }
  };

  const onCellEdit = async (rowId: string, column: string, newValue: string) => {
    if (propsOnCellEdit) {
      await propsOnCellEdit(rowId, column, newValue);
      return;
    }

    if (activeTable === 'projects') {
      const target = dataContext?.projects.find((p) => p.id === rowId);
      if (target && dataContext?.handleUpdateProject) {
        const nextName = column === 'name' ? newValue : target.name;
        const nextColor = column === 'color' ? newValue : target.color;
        await dataContext.handleUpdateProject(rowId, nextName, nextColor);
      }
    } else if (activeTable === 'tasks') {
      const target = dataContext?.tasks.find((t) => t.id === rowId);
      if (target && dataContext?.handleUpdateTask) {
        await dataContext.handleUpdateTask(rowId, {
          name: column === 'name' ? newValue : target.name,
          completed: column === 'completed' ? newValue === 'true' : target.completed,
        });
      }
    } else if (activeTable === 'time_logs') {
      const target = dataContext?.logs.find((l) => l.id === rowId);
      if (target && dataContext?.handleEditTimeLog) {
        const nextStart = column === 'startTime' ? newValue : target.startTime;
        const nextEnd = resolveNullableText(target.endTime, column, 'endTime', newValue);
        const nextNote = resolveNullableText(target.note, column, 'note', newValue);
        await dataContext.handleEditTimeLog(
          rowId,
          target.taskId,
          nextStart,
          nextEnd,
          nextNote,
          'Inline edit via Data Table Viewer'
        );
      }
    }
  };

  const columns = useMemo<string[]>(() => {
    if (customColumns && customColumns.length > 0) {
      return customColumns;
    }
    if (data.length > 0) {
      return Object.keys(data[0]);
    }
    return ['id'];
  }, [customColumns, data]);

  const filteredRows = useMemo(() => {
    if (!internalSearchQuery.trim()) {
      return data;
    }
    const query = internalSearchQuery.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      })
    );
  }, [data, internalSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = (effectivePage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const resolveRowId = (item: T, index: number): string => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    if ('id' in item && item.id != null) {
      return String(item.id);
    }
    return `row-${index}`;
  };

  const contextValue: DataTableViewerContextValue<T> = {
    data,
    columns,
    filteredRows,
    paginatedRows,
    searchQuery: internalSearchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    effectivePage,
    startIndex,
    tables,
    activeTable,
    onSelectTable,
    onCellEdit,
    editingCell,
    setEditingCell,
    detailRow,
    setDetailRow,
    resolveRowId,
    formatCellValue,
    title,
    description,
    searchPlaceholder,
    searchable,
    className,
  };

  return (
    <DataTableViewerContext.Provider value={contextValue as unknown as DataTableViewerContextValue}>
      <div
        data-testid="data-table-viewer"
        className={cn(
          'p-4 sm:p-6 rounded-2xl border border-border bg-card text-card-foreground shadow-xs flex flex-col gap-4',
          className
        )}
      >
        {children ? (
          children
        ) : (
          <>
            <DataTableViewerHeader />
            <DataTableViewerToolbar>
              <DataTableViewerTableSelector />
              <DataTableViewerSearch />
            </DataTableViewerToolbar>
            <DataTableViewerTable />
            <DataTableViewerPagination />
            <DataTableViewerDetailModal />
          </>
        )}
      </div>
    </DataTableViewerContext.Provider>
  );
}

// Composite pattern attachment
DataTableViewer.Header = DataTableViewerHeader;
DataTableViewer.Toolbar = DataTableViewerToolbar;
DataTableViewer.TableSelector = DataTableViewerTableSelector;
DataTableViewer.Search = DataTableViewerSearch;
DataTableViewer.Table = DataTableViewerTable;
DataTableViewer.Row = DataTableViewerRow;
DataTableViewer.Cell = DataTableViewerCell;
DataTableViewer.Pagination = DataTableViewerPagination;
DataTableViewer.DetailModal = DataTableViewerDetailModal;

export default DataTableViewer;
