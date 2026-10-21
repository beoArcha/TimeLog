import { CliEngineContext, TerminalLine } from '../types';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { translate } from '@common/i18n/translator';
import { getNextId } from '@common/utils/idGenerator';
import { TerminalOutput } from '../utils/terminalOutput';

export const runHolidaysCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { holidays, setHolidays, locale, customTranslations } = context;
  const subAction = args[0] ? args[0].toLowerCase() : '';

  if (subAction === 'add') {
    const type = args[1]?.toLowerCase();
    const date = args[2];
    const name = args[3];
    if (!type || !date || !name || (type !== 'holiday' && type !== 'leave')) {
      terminalOut.error('Error: Usage: holidays add <holiday|leave> <YYYY-MM-DD> "<name>".');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      terminalOut.error(translate(locale, 'cli', 'ErrInvalidDateFormat', customTranslations));
      return;
    }

    const newHoliday: HolidayLeave = {
      id: getNextId(holidays, 'hol_'),
      date,
      type: type as 'holiday' | 'leave',
      name,
    };
    setHolidays(prev => [...prev, newHoliday]);
    terminalOut.success(`Success: Saved ${type === 'holiday' ? 'holiday' : 'leave'} "${name}" [${date}] in SQLite table.`);
  } else {
    if (holidays.length === 0) {
      terminalOut.info(translate(locale, 'cli', 'NoHolidays', customTranslations));
    } else {
      terminalOut.info('┌──────┬────────────┬─────────────┬────────────────────────────────┐');
      terminalOut.info(translate(locale, 'cli', 'HolidaysHeader', customTranslations));
      terminalOut.info('├──────┼────────────┼─────────────┼────────────────────────────────┤');
      holidays.forEach(h => {
        const typeStr = h.type === 'holiday' ? 'HOLIDAY' : 'LEAVE';
        const idCol = h.id.replace('hol_', '').slice(-4).padEnd(4);
        const dateCol = h.date.padEnd(10);
        const typeCol = typeStr.padEnd(11);
        const nameCol = h.name.slice(0, 30).padEnd(30);
        terminalOut.output(`│ ${idCol} │ ${dateCol} │ ${typeCol} │ ${nameCol} │`);
      });
      terminalOut.info('└──────┴────────────┴─────────────┴────────────────────────────────┘');
    }
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};
