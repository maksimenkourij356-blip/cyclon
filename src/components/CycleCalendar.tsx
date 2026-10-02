import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Info, 
  AlertTriangle,
  UtensilsCrossed,
  Bath,
  Cat,
  Shirt,
  Tv,
  Check,
  ListChecks
} from 'lucide-react';
import { CleaningTask } from '../types';

interface CycleCalendarProps {
  currentCycleDay: number;
  tasks: CleaningTask[];
  debts?: CleaningTask[];
  onGoToDebts?: () => void;
}

export const CycleCalendar: React.FC<CycleCalendarProps> = ({
  currentCycleDay,
  tasks,
  debts = [],
  onGoToDebts,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(currentCycleDay);

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // 28 days breakdown
  const cycleDays = Array.from({ length: 28 }, (_, i) => i + 1);

  const getDayMeta = (day: number) => {
    const dayOfWeekIdx = (day - 1) % 7;
    const isWeekend = dayOfWeekIdx >= 5;
    const weekNum = Math.floor((day - 1) / 7) + 1;

    // Standard pre-designed schedule per spec
    let tag = 'W';
    let timeEst = 10;
    let label = 'Санузел / Полы';

    if (dayOfWeekIdx === 0) {
      tag = 'W';
      label = 'Робот: щётки + полы';
      timeEst = 10;
    } else if (dayOfWeekIdx === 1) {
      tag = 'W';
      label = 'Кухня у плиты + фартук';
      timeEst = 10;
    } else if (dayOfWeekIdx === 2) {
      tag = 'W';
      label = 'Шерсть + лоток глубокий';
      timeEst = 12;
    } else if (dayOfWeekIdx === 3) {
      tag = 'W';
      label = 'Робот: контейнер + санузел';
      timeEst = 15;
    } else if (dayOfWeekIdx === 4) {
      tag = 'W';
      label = 'Полы вручную по углам';
      timeEst = 15;
    } else if (dayOfWeekIdx === 5) {
      // Saturday peak
      if (weekNum % 2 === 1) {
        tag = 'M';
        label = 'Духовка / Вытяжка / Мёртвые зоны';
        timeEst = 35;
      } else {
        tag = 'F';
        label = 'Фасады кухни + постельное';
        timeEst = 25;
      }
    } else {
      // Sunday
      if (weekNum === 2) {
        tag = 'M';
        label = 'Холодильник / Балкон';
        timeEst = 27;
      } else if (weekNum === 4) {
        tag = 'Q';
        label = 'Декальцинация кофемашины';
        timeEst = 20;
      } else {
        tag = 'F';
        label = 'Санузел глубокий + швы';
        timeEst = 20;
      }
    }

    return { tag, timeEst, label, isWeekend, weekNum };
  };

  const getZoneIcon = (zone: CleaningTask['zone']) => {
    switch (zone) {
      case 'kitchen':
        return <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />;
      case 'bathroom':
        return <Bath className="w-3.5 h-3.5 text-cyan-400" />;
      case 'pet':
        return <Cat className="w-3.5 h-3.5 text-pink-400" />;
      case 'laundry':
        return <Shirt className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Tv className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const getDisgustBadge = (factor: number) => {
    switch (factor) {
      case 1.0:
        return { label: 'K=1.0 «Норм»', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' };
      case 1.5:
        return { label: 'K=1.5 «Не очень»', bg: 'bg-yellow-950/60 text-yellow-300 border-yellow-500/30' };
      case 2.0:
        return { label: 'K=2.0 «Фу»', bg: 'bg-orange-950/60 text-orange-300 border-orange-500/30' };
      case 2.5:
        return { label: 'K=2.5 «Жесть»', bg: 'bg-rose-950/60 text-rose-300 border-rose-500/30' };
      default:
        return { label: `K=${factor}`, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const selectedDayMeta = getDayMeta(selectedDay);
  
  // All tasks designated for the selected day: planned tasks and tasks that were moved to debts
  const plannedTasksForDay = tasks.filter((t) => t.category !== 'ritual' && t.dayOfCycle === selectedDay);
  const debtsForDay = debts.filter((d) => d.dayOfCycle === selectedDay);
  const totalTasksCount = plannedTasksForDay.length + debtsForDay.length;

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-mono">
              28-ДНЕВНЫЙ ЦИКЛ
            </span>
            <span className="text-xs text-slate-400">4 недели по 7 дней · Нажмите на любой день для просмотра задач</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Календарь циклических задач
          </h2>
          <p className="text-xs text-slate-300">
            Каждый день недели закреплён за своей зоной: будни ≤ 15 мин/чел, выходные ≤ 30 мин/чел.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span> W (Еженедельно)
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/80 inline-block"></span> F (Раз в 2 нед.)
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span> M (Ежемесячно)
          </span>
        </div>
      </div>

      {/* Grid of 28 Days */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
          {daysOfWeek.map((day, idx) => (
            <div key={day} className={idx >= 5 ? 'text-cyan-400' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* Weeks & Days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cycleDays.map((day) => {
            const meta = getDayMeta(day);
            const isToday = day === currentCycleDay;
            const isSelected = day === selectedDay;
            const isPast = day < currentCycleDay;
            const dayDebts = debts.filter((d) => d.dayOfCycle === day);
            const hasDebts = dayDebts.length > 0;

            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[58px] sm:min-h-[72px] p-1 sm:p-2 rounded-lg sm:rounded-xl flex flex-col justify-between text-left transition-all border cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 border-cyan-400 bg-cyan-950/50 shadow-lg shadow-cyan-950/40'
                    : isToday
                    ? 'border-cyan-500/70 bg-slate-850 shadow-md shadow-cyan-950/50'
                    : isPast
                    ? 'border-slate-800/80 bg-slate-950/40 opacity-75'
                    : 'border-slate-800 bg-slate-950/80 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-mono text-[10px] sm:text-xs font-bold ${
                      isSelected
                        ? 'text-cyan-300 font-extrabold'
                        : isToday
                        ? 'text-cyan-300 underline underline-offset-4 decoration-cyan-400'
                        : isPast
                        ? 'text-slate-500'
                        : 'text-slate-300'
                    }`}
                  >
                    Д{day}
                  </span>

                  {isToday && (
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  )}
                  {isPast && (
                    hasDebts ? (
                      <span
                        className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[7px] sm:text-[8px] font-mono font-bold border border-amber-500/40"
                        title={`${dayDebts.length} задач(и) перенесены в долги`}
                      >
                        долг
                      </span>
                    ) : (
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500/80" />
                    )
                  )}
                </div>

                {/* Tag & Time */}
                <div className="mt-1 w-full overflow-hidden">
                  <span
                    className={`text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.2 rounded truncate block text-center ${
                      meta.tag === 'M'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                        : meta.tag === 'F'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40'
                        : meta.tag === 'Q'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {meta.tag} · {meta.timeEst}м
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-bold text-cyan-400 text-lg">
              День {selectedDay} из 28
            </span>
            <span className="text-xs text-slate-400">
              (Неделя {selectedDayMeta.weekNum}, {selectedDayMeta.isWeekend ? 'Выходной' : 'Будний'})
            </span>
            {selectedDay === currentCycleDay ? (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                СЕГОДНЯ
              </span>
            ) : selectedDay < currentCycleDay ? (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                ПРОШЕДШИЙ ДЕНЬ
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300/80 text-[10px] font-medium border border-slate-700">
                ПРЕДСТОЯЩИЙ ДЕНЬ
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Нагрузка: ~{selectedDayMeta.timeEst} мин на двоих</span>
          </div>
        </div>

        {/* Day Theme */}
        <div className="text-sm text-slate-200 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-white">Программа дня: {selectedDayMeta.label}</div>
            <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Слот фиксирован в цикле, что позволяет не планировать уборку с нуля, а двигаться предсказуемым ритмом.
            </div>
          </div>
        </div>

        {/* Debts notice if any tasks from this day were moved to debts */}
        {debtsForDay.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                С Дня {selectedDay} в долгах: <strong className="text-amber-300 font-bold">{debtsForDay.length} задач(и)</strong>. Долги зафиксированы без штрафов.
              </span>
            </div>
            {onGoToDebts && (
              <button
                onClick={onGoToDebts}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold shrink-0 cursor-pointer transition-colors border border-amber-500/30"
              >
                Открыть долги →
              </button>
            )}
          </div>
        )}

        {/* Tasks List for Selected Day */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="uppercase tracking-wider">
              Задачи, назначенные на День {selectedDay} ({totalTasksCount}):
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Очки = минуты × К-фактор
            </span>
          </div>

          {totalTasksCount === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
              <Sparkles className="w-7 h-7 text-cyan-400 mx-auto opacity-80" />
              <div className="text-sm font-bold text-white">В этот день — фоновые ритуалы и отдых! ✨</div>
              <div className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                По программе 28-дневного цикла сложных плановых зон на День {selectedDay} не назначено.
                Выполняются только ежедневные микро-ритуалы (кухня, лоток, посуда, мусор) на 5–10 минут.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Active / Planned Tasks */}
              {plannedTasksForDay.map((task) => {
                const disgust = getDisgustBadge(task.disgustFactor);
                const points = Math.round(task.estimatedMinutes * task.disgustFactor);
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                      isCompleted
                        ? 'bg-slate-950/50 border-emerald-900/40 opacity-80'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                          {getZoneIcon(task.zone)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${disgust.bg}`}>
                          {disgust.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-700/40">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          +{points} pts
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" />
                          {task.estimatedMinutes} мин
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className={`text-sm font-bold text-white ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    </div>

                    {/* Checklist preview */}
                    {task.checklist && task.checklist.length > 0 && (
                      <div className="pt-2 border-t border-slate-850 space-y-1">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                          <ListChecks className="w-3 h-3 text-cyan-400" />
                          Чек-лист:
                        </div>
                        <div className="space-y-0.5">
                          {task.checklist.map((item, idx) => (
                            <div key={idx} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-cyan-400/70" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">Статус:</span>
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Выполнено
                        </span>
                      ) : selectedDay === currentCycleDay ? (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> На сегодня
                        </span>
                      ) : selectedDay > currentCycleDay ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Запланировано
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium">
                          Прошедший день
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Tasks currently in Debts */}
              {debtsForDay.map((debt) => {
                const disgust = getDisgustBadge(debt.disgustFactor);
                const points = Math.round(debt.estimatedMinutes * debt.disgustFactor);

                return (
                  <div
                    key={debt.id}
                    className="p-4 rounded-xl border border-amber-800/40 bg-amber-950/20 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                          {getZoneIcon(debt.zone)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${disgust.bg}`}>
                          {disgust.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-700/40">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          +{points} pts
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" />
                          {debt.estimatedMinutes} мин
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {debt.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {debt.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-900/30 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-amber-300/80">Статус:</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Перенесено в Долги
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-2">
          <span>🔒</span>
          <span>
            Дни цикла продвигаются автоматически в полночь по календарю. Ручное переключение дня отключено, чтобы не сбивать ритм и прогресс привычки.
          </span>
        </div>
      </div>
    </div>
  );
};
