import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Clock, Sparkles, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { CleaningTask } from '../types';

interface CycleCalendarProps {
  currentCycleDay: number;
  tasks: CleaningTask[];
  debts?: CleaningTask[];
  onSetCycleDay?: (day: number) => void;
  onGoToDebts?: () => void;
}

export const CycleCalendar: React.FC<CycleCalendarProps> = ({
  currentCycleDay,
  tasks,
  debts = [],
  onSetCycleDay,
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

  const selectedDayMeta = getDayMeta(selectedDay);
  const selectedDayTasks = tasks.filter((t) => t.dayOfCycle === selectedDay);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-mono">
              28-ДНЕВНЫЙ ЦИКЛ
            </span>
            <span className="text-xs text-slate-400">4 недели по 7 дней · Без сдвига слотов</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Календарь циклических задач
          </h2>
          <p className="text-xs text-slate-300">
            Каждый день недели закреплён за своей зоной: будни ≤ 15 мин/чел, выходные ≤ 30 мин/чел.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
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
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
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
                    ? 'ring-2 ring-cyan-400 border-cyan-400 bg-cyan-950/40'
                    : isToday
                    ? 'border-cyan-500/70 bg-slate-850 shadow-md shadow-cyan-950/50'
                    : isPast
                    ? 'border-slate-800/80 bg-slate-950/40 opacity-70'
                    : 'border-slate-800 bg-slate-950/80 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-mono text-[10px] sm:text-xs font-bold ${
                      isToday
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
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-cyan-400 text-base">
              День {selectedDay} из 28
            </span>
            <span className="text-xs text-slate-400">
              (Неделя {selectedDayMeta.weekNum}, {selectedDayMeta.isWeekend ? 'Выходной' : 'Будний'})
            </span>
            {selectedDay === currentCycleDay && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                СЕГОДНЯ
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Нагрузка: ~{selectedDayMeta.timeEst} мин на двоих</span>
          </div>
        </div>

        <div className="text-sm text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-white">Программа дня: {selectedDayMeta.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Слот фиксирован по четвергам/пятницам/выходным, что позволяет не планировать уборку с нуля, а следовать циклу.
            </div>
          </div>
        </div>

        {/* Debts notification if this day has uncompleted tasks */}
        {debts.filter((d) => d.dayOfCycle === selectedDay).length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                С Дня {selectedDay} в долгах: <strong className="text-amber-300 font-bold">{debts.filter((d) => d.dayOfCycle === selectedDay).length} задач(и)</strong>. Долги зафиксированы без штрафов.
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

        {/* Change cycle day shortcut for manual tuning */}
        {onSetCycleDay && selectedDay !== currentCycleDay && (
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              💡 При смене дня незакрытые задачи текущего Дня {currentCycleDay} автоматически перенесутся во вкладку «Долги».
            </div>
            <button
              onClick={() => onSetCycleDay(selectedDay)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-xs font-bold text-white shadow-md shadow-cyan-950/40 transition-all cursor-pointer shrink-0"
            >
              Сделать День {selectedDay} текущим днем цикла
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
