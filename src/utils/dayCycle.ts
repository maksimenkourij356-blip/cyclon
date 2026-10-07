import { Apartment, CleaningTask } from '../types';

export const WEEKDAY_NAMES_RU = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

export const WEEKDAY_SHORT_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/**
 * Returns today's date in local YYYY-MM-DD format,
 * respecting the user's actual local midnight.
 */
export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD strings using UTC,
 * avoiding daylight saving time (DST) shifts and locale parsing bugs.
 */
export function getCalendarDayDiff(fromDateStr: string, toDateStr: string): number {
  if (!fromDateStr || !toDateStr) return 0;
  const p1 = fromDateStr.split('-').map(Number);
  const p2 = toDateStr.split('-').map(Number);
  if (p1.length < 3 || p2.length < 3 || isNaN(p1[0]) || isNaN(p2[0])) return 0;
  const utc1 = Date.UTC(p1[0], p1[1] - 1, p1[2]);
  const utc2 = Date.UTC(p2[0], p2[1] - 1, p2[2]);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Returns the ISO day of week for today:
 * 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
 */
export function getCurrentRealDayOfWeek(): number {
  const jsDay = new Date().getDay(); // 0 is Sunday, 1 is Monday ...
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Returns the Russian name of the weekday for a cycle day (1 to 28).
 * In 28-day cycle:
 * Days 1, 8, 15, 22 -> Понедельник
 * Days 2, 9, 16, 23 -> Вторник
 * ...
 * Days 7, 14, 21, 28 -> Воскресенье
 */
export function getWeekdayNameForCycleDay(cycleDay: number): string {
  const idx = ((cycleDay - 1) % 7 + 7) % 7;
  return WEEKDAY_NAMES_RU[idx];
}

/**
 * Returns short abbreviation (Пн, Вт, etc.) for a cycle day.
 */
export function getWeekdayShortForCycleDay(cycleDay: number): string {
  const idx = ((cycleDay - 1) % 7 + 7) % 7;
  return WEEKDAY_SHORT_RU[idx];
}

/**
 * Aligns a cycle day to the current real calendar day of the week,
 * preserving the apartment's current week (1..4).
 * Example: if an apartment was on week 2 and today is Tuesday, it becomes Day 9.
 */
export function alignCycleDayToRealWeekday(currentCycleDay: number): number {
  const weekIdx = Math.floor((currentCycleDay - 1) / 7); // 0, 1, 2, 3
  const realIsoWeekday = getCurrentRealDayOfWeek(); // 1..7 (2 for Tuesday)
  return Math.min(28, Math.max(1, weekIdx * 7 + realIsoWeekday));
}

export interface DayAdvanceResult {
  updatedApt: Apartment;
  movedCount: number;
  missedRitualMessages: string[];
}

/**
 * Moves uncompleted planned tasks of days left behind into debts,
 * refreshes daily rituals to available, and updates cycleDay.
 */
export function advanceApartmentDay(
  apt: Apartment,
  targetDay: number,
  targetDateStr: string = getLocalTodayDateString(),
  diffDays: number = 1
): DayAdvanceResult {
  const oldDay = apt.cycleDay;
  const missedRitualMessages: string[] = [];

  // 1. Identify uncompleted daily rituals from the past day
  const yesterdayRituals = apt.tasks.filter((t) => t.category === 'ritual');
  const uncompletedRituals = yesterdayRituals.filter((t) => t.status !== 'completed');

  uncompletedRituals.forEach((r) => {
    const id = r.id.toLowerCase();
    const title = r.title.toLowerCase();
    if (id.includes('kitchen') || id.includes('dishes') || title.includes('посуд') || title.includes('кухн')) {
      missedRitualMessages.push('Эх, вчера посуда осталась немытой 🧽');
    } else if (id.includes('cat') || title.includes('кошк') || title.includes('кот')) {
      missedRitualMessages.push('Эх, вчера у кошки остался грязный туалет 🐱');
    } else if (id.includes('dog') || title.includes('собак')) {
      missedRitualMessages.push('Эх, вчера лапомойка и миски собаки остались без внимания 🐕');
    } else if (id.includes('trash') || title.includes('мусор')) {
      missedRitualMessages.push('Эх, вчера мусор остался стоять дома 🗑️');
    } else {
      missedRitualMessages.push(`Эх, вчера ежедневная рутина «${r.title}» осталась невыполненной 🧹`);
    }
  });

  // 2. Identify all cycle days that were left behind
  const daysLeftBehind = new Set<number>();
  const countDays = Math.max(1, Math.min(diffDays, 28));
  for (let i = 0; i < countDays; i++) {
    const d = ((oldDay - 1 + i) % 28) + 1;
    if (d !== targetDay || countDays >= 28) {
      daysLeftBehind.add(d);
    }
  }

  // 3. Collect uncompleted NON-RITUAL planned tasks scheduled for the day(s) being left behind -> to DEBTS
  const uncompletedPlanned = apt.tasks.filter((t) => {
    if (t.category === 'ritual') return false; // Daily rituals do NOT accumulate in debts!
    if (!t.dayOfCycle) return false;
    if (t.status === 'completed') return false;
    return daysLeftBehind.has(t.dayOfCycle);
  });

  // Prepare new debts, avoiding duplicates
  const existingDebtIds = new Set(apt.debts.map((d) => d.id));
  const originalDebtTaskIds = new Set(apt.debts.map((d) => d.id.replace(/^debt-/, '')));

  const newDebtsToAdd: CleaningTask[] = [];
  uncompletedPlanned.forEach((t) => {
    const debtId = t.id.startsWith('debt-') ? t.id : `debt-${t.id}`;
    if (!existingDebtIds.has(debtId) && !originalDebtTaskIds.has(t.id)) {
      newDebtsToAdd.push({
        ...t,
        id: debtId,
        description: `${t.description} (с Дня ${t.dayOfCycle})`,
        status: 'available',
        takenBy: undefined,
      });
    }
  });

  // Remove moved tasks from active tasks
  const movedTaskIds = new Set(uncompletedPlanned.map((t) => t.id));
  const remainingTasks = apt.tasks.filter((t) => !movedTaskIds.has(t.id));

  // 4. Reset all daily rituals for the new day
  const refreshedTasks = remainingTasks.map((t) => {
    if (t.category === 'ritual') {
      return {
        ...t,
        status: 'available' as const,
        takenBy: undefined,
        completedBy: undefined,
        completedAt: undefined,
        pointsSnapshot: undefined,
      };
    }
    return t;
  });

  const updatedApt: Apartment = {
    ...apt,
    cycleDay: targetDay,
    lastActiveCalendarDate: targetDateStr,
    tasks: refreshedTasks,
    debts: [...newDebtsToAdd, ...apt.debts],
  };

  return {
    updatedApt,
    movedCount: newDebtsToAdd.length,
    missedRitualMessages,
  };
}

export interface AutoAdvanceCheckResult {
  updatedApt: Apartment;
  shouldUpdate: boolean;
  advanced: boolean;
  daysAdvanced: number;
  movedCount: number;
  missedRitualMessages: string[];
}

/**
 * Checks if the calendar date has advanced across midnight or if cycleDay needs synchronization.
 * Automatically aligns and calculates the next cycleDay,
 * moves yesterday's uncompleted tasks to debts without penalties, and refreshes daily rituals.
 */
export function checkApartmentDayAutoAdvance(apt: Apartment): AutoAdvanceCheckResult {
  const todayStr = getLocalTodayDateString();
  const realIsoWeekday = getCurrentRealDayOfWeek();
  const currentCycleWeekday = ((apt.cycleDay - 1) % 7) + 1;

  // 1. If apartment has lastActiveCalendarDate, check calendar difference
  if (apt.lastActiveCalendarDate) {
    const diffDays = getCalendarDayDiff(apt.lastActiveCalendarDate, todayStr);

    if (diffDays > 0) {
      // Midnight has passed by diffDays! Advance cycle sequentially
      const targetCycleDay = ((apt.cycleDay - 1 + diffDays) % 28) + 1;
      const { updatedApt, movedCount, missedRitualMessages } = advanceApartmentDay(
        apt,
        targetCycleDay,
        todayStr,
        diffDays
      );

      return {
        updatedApt,
        shouldUpdate: true,
        advanced: true,
        daysAdvanced: diffDays,
        movedCount,
        missedRitualMessages,
      };
    }

    if (diffDays === 0) {
      // Same calendar day: verify cycle day matches real weekday
      if (currentCycleWeekday !== realIsoWeekday) {
        const alignedDay = alignCycleDayToRealWeekday(apt.cycleDay);
        return {
          updatedApt: { ...apt, cycleDay: alignedDay },
          shouldUpdate: true,
          advanced: false,
          daysAdvanced: 0,
          movedCount: 0,
          missedRitualMessages: [],
        };
      }

      return {
        updatedApt: apt,
        shouldUpdate: false,
        advanced: false,
        daysAdvanced: 0,
        movedCount: 0,
        missedRitualMessages: [],
      };
    }

    // Negative diffDays (clock rolled back or client timezone shift) -> update date stamp
    return {
      updatedApt: { ...apt, lastActiveCalendarDate: todayStr },
      shouldUpdate: true,
      advanced: false,
      daysAdvanced: 0,
      movedCount: 0,
      missedRitualMessages: [],
    };
  }

  // 2. If no lastActiveCalendarDate is recorded yet, check cycleStartDate
  if (apt.cycleStartDate) {
    const diffDaysFromStart = getCalendarDayDiff(apt.cycleStartDate, todayStr);
    if (diffDaysFromStart > 0) {
      const targetCycleDay = ((apt.cycleDay - 1 + diffDaysFromStart) % 28) + 1;
      const { updatedApt, movedCount, missedRitualMessages } = advanceApartmentDay(
        apt,
        targetCycleDay,
        todayStr,
        diffDaysFromStart
      );

      return {
        updatedApt,
        shouldUpdate: true,
        advanced: true,
        daysAdvanced: diffDaysFromStart,
        movedCount,
        missedRitualMessages,
      };
    }
  }

  // Fallback: align to current real weekday and record today's date
  const alignedDay = alignCycleDayToRealWeekday(apt.cycleDay);
  return {
    updatedApt: { ...apt, cycleDay: alignedDay, lastActiveCalendarDate: todayStr },
    shouldUpdate: true,
    advanced: false,
    daysAdvanced: 0,
    movedCount: 0,
    missedRitualMessages: [],
  };
}
