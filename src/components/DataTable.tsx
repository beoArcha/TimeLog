import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@components/ui/table';
import { ScrollArea } from '@components/ui/scroll-area';
import { EmptyState } from './EmptyState';
import { Text } from '@components/ui/typography';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string | number;
  renderRow?: (item: T, index: number) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  maxHeight?: string | number;
  totalCount?: number;
  totalLabel?: string;
  tableAriaLabel?: string;
  footerContent?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

/**
 * Data table with column mapping, empty state fallback, and scrollable container.
 */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  renderRow,
  emptyTitle,
  emptyDescription,
  maxHeight = '500px',
  totalCount,
  totalLabel,
  tableAriaLabel,
  footerContent,
  className,
  containerClassName,
}: DataTableProps<T>) {
  const { locale, customTranslations } = useSafeLocale();
  const count = totalCount ?? data.length;

  const resolvedEmptyTitle = emptyTitle || translate(locale, 'common', 'NoData', customTranslations);
  const resolvedTotalLabel = totalLabel || translate(locale, 'common', 'Total', customTranslations);
  const resolvedTableAriaLabel = tableAriaLabel || resolvedTotalLabel;

  return (
    <div
      role="region"
      aria-label={resolvedTableAriaLabel}
      data-slot="data-table"
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden flex flex-col',
        containerClassName
      )}
    >
      <ScrollArea style={{ maxHeight }} className="w-full">
        <Table aria-rowcount={data.length} aria-colcount={columns.length} className={cn('w-full', className)}>
          <TableHeader>
            <TableRow>
              {columns.map((col, colIdx) => (
                <TableHead
                  key={col.key}
                  scope="col"
                  aria-colindex={colIdx + 1}
                  className={cn(
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <EmptyState title={resolvedEmptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => {
                const key = keyExtractor ? keyExtractor(item, index) : index;
                if (renderRow) {
                  return (
                    <React.Fragment key={key}>
                      {renderRow(item, index)}
                    </React.Fragment>
                  );
                }
                return (
                  <TableRow key={key} aria-rowindex={index + 1}>
                    {columns.map((col, colIdx) => (
                      <TableCell
                        key={col.key}
                        aria-colindex={colIdx + 1}
                        className={cn(
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(item, index)
                          : (item as Record<string, unknown>)[col.key] != null
                          ? String((item as Record<string, unknown>)[col.key])
                          : null}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <Text variant="caption">
          {resolvedTotalLabel}: <span className="font-semibold text-foreground">{count}</span>
        </Text>
        {footerContent && <div>{footerContent}</div>}
      </div>
    </div>
  );
}

export default DataTable;
