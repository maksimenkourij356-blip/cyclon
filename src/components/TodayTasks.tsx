import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle, 
  Clock, 
  Sparkles, 
  UserCheck, 
  ArrowRightLeft, 
  Play, 
  AlertCircle, 
  Flame,
  Check,
  Cat,
  UtensilsCrossed,
  Bath,
  Tv,
  SprayCan,
  Shirt,
  HeartHandshake
} from 'lucide-react';
import { CleaningTask, HouseholdMember, DisgustFactor } from '../types';
import { getWeekdayNameForCycleDay } from '../utils/dayCycle';

interface TodayTasksProps {
  tasks: CleaningTask[];
  debts?: CleaningTask[];
  activeMember: HouseholdMember;
  otherMember: HouseholdMember;
  cycleDay: number;
  onTakeTask: (task: CleaningTask) => void;
  onPassTask: (task: CleaningTask) => void;
  onStartTimer: (task: CleaningTask) => void;
  onCompleteDirectly: (task: CleaningTask) => void;
  onGoToDebts?: () => void;
  onPullEarlierDaysToToday?: () => void;
  onMoveEarlierDaysToDebts?: () => void;
}

export const TodayTasks: React.FC<TodayTasksProps> = ({
  tasks,
  debts = [],
  activeMember,
  otherMember,
  cycleDay,
  onTakeTask,
  onPassTask,
  onStartTimer,
  onCompleteDirectly,
  onGoToDebts,
  onPullEarlierDaysToToday,
  onMoveEarlierDaysToDebts,
}) => {
  // Disgust Factor badge styling
  const getDisgustBadge = (factor: DisgustFactor) => {
    switch (factor) {
      case 1.0:
        return {
          label: 'K=1.0 «Норм»',
          bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
        };
      case 1.5:
        return {
          label: 'K=1.5 «Не очень»',
          bg: 'bg-yellow-950/60 text-yellow-300 border-yellow-500/30',
        };
      case 2.0:
        return {
          label: 'K=2.0 «Фу»',
          bg: 'bg-orange-950/60 text-orange-300 border-orange-500/30',
        };
      case 2.5:
        return {
          label: 'K=2.5 «Жесть»',
          bg: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
        };
    }
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

  // Split into Rituals and Today's Cycle Tasks
  const rituals = tasks.filter((t) => t.category === 'ritual');
  const plannedTasks = tasks.filter((t) => t.category !== 'ritual' && (t.dayOfCycle === cycleDay || !t.dayOfCycle));

  const isWeekend = cycleDay % 7 === 6 || cycleDay % 7 === 0; // Saturday / Sunday

  // Earlier uncompleted tasks from earlier days of the current week (e.g. Days 1..cycleDay-1)
  const currentDayOfWeekIdx = (cycleDay - 1) % 7; // 0 for Mon, 1 for Tue, 2 for Wed...
  const earlierDaysUncompleted = tasks.filter(
    (t) => t.category !== 'ritual' && t.dayOfCycle && t.dayOfCycle < cycleDay && t.dayOfCycle >= cycleDay - currentDayOfWeekIdx && t.status !== 'completed'
  );
  const earlierDaysDebts = debts.filter(
    (d) => d.dayOfCycle && d.dayOfCycle < cycleDay && d.dayOfCycle >= cycleDay - currentDayOfWeekIdx && d.status !== 'completed'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Day context and Time limit */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold font-mono">
              ДЕНЬ {cycleDay} ИЗ 28 · {getWeekdayNameForCycleDay(cycleDay).toUpperCase()}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {isWeekend ? '⚡ Выходной день (утренний слот)' : '🌙 Будний день (вечерний слот)'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Сделать сегодня
          </h2>
          <p className="text-xs text-slate-300">
            Фокус дня без авралов: берите дела себе, запускайте таймер спринта или передавайте партнёру.
          </p>
        </div>

        {/* Time Budget Indicator */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 shrink-0">
          <Clock className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Тайм-слот на день:
            </div>
            <div className="text-sm font-bold text-emerald-400">
              {isWeekend ? 'до 20–30 мин на двоих ⚡' : 'всего 15–20 мин на двоих 🌙'}
            </div>
          </div>
        </div>
      </div>

      {/* Imbalance Soft Nudge (Anti-Burnout) */}
      <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-amber-300">Баланс очков в паре: </span>
          <span>
            {activeMember.name} закрыл(а) {activeMember.disgustBreakdown.fu + activeMember.disgustBreakdown.extreme} сложных задач, а {otherMember.name} — {otherMember.disgustBreakdown.fu + otherMember.disgustBreakdown.extreme}. 
            Вклад равномерный, взаимная поддержка работает отлично!
          </span>
        </div>
      </div>

      {/* Mid-week catch-up banners if there are tasks earlier this week */}
      {earlierDaysUncompleted.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0">🗓️</span>
            <div className="space-y-0.5">
              <div className="font-bold text-white flex items-center gap-2">
                <span>Задачи с начала недели ({currentDayOfWeekIdx} {currentDayOfWeekIdx === 1 ? 'день' : 'дня'} до сегодня):</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {earlierDaysUncompleted.length} {earlierDaysUncompleted.length === 1 ? 'задача' : 'задачи'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Задачи понедельника/вторника не закрыты. Вы можете добавить их к сегодняшнему списку дел или отправить во вкладку «Долги».
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onPullEarlierDaysToToday && (
              <button
                type="button"
                onClick={onPullEarlierDaysToToday}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-cyan-950/40 transition-all"
              >
                Добавить в Сегодня
              </button>
            )}
            {onMoveEarlierDaysToDebts && (
              <button
                type="button"
                onClick={onMoveEarlierDaysToDebts}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-amber-300 font-semibold text-xs border border-amber-500/40 cursor-pointer transition-all"
              >
                Отправить в Долги
              </button>
            )}
          </div>
        </div>
      )}

      {earlierDaysDebts.length > 0 && earlierDaysUncompleted.length === 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📋</span>
            <span>
              В долгах ждут задачи с начала недели ({earlierDaysDebts.length} шт). Они зафиксированы без штрафов.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onPullEarlierDaysToToday && (
              <button
                type="button"
                onClick={onPullEarlierDaysToToday}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold hover:bg-cyan-900 cursor-pointer transition-colors"
              >
                Перенести в Сегодня
              </button>
            )}
            {onGoToDebts && (
              <button
                type="button"
                onClick={onGoToDebts}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 text-xs cursor-pointer transition-colors"
              >
                К долгам →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Planned Cycle Tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Дела по плану дня ({plannedTasks.length})</span>
          <span className="text-[11px] text-cyan-400 font-normal">Очки = минуты × К-фактор</span>
        </div>

        {plannedTasks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
            <div className="text-sm font-bold text-white">Все плановые задачи на День {cycleDay} закрыты! 🎉</div>
            <div className="text-xs text-slate-400 max-w-sm mx-auto">
              Отличная работа! Можно отдохнуть, выполнить фоновый ритуал или заглянуть во вкладку «Долги».
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {plannedTasks.map((task) => {
            const disgust = getDisgustBadge(task.disgustFactor);
            const points = Math.round(task.estimatedMinutes * task.disgustFactor);
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in_progress';
            const takenByActive = task.takenBy === activeMember.id;
            const takenByOther = task.takenBy === otherMember.id;

            return (
              <motion.div
                key={task.id}
                layout
                className={`relative rounded-2xl p-4 transition-all border ${
                  isCompleted
                    ? 'bg-slate-950/60 border-slate-800 opacity-60'
                    : isInProgress
                    ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800'
                }`}
              >
                {/* Header of card */}
                <div className="flex items-start justify-between gap-2 mb-2">
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

                {/* Task Title & Description */}
                <h3 className={`font-bold text-sm text-white ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                  {task.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {task.description}
                </p>

                {/* Transfer promise badge if task was passed with a promise */}
                {task.transferPromise && !isCompleted && (
                  <div className="mt-2.5 px-2.5 py-1.5 rounded-xl bg-pink-950/40 border border-pink-500/30 text-xs flex items-start gap-2 text-pink-200">
                    <HeartHandshake className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-semibold text-pink-300">
                        {task.transferPromise.fromMemberName} передал(а) с обещанием:
                      </span>{' '}
                      <span className="text-slate-300 italic">{task.transferPromise.promiseText}</span>
                    </div>
                  </div>
                )}

                {/* Status or Assignee tag */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                        <Check className="w-3.5 h-3.5" /> Выполнено (+{task.pointsSnapshot || points} pts)
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center gap-1 text-cyan-300 font-medium text-[11px]">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                        {takenByActive ? 'Взято вами' : `Взял(а): ${otherMember.name}`}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Свободна в пуле</span>
                    )}
                  </div>

                  {/* Actions */}
                  {!isCompleted && (
                    <div className="flex items-center gap-1.5">
                      {!isInProgress ? (
                        <button
                          onClick={() => onTakeTask(task)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Взять себе
                        </button>
                      ) : takenByActive ? (
                        <>
                          <button
                            onClick={() => onPassTask(task)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-pink-300 hover:text-pink-200 border border-pink-500/20 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title={`Передать ${otherMember.name} с распиской`}
                          >
                            <ArrowRightLeft className="w-3 h-3 text-pink-400" />
                            <span>Передать</span>
                          </button>
                          <button
                            onClick={() => onStartTimer(task)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Запустить таймер спринта"
                          >
                            <Play className="w-3 h-3 fill-cyan-400 text-cyan-400" />
                            Таймер
                          </button>
                          <button
                            onClick={() => onCompleteDirectly(task)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm shadow-emerald-950/40"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Готово
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onTakeTask(task)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
                          title="Перехватить задачу у партнера"
                        >
                          Перехватить
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          </div>
        )}
      </div>

      {/* Daily Background Rituals (Фоновые ритуалы) */}
      <div className="space-y-3 pt-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">Ежедневные фоновые ритуалы</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Каждый день начисляют очки
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal">
            Не уходят в долги при смене дня · обновляются каждое утро
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rituals.map((ritual) => {
            const isCompleted = ritual.status === 'completed';
            const points = Math.round(ritual.estimatedMinutes * ritual.disgustFactor);
            const completedByName = ritual.completedBy
              ? ritual.completedBy === activeMember.id
                ? `${activeMember.name} (Вы)`
                : otherMember.name
              : null;

            return (
              <div
                key={ritual.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-slate-950/60 border-emerald-900/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">{ritual.title}</span>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 shrink-0">
                      {ritual.estimatedMinutes} мин
                    </span>
                    {ritual.disgustFactor > 1.0 && (
                      <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40 shrink-0">
                        {ritual.disgustFactor}x фу
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{ritual.description}</p>
                  {isCompleted && (
                    <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Выполнено {completedByName ? `— ${completedByName}` : ''} (+{points} pts)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isCompleted && (
                    <button
                      onClick={() => onStartTimer(ritual)}
                      className="p-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                      title="Запустить спринт 5-15 минут"
                    >
                      <Play className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  )}
                  <button
                    onClick={() => onCompleteDirectly(ritual)}
                    disabled={isCompleted}
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-950/50'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {isCompleted ? 'Сделано' : `+${points} pts`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
