import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Clock, Sparkles, Shield, Play } from 'lucide-react';
import { CleaningTask } from '../types';

interface DebtsListProps {
  debts: CleaningTask[];
  onCompleteDebt: (task: CleaningTask) => void;
  onAmnestyDebt: (task: CleaningTask) => void;
  onStartTimer?: (task: CleaningTask) => void;
}

export const DebtsList: React.FC<DebtsListProps> = ({
  debts,
  onCompleteDebt,
  onAmnestyDebt,
  onStartTimer,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Долги</h3>
            <p className="text-xs text-slate-400">
              Задачи прошлых дней, которые не успели закрыть вовремя. Никаких штрафов: игра фиксирует реальность, а не наказывает.
            </p>
          </div>
        </div>
      </div>

      {debts.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-xl">
            ✨
          </div>
          <h4 className="font-bold text-white text-sm">Долгов нет, квартира чиста!</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Все запланированные задачи цикла выполняются в срок. Продолжайте в том же духе!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => {
            const points = Math.round(debt.estimatedMinutes * debt.disgustFactor);

            return (
              <motion.div
                key={debt.id}
                layout
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-750 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{debt.title}</span>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                      с Дня {debt.dayOfCycle || '–'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{debt.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {debt.estimatedMinutes} минут
                    </span>
                    <span className="flex items-center gap-1 text-amber-300 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      +{points} pts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onAmnestyDebt(debt)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Списать за давностью (защита от выгорания)"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Амнистия
                  </button>

                  {onStartTimer && (
                    <button
                      onClick={() => onStartTimer(debt)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Запустить таймер спринта на этот долг"
                    >
                      <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                      Таймер
                    </button>
                  )}

                  <button
                    onClick={() => onCompleteDebt(debt)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Закрыть долг
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
