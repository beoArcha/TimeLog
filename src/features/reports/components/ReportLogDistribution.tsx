import React from 'react';
import { ProgressBar } from '@components/ui/progress';
import { Heading, Caption } from '@components/ui/typography';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { resolveProjectColor } from '@common/utils/colorUtils';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectChartItem } from '../types';

export interface ReportLogDistributionProps {
  projectChart: ProjectChartItem[];
  maxSec: number;
}

export function ReportLogDistribution({
  projectChart,
  maxSec,
}: ReportLogDistributionProps) {
  const { t } = useTranslation('report');

  return (
    <div className="flex flex-col gap-3">
      <Heading
        level={4}
        className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5"
      >
        <BarChart3 className="size-3.5 text-orange-500 shrink-0" aria-hidden="true" />
        {t('GraphicalDistribution')}
      </Heading>
      <div className="flex flex-col gap-4">
        {projectChart.map((pc) => {
          const widthPct = Math.min(100, Math.max(5, (pc.seconds / maxSec) * 100));
          const resolvedColor = resolveProjectColor(pc.color);
          return (
            <div key={pc.id} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn('w-2.5 h-2.5 rounded-full shrink-0', resolvedColor.bgClass)}
                    style={resolvedColor.bgStyle}
                    aria-hidden="true"
                  />
                  {pc.name}
                </span>
                <span className="font-mono text-orange-500">{formatSeconds(pc.seconds)}</span>
              </div>
              <ProgressBar value={widthPct} variant="orange" aria-label={pc.name} />
              {pc.tasks.length > 0 && (
                <div className="flex flex-col gap-1 mt-1 pl-4 border-l-2 border-border/50">
                  {pc.tasks.map((tt, index) => {
                    const taskKey = `${pc.id}-${tt.task?.id || 'unknown'}-${index}`;
                    return (
                      <Caption key={taskKey} className="flex justify-between items-center">
                        <span className="truncate">{tt.task?.name || 'N/A'}</span>
                        <span className="font-mono">{formatSeconds(tt.seconds)}</span>
                      </Caption>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ReportLogDistribution;
