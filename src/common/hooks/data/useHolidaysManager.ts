import { useState, type SetStateAction } from 'react';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { HolidayType } from '@bindings/HolidayType';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler, RepositoryException } from '@common/exceptions';

export interface UseHolidaysManagerOptions {
  onError?: (error: string | null) => void;
}

export const useHolidaysManager = (options?: UseHolidaysManagerOptions) => {
  const [holidays, setHolidaysState] = useState<HolidayLeave[]>([]);

  const setHolidays = async (action: SetStateAction<HolidayLeave[]>) => {
    try {
      options?.onError?.(null);
      const resolved = typeof action === 'function' ? action(holidays) : action;
      await PersistenceRouter.getInstance().holidays.save(resolved);
      setHolidaysState(resolved);
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to set holidays', err, 'ERR_REPOSITORY'));
      options?.onError?.(err instanceof Error ? err.message : 'Failed to set holidays');
    }
  };

  const handleAddHoliday = async (date: string, type: HolidayType, name: string) => {
    const nextHolidays = [...holidays, {
      id: crypto.randomUUID(),
      date,
      type,
      name
    }];
    await setHolidays(nextHolidays);
  };

  const handleDeleteHoliday = async (id: string) => {
    const nextHolidays = holidays.filter(x => x.id !== id);
    await setHolidays(nextHolidays);
  };

  return {
    holidays,
    setHolidaysState,
    setHolidays,
    handleAddHoliday,
    handleDeleteHoliday,
  };
};
