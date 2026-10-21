import React, { useMemo } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { PieChart as PieChartIcon, X } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@components/ui/chart';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Text } from '@components/ui/typography';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { PROJECT_COLORS } from '@/src/layouts/parts/LayoutStyles';
import { ProjectChartItem } from '../types';

export interface ProjectDonutChartProps {
  projectChart: ProjectChartItem[];
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string | null) => void;
  defaultExpanded?: boolean;
}

export default function ProjectDonutChart({
  projectChart,
  selectedProjectId,
  onSelectProject,
  defaultExpanded = true,
}: ProjectDonutChartProps) {
  const { t } = useTranslation('report');

  const { totalSeconds, data, chartConfig, selectedProjectName } = useMemo(() => {
    let total = 0;
    for (const p of projectChart) {
      total += p.seconds;
    }

    const config: ChartConfig = {};
    const chartData = projectChart
      .filter((p) => p.seconds > 0)
      .map((p) => {
        const matched = PROJECT_COLORS.find((c) => c.name === p.color);
        const hex = matched ? matched.hex : '#8b5cf6';
        config[p.id] = {
          label: p.name,
          color: hex,
        };

        return {
          id: p.id,
          name: p.name,
          seconds: p.seconds,
          fill: `var(--color-${p.id})`,
          percentage: total > 0 ? (p.seconds / total) * 100 : 0,
        };
      });

    const activeSelected = projectChart.find((p) => p.id === selectedProjectId);

    return {
      totalSeconds: total,
      data: chartData,
      chartConfig: config,
      selectedProjectName: activeSelected?.name ?? null,
    };
  }, [projectChart, selectedProjectId]);

  const hasData = data.length > 0 && totalSeconds > 0;

  return (
    <CollapsibleCard
      title={t('ProjectShare')}
      icon={PieChartIcon}
      iconColor="text-orange-400"
      defaultExpanded={defaultExpanded}
      headerTestId="project-donut-chart-header"
      contentClassName="mt-2"
      headerRight={
        selectedProjectId && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" size="sm" className="font-sans">
              {selectedProjectName}
            </Badge>
            <Button
              variant="ghost"
              size="xs"
              data-testid="clear-project-filter"
              onClick={() => onSelectProject?.(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              {t('ClearFilter')}
            </Button>
          </div>
        )
      }
    >
      {!hasData ? (
        <div className="py-8 text-center" data-testid="donut-chart-empty">
          <Text variant="muted">{t('NoDataSelectedRange')}</Text>
        </div>
      ) : (
        <div data-testid="project-donut-chart" className="w-full flex flex-col items-center">
          <ChartContainer config={chartConfig} className="h-72 w-full max-w-md">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val, name, item) => (
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="text-muted-foreground">{name}:</span>
                        <span className="font-mono font-medium text-foreground">
                          {formatSeconds(Number(val))} ({item.payload?.percentage?.toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="seconds"
                nameKey="name"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                onClick={(data: unknown) => {
                  const entry = data as { id?: string; payload?: { id?: string } } | undefined;
                  const id = entry?.payload?.id ?? entry?.id;
                  if (id && onSelectProject) {
                    onSelectProject(selectedProjectId === id ? null : id);
                  }
                }}
              >
                {data.map((entry) => {
                  const isSelected = selectedProjectId === entry.id;
                  return (
                    <Cell
                      key={entry.id}
                      fill={entry.fill}
                      stroke={isSelected ? 'var(--color-ring, currentColor)' : 'transparent'}
                      strokeWidth={isSelected ? 3 : 0}
                      className="transition-all hover:opacity-80"
                    />
                  );
                })}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </div>
      )}
    </CollapsibleCard>
  );
}
