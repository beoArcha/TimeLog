import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';
import { useChart } from './ChartContext';

export const ChartLegend = RechartsPrimitive.Legend;

export interface LegendPayloadItem {
  value?: string | number;
  dataKey?: string | number;
  color?: string;
  [key: string]: unknown;
}

export interface ChartLegendContentProps extends React.ComponentProps<'div'> {
  payload?: LegendPayloadItem[];
  verticalAlign?: 'top' | 'bottom' | 'middle';
  nameKey?: string;
  hideIcon?: boolean;
}

export const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey }, ref) => {
    const { config } = useChart();

    if (!payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        data-slot="chart-legend"
        className={cn(
          'flex items-center justify-center gap-4 text-xs',
          verticalAlign === 'top' ? 'pb-3' : 'pt-3',
          className
        )}
      >
        {payload.map((item: LegendPayloadItem) => {
          const key = `${nameKey || item.dataKey || 'value'}`;
          const itemConfig = config[key];

          return (
            <div
              key={item.value}
              className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            >
              {!hideIcon && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: item.color || itemConfig?.color,
                  }}
                />
              )}
              <span className="text-muted-foreground font-medium">
                {itemConfig?.label || item.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
);
ChartLegendContent.displayName = 'ChartLegendContent';

export default ChartLegend;
