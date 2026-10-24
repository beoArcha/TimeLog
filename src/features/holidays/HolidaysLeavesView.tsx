import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import CollapsibleCard from '@components/CollapsibleCard';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Overline } from '@components/ui/typography';
import { ViewHeader } from '@components/ViewHeader';
import { Input } from '@components/ui/input';
import { NativeSelect } from '@components/ui/select';
import { Area } from '@components/ui/area';
import { Form } from '@components/ui/form';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { HolidayType } from '@bindings/HolidayType';
import HolidaysLeavesTable from '@features/db-explorer/components/HolidaysLeavesTable';

export default function HolidaysLeavesView() {
  const { locale, customTranslations } = useLocale();
  const { handleAddHoliday } = useData();

  const [newHolidayDate, setNewHolidayDate] = useState('2026-06-15');
  const [newHolidayType, setNewHolidayType] = useState<HolidayType>('leave');
  const [newHolidayName, setNewHolidayName] = useState('');

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName) return;
    handleAddHoliday(newHolidayDate, newHolidayType, newHolidayName);
    setNewHolidayName('');
  };

  return (
    <Area as="main" variant="card" padding="main" radius="3xl" elevation="xs" className="flex flex-col gap-6 transition-all duration-300">
      <ViewHeader
        badge={
          <Badge variant="orange" size="sm" className="font-mono tracking-wider uppercase">
            {translate(locale, 'calendar', 'ResourceDatabaseTable', customTranslations)}
          </Badge>
        }
        title={translate(locale, 'calendar', 'HolidaysVacations', customTranslations)}
        icon={Calendar}
        iconColor="text-primary"
      />

      <CollapsibleCard
        title={translate(locale, 'calendar', 'RegisterNewDayOff', customTranslations)}
        icon={Plus}
        iconColor="text-primary"
        defaultExpanded={true}
        wrapperClassName="p-6 rounded-3xl border border-border bg-muted/30"
        headerClassName="text-xs font-bold font-mono tracking-wide text-foreground"
      >
        <Form onSubmit={handleAddHolidaySubmit} layout="vertical" gap="lg" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Overline>{translate(locale, 'common', 'Date', customTranslations)}</Overline>
              <Input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} required className="w-full font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Overline>{translate(locale, 'common', 'Type', customTranslations)}</Overline>
              <NativeSelect value={newHolidayType} onChange={e => setNewHolidayType(e.target.value as 'holiday' | 'leave')} className="w-full font-mono">
                <option value="leave">{translate(locale, 'calendar', 'VacationLeave', customTranslations)}</option>
                <option value="holiday">{translate(locale, 'calendar', 'OfficialHoliday', customTranslations)}</option>
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Overline>{translate(locale, 'calendar', 'DescriptionCause', customTranslations)}</Overline>
              <Input type="text" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} placeholder={translate(locale, 'calendar', 'EGVibeDancingLeave', customTranslations)} required className="w-full font-sans" />
            </div>
          </div>
          <Button
            type="submit"
            variant="accent"
            size="sm"
            className="mt-4 gap-2 w-full md:w-auto"
          >
            <Plus className="w-4 h-4" /> {translate(locale, 'common', 'Save', customTranslations)}
          </Button>
        </Form>
      </CollapsibleCard>

      <HolidaysLeavesTable
        requireConfirm={false}
        hideAddButton={true}
        wrapperClassName="rounded-3xl border border-border bg-card overflow-hidden shadow-xs"
      />
    </Area>
  );
}
