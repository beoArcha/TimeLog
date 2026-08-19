import { CliEngineContext, TerminalLine } from '../utils/Commands';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { translate } from '@common/i18n/translator';
import { getNextId } from '@common/utils/idGenerator';

export const runHolidaysCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { holidays, setHolidays, locale, customTranslations } = context;
  const subAction = args[0] ? args[0].toLowerCase() : '';
  if (subAction === 'add') {
    const type = args[1]?.toLowerCase();
    const date = args[2];
    const name = args[3];
    if (!type || !date || !name || (type !== 'holiday' && type !== 'leave')) {
      outputs.push({
        text: 'Error: Usage: holidays add <holiday|leave> <YYYY-MM-DD> "<name>".',
        type: 'error'
      });
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        outputs.push({ text: translate(locale, 'cli', 'ErrInvalidDateFormat', customTranslations), type: 'error' });
      } else {
        const newHoliday: HolidayLeave = {
          id: getNextId(holidays, 'hol_'),
          date,
          type: type as 'holiday' | 'leave',
          name,
        };
        setHolidays(prev => [...prev, newHoliday]);
        outputs.push({
          text: `Success: Saved ${type === 'holiday' ? 'holiday' : 'leave'} "${name}" [${date}] in SQLite table.`,
          type: 'success'
        });
      }
    }
  } else {
    if (holidays.length === 0) {
      outputs.push({ text: translate(locale, 'cli', 'NoHolidays', customTranslations), type: 'info' });
    } else {
      outputs.push({ text: '┌──────┬────────────┬─────────────┬────────────────────────────────┐', type: 'info' });
      outputs.push({ text: translate(locale, 'cli', 'HolidaysHeader', customTranslations), type: 'info' });
      outputs.push({ text: '├──────┼────────────┼─────────────┼────────────────────────────────┤', type: 'info' });
      holidays.forEach(h => {
        const typeStr = h.type === 'holiday' ? 'HOLIDAY' : 'LEAVE';
        const idCol = h.id.replace('hol_', '').slice(-4).padEnd(4);
        const dateCol = h.date.padEnd(10);
        const typeCol = typeStr.padEnd(11);
        const nameCol = h.name.slice(0, 30).padEnd(30);
        outputs.push({ text: `│ ${idCol} │ ${dateCol} │ ${typeCol} │ ${nameCol} │`, type: 'output' });
      });
      outputs.push({ text: '└──────┴────────────┴─────────────┴────────────────────────────────┘', type: 'info' });
    }
  }
};
