import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { BarChart3 } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@components/ui/chart';
import { Text } from '@components/ui/typography';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { PROJECT_COLORS } from '@/src/layouts/parts/LayoutStyles';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';

export interface StackedBarActivityChartProps {
  clampedLogs: ClampedTimeLog[];
  projects: Project[];
  tasks?: Task[];
  defaultExpanded?: boolean;
}

interface DailyProjectDataPoint {
  dateKey: string;
  displayDate: string;
  totalSeconds: number;
  [projectId: string]: number | string;
}

export default function StackedBarActivityChart({
  clampedLogs,
  projects,
  defaultExpanded = true,
}: StackedBarActivityChartProps) {
  const { t } = useTranslation('report');

  const { chartData, chartConfig, activeProjects } = useMemo(() => {
    const projectMap = new Map<string, Project>();
    for (const p of projects) {
      projectMap.set(p.id, p);
    }

    const dayMap = new Map<string, Record<string, number>>();
    const presentProjectIds = new Set<string>();

    for (const log of clampedLogs) {
      const dateStr = log.clampedStartTime.slice(0, 10);
      let dayTotals = dayMap.get(dateStr);
      if (!dayTotals) {
        dayTotals = {};
        dayMap.set(dateStr, dayTotals);
      }
      dayTotals[log.projectId] = (dayTotals[log.projectId] || 0) + log.clampedDurationSeconds;
      presentProjectIds.add(log.projectId);
    }

    const sortedDates = Array.from(dayMap.keys()).sort();

    const data: DailyProjectDataPoint[] = sortedDates.map((dateKey) => {
      const dayTotals = dayMap.get(dateKey) || {};
      let totalSeconds = 0;
      const point: DailyProjectDataPoint = {
        dateKey,
        displayDate: dateKey.slice(5), // MM-DD
        totalSeconds: 0,
      };

      for (const [pId, sec] of Object.entries(dayTotals)) {
        point[pId] = sec;
        totalSeconds += sec;
      }
      point.totalSeconds = totalSeconds;
      return point;
    });

    const activeList = projects.filter((p) => presentProjectIds.has(p.id));

    const config: ChartConfig = {};
    for (const p of projects) {
      const matched = PROJECT_COLORS.find((c) => c.name === p.color);
      config[p.id] = {
        label: p.name,
        color: matched ? matched.hex : '#8b5cf6',
      };
    }

    return {
      chartData: data,
      chartConfig: config,
      activeProjects: activeList,
    };
  }, [clampedLogs, projects]);

  const hasData = chartData.length > 0;

  return (
    <CollapsibleCard
      title={t('DailyActivity')}
      icon={BarChart3}
      iconColor="text-orange-400"
      defaultExpanded={defaultExpanded}
      headerTestId="stacked-activity-chart-header"
      contentClassName="mt-2"
    >
      {!hasData ? (
        <div className="py-8 text-center" data-testid="stacked-chart-empty">
          <Text variant="muted">{t('NoDataSelectedRange')}</Text>
        </div>
      ) : (
        <div data-testid="stacked-bar-activity-chart" className="w-full">
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-15" />
              <XAxis
                dataKey="displayDate"
                stroke="currentColor"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="currentColor"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(sec: number) => {
                  const hrs = Math.round(sec / 3600);
                  return hrs > 0 ? `${hrs}h` : `${Math.round(sec / 60)}m`;
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val, name) => (
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="text-muted-foreground">{name}:</span>
                        <span className="font-mono font-medium text-foreground">
                          {formatSeconds(Number(val))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {activeProjects.map((project) => (
                <Bar
                  key={project.id}
                  dataKey={project.id}
                  name={project.name}
                  stackId="activity"
                  fill={`var(--color-${project.id})`}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </CollapsibleCard>
  );
}
