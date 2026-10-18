import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';
import { useChart } from './ChartContext';

export const ChartTooltip = RechartsPrimitive.Tooltip;

export interface TooltipPayloadItem {
  name?: string | number;
  value?: string | number;
  dataKey?: string | number;
  color?: string;
  payload?: Record<string, unknown> & { fill?: string };
  [key: string]: unknown;
}

export interface ChartTooltipContentProps extends React.ComponentProps<'div'> {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  labelFormatter?: (label: React.ReactNode, payload: TooltipPayloadItem[]) => React.ReactNode;
  formatter?: (
    value: unknown,
    name: unknown,
    item: TooltipPayloadItem,
    index: number,
    payload: unknown
  ) => React.ReactNode;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: 'line' | 'dot' | 'dashed';
  nameKey?: string;
  labelKey?: string;
}

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      formatter,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || 'value'}`;
      const itemConfig = config[key];
      const value =
        !labelKey && typeof label === 'string'
          ? config[label]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className="font-medium text-foreground">{labelFormatter(value, payload)}</div>
        );
      }

      if (!value) {
        return null;
      }

      return <div className="font-medium text-foreground">{value}</div>;
    }, [label, labelFormatter, payload, hideLabel, labelKey, config]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== 'dot';

    return (
      <div
        ref={ref}
        data-slot="chart-tooltip"
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-2xl border border-border bg-card/95 p-3 text-xs shadow-xl backdrop-blur-md transition-all',
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item: TooltipPayloadItem, index: number) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`;
            const itemConfig = config[key];
            const indicatorColor =
              item.color || (item.payload?.fill as string | undefined) || itemConfig?.color;

            return (
              <div
                key={item.dataKey || index}
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                  indicator === 'dot' && 'items-center'
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {!hideIndicator && (
                      <span
                        className={cn(
                          'shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]',
                          indicator === 'dot' && 'h-2 w-2 rounded-full',
                          indicator === 'line' && 'w-1 h-3',
                          indicator === 'dashed' && 'w-0 border-[1.5px] border-dashed bg-transparent'
                        )}
                        style={
                          {
                            '--color-bg': indicatorColor,
                            '--color-border': indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )}
                    <div className="flex flex-1 justify-between leading-none items-center gap-2">
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                      {item.value !== undefined && (
                        <span className="font-mono font-medium text-foreground">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

export default ChartTooltip;
