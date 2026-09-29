import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, RotateCcw, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { CleaningTask } from '../types';
import { soundEffects } from '../utils/audio';
import confetti from 'canvas-confetti';

interface CleaningTimerModalProps {
  isOpen: boolean;
  task: CleaningTask | null;
  activeMemberName: string;
  onClose: () => void;
  onCompleteTask: (task: CleaningTask) => void;
}

export const CleaningTimerModal: React.FC<CleaningTimerModalProps> = ({
  isOpen,
  task,
  activeMemberName,
  onClose,
  onCompleteTask,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (task) {
      setSecondsLeft(task.estimatedMinutes * 60);
      setIsRunning(true);
      setCheckedItems({});
    }
  }, [task]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      soundEffects.playTaskSuccess();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  if (!isOpen || !task) return null;

  const toggleItem = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleFinish = () => {
    soundEffects.playTaskSuccess();
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#10b981', '#f59e0b'],
      });
    } catch {
      // ignore
    }
    onCompleteTask(task);
    onClose();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = task.estimatedMinutes * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 100;
  const points = Math.round(task.estimatedMinutes * task.disgustFactor);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 p-6 space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                Спринт уборки · {task.estimatedMinutes} минут
              </span>
              <h3 className="text-xl font-bold text-white mt-1">{task.title}</h3>
              <p className="text-xs text-slate-400">
                Исполнитель: <span className="text-cyan-300 font-semibold">{activeMemberName}</span> · Награда: <span className="text-amber-300 font-bold">+{points} очков</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Countdown Clock */}
          <div className="flex flex-col items-center justify-center py-4 bg-slate-950/70 rounded-2xl border border-slate-800 relative overflow-hidden">
            {/* Progress line */}
            <div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />

            <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-wider text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isRunning
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-900/40'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> Пауза
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Продолжить
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setSecondsLeft(task.estimatedMinutes * 60);
                  setIsRunning(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
                title="Сбросить таймер"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Checklist */}
          {task.checklist && task.checklist.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Пошаговый чек-лист стандарта чистоты:
              </div>
              <div className="space-y-1.5">
                {task.checklist.map((item, idx) => (
                  <label
                    key={idx}
                    onClick={() => toggleItem(idx)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      checkedItems[idx]
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 line-through opacity-80'
                        : 'bg-slate-850/60 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        checkedItems[idx] ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action */}
          <div className="pt-2 border-t border-slate-800 flex gap-3">
            <button
              onClick={handleFinish}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Завершить уборку и получить +{points} очков!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
