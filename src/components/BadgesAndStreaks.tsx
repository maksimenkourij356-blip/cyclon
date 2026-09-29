import React from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Sparkles, 
  ShieldCheck, 
  Sunrise, 
  Cat, 
  Dog,
  Ghost, 
  Award,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Badge, HouseholdMember } from '../types';

interface BadgesAndStreaksProps {
  badges: Badge[];
  members: HouseholdMember[];
}

export const BadgesAndStreaks: React.FC<BadgesAndStreaksProps> = ({ badges, members }) => {
  const [member1, member2] = members;
  const currentStreak = Math.max(member1.streakDays, member2.streakDays);

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-yellow-300" />;
      case 'Flame':
      case 'FlameKindling':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-cyan-400" />;
      case 'Cat':
        return <Cat className="w-5 h-5 text-pink-400" />;
      case 'Dog':
        return <Dog className="w-5 h-5 text-amber-400" />;
      case 'Ghost':
        return <Ghost className="w-5 h-5 text-purple-400" />;
      case 'Sunrise':
        return <Sunrise className="w-5 h-5 text-amber-400" />;
      default:
        return <Award className="w-5 h-5 text-cyan-400" />;
    }
  };

  const streakMilestones = [
    { days: 7, title: 'Неделя огня 🔥', reached: currentStreak >= 7 },
    { days: 14, title: 'Марафонец 🏃', reached: currentStreak >= 14 },
    { days: 28, title: 'Железная воля 🛡️', reached: currentStreak >= 28 },
  ];

  return (
    <div className="space-y-6">
      {/* Streak Hero Section */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-orange-950/40 border border-slate-700/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/30 text-xs font-bold font-mono">
              <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400 animate-pulse" />
              СЕРИЯ ЧИСТОТЫ (СТРИК)
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentStreak} дней подряд с плановой задачей!
            </h3>
            <p className="text-xs text-slate-300">
              Выполняйте хотя бы 1 задачу из пула каждый день, чтобы огонь не угас.
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 shrink-0">
            <div className="text-4xl">🔥</div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Текущий рекорд:</div>
              <div className="text-xl font-bold font-mono text-orange-300">{currentStreak} ДНЕЙ</div>
            </div>
          </div>
        </div>

        {/* Milestone Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          {streakMilestones.map((ms) => (
            <div
              key={ms.days}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                ms.reached
                  ? 'bg-orange-950/30 border-orange-500/40 text-white'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 opacity-60'
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-xs font-bold">{ms.title}</div>
                <div className="text-[10px] text-slate-400">{ms.days} дней без пропуска</div>
              </div>
              {ms.reached ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <span className="text-[10px] font-mono text-slate-500">
                  {currentStreak}/{ms.days}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Badges Collection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            Достижения и значки
          </h3>
          <span className="text-xs text-slate-400">
            Разблокировано: {badges.filter((b) => b.isUnlocked).length} из {badges.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {badges.map((badge) => {
            const pct = Math.round((badge.progress / badge.maxProgress) * 100);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                  badge.isUnlocked
                    ? 'bg-slate-900 border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-2xl border shrink-0 ${
                      badge.isUnlocked
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                    }`}
                  >
                    {badge.isUnlocked ? getBadgeIcon(badge.icon) : <Lock className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white truncate">{badge.title}</h4>
                      {badge.isUnlocked && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                          Получен
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">{badge.description}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Прогресс:</span>
                    <span>
                      {badge.progress} / {badge.maxProgress}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        badge.isUnlocked ? 'bg-cyan-400' : 'bg-slate-600'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
