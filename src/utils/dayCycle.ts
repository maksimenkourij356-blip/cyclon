import { Apartment, CleaningTask } from '../types';

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
  targetDateStr: string = getLocalTodayDateString()
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

  // 2. Collect uncompleted NON-RITUAL planned tasks scheduled for the day(s) being left behind -> to DEBTS
  const uncompletedPlanned = apt.tasks.filter((t) => {
    if (t.category === 'ritual') return false; // Daily rituals do NOT accumulate in debts!
    if (!t.dayOfCycle) return false;
    if (t.status === 'completed') return false;

    // Moving forward in cycle (e.g. Day 1 -> Day 2 or Day 1 -> Day 3)
    if (targetDay > oldDay) {
      return t.dayOfCycle >= oldDay && t.dayOfCycle < targetDay;
    }
    // Any other shift, collect tasks of current day
    return t.dayOfCycle === oldDay;
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

  // 3. Reset all daily rituals for the new day
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
 * Checks if the calendar date has advanced past apt.lastActiveCalendarDate.
 * If a new day or multiple days have passed, automatically calculates the next cycleDay,
 * moves yesterday's uncompleted tasks to debts, and refreshes daily rituals.
 */
export function checkApartmentDayAutoAdvance(apt: Apartment): AutoAdvanceCheckResult {
  const todayStr = getLocalTodayDateString();

  // If apartment has no calendar date saved yet, initialize it with today's date
  if (!apt.lastActiveCalendarDate) {
    return {
      updatedApt: { ...apt, lastActiveCalendarDate: todayStr },
      shouldUpdate: true,
      advanced: false,
      daysAdvanced: 0,
      movedCount: 0,
      missedRitualMessages: [],
    };
  }

  // Already checked for today
  if (apt.lastActiveCalendarDate === todayStr) {
    return {
      updatedApt: apt,
      shouldUpdate: false,
      advanced: false,
      daysAdvanced: 0,
      movedCount: 0,
      missedRitualMessages: [],
    };
  }

  // Calendar day has advanced!
  if (apt.lastActiveCalendarDate < todayStr) {
    const d1 = new Date(apt.lastActiveCalendarDate + 'T00:00:00');
    const d2 = new Date(todayStr + 'T00:00:00');
    const diffMs = d2.getTime() - d1.getTime();
    const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    // 28-day cyclic modulo
    const targetCycleDay = ((apt.cycleDay - 1 + diffDays) % 28) + 1;

    const { updatedApt, movedCount, missedRitualMessages } = advanceApartmentDay(
      apt,
      targetCycleDay,
      todayStr
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

  // Future date (e.g. system clock was rolled back), just sync date
  return {
    updatedApt: { ...apt, lastActiveCalendarDate: todayStr },
    shouldUpdate: true,
    advanced: false,
    daysAdvanced: 0,
    movedCount: 0,
    missedRitualMessages: [],
  };
}
