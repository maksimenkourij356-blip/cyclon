import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRightLeft, HeartHandshake, Coffee, Sparkles, Footprints, MessageSquareHeart } from 'lucide-react';
import { CleaningTask, HouseholdMember } from '../types';

interface TransferTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: CleaningTask | null;
  fromMember: HouseholdMember;
  partnerMember: HouseholdMember | null;
  onConfirmTransfer: (taskId: string, promiseText: string) => void;
}

const DEFAULT_PROMISES = [
  {
    icon: Coffee,
    text: 'Приготовлю вкусный завтрак и кофе в постель на выходных ☕🥞',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Footprints,
    text: 'Сделаю расслабляющий массаж плеч или ног на 15 минут 💆✨',
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  },
  {
    icon: Sparkles,
    text: 'Угощу любимым десертом или вкусным кофе по дороге домой 🍰🥤',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: HeartHandshake,
    text: 'Заберу на себя следующее трудное дело в цикле уборки 🤝🛡️',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
];

export const TransferTaskModal: React.FC<TransferTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  fromMember,
  partnerMember,
  onConfirmTransfer,
}) => {
  const [selectedPromise, setSelectedPromise] = useState<string>(DEFAULT_PROMISES[0].text);
  const [customText, setCustomText] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  if (!isOpen || !task) return null;

  const targetPartnerName = partnerMember ? partnerMember.name : 'партнёру';
  const targetPartnerAvatar = partnerMember ? partnerMember.avatar : '🤝';

  const handleConfirm = () => {
    const finalPromise = isCustom && customText.trim() ? customText.trim() : selectedPromise;
    onConfirmTransfer(task.id, finalPromise);
    onClose();
  };

  const points = Math.round(task.estimatedMinutes * task.disgustFactor);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Верхняя шапка */}
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Передать задачу партнёру</h3>
                <p className="text-xs text-slate-400">Честная передача с дружеской распиской</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Карточка передаваемой задачи */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-slate-400">Передаётся задача:</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  +{points} pts
                </span>
              </div>
              <p className="text-sm font-medium text-slate-200">{task.title}</p>
              <p className="text-xs text-slate-400 mt-1">Оценка: {task.estimatedMinutes} мин • K={task.disgustFactor}</p>
            </div>

            {/* Визуальная траектория передачи */}
            <div className="flex items-center justify-center gap-3 py-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                <span className="text-base">{fromMember.avatar}</span>
                <span className="text-xs text-slate-200 font-medium">{fromMember.name}</span>
              </div>
              <span className="text-slate-500 font-bold">➔</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30">
                <span className="text-base">{targetPartnerAvatar}</span>
                <span className="text-xs text-pink-200 font-medium">{targetPartnerName}</span>
              </div>
            </div>

            {/* Выбор дружеской расписки */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <MessageSquareHeart className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Ваша встречная расписка-обещание:
                </span>
              </div>

              <div className="space-y-2">
                {DEFAULT_PROMISES.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = !isCustom && selectedPromise === item.text;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsCustom(false);
                        setSelectedPromise(item.text);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-pink-500/50 bg-pink-500/10 text-white shadow-sm ring-1 ring-pink-500/30'
                          : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 border ${item.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="pt-0.5 leading-relaxed">{item.text}</span>
                    </button>
                  );
                })}

                {/* Свой вариант */}
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center gap-2.5 ${
                    isCustom
                      ? 'border-pink-500/50 bg-pink-500/10 text-white shadow-sm ring-1 ring-pink-500/30'
                      : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}
                >
                  <span className="text-sm">✍️</span>
                  <span>Написать свой вариант обещания</span>
                </button>

                {isCustom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-1"
                  >
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Например: С меня пицца на ужин и просмотр твоего любимого сериала 🍕🎬"
                      rows={2}
                      className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Поясняющая плашка */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>
                Партнёр получит +{points} pts за выполнение этой задачи, а ваше обещание закрепится на карточке!
              </span>
            </div>
          </div>

          {/* Футер */}
          <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white shadow-lg shadow-pink-500/20 transition-all flex items-center gap-1.5"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Передать с обещанием</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
