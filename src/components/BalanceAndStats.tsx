import React from 'react';
import { motion } from 'motion/react';
import { 
  Scale, 
  Sparkles, 
  Trophy, 
  TrendingUp, 
  Heart, 
  History, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { HouseholdMember, Apartment } from '../types';
import { getNextLevelThreshold } from '../data/initialData';

interface BalanceAndStatsProps {
  apartment: Apartment;
}

export const BalanceAndStats: React.FC<BalanceAndStatsProps> = ({ apartment }) => {
  const [member1, member2] = apartment.members;
  const totalPointsPair = (member1?.totalPoints || 0) + (member2?.totalPoints || 0);

  const m1Pct = totalPointsPair > 0 ? Math.round((member1.totalPoints / totalPointsPair) * 100) : 50;
  const m2Pct = 100 - m1Pct;

  const diffPct = Math.abs(m1Pct - m2Pct);
  const isFair = diffPct <= 15;

  const m1Tier = getNextLevelThreshold(member1?.totalPoints || 0);
  const m2Tier = getNextLevelThreshold(member2?.totalPoints || 0);

  // Co-op progress
  const coopPercent = Math.min(100, Math.round((apartment.coopCurrentPoints / apartment.coopTargetPoints) * 100));

  return (
    <div className="space-y-6">
      {/* Honest Balance Gauge Header */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Баланс очков и вклада
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                    isFair
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isFair ? 'Идеальный паритет ⚖️' : 'Небольшой перекос'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Защита от дисбаланса: система учитывает затраченное время и сложность («Фактор Фу»).
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Суммарно набрано:</div>
            <div className="text-xl font-mono font-extrabold text-cyan-300">
              {totalPointsPair} pts
            </div>
          </div>
        </div>

        {/* Dynamic Dual Balance Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <span>{member1.avatar}</span> {member1.name}: {member1.totalPoints} pts ({m1Pct}%)
            </span>
            <span className="flex items-center gap-1.5">
              {member2.name}: {member2.totalPoints} pts ({m2Pct}%) <span>{member2.avatar}</span>
            </span>
          </div>

          <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-l-full transition-all duration-700"
              style={{ width: `${m1Pct}%` }}
            />
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-r-full transition-all duration-700"
              style={{ width: `${m2Pct}%` }}
            />
          </div>

          <div className="text-center text-[11px] text-slate-400">
            {isFair
              ? '✨ Баланс находится в гармонии. Нагрузка распределяется справедливо.'
              : `⚠️ ${m1Pct > m2Pct ? member1.name : member2.name} взял(а) на себя большую часть задач. Помогите партнёру!`}
          </div>
        </div>
      </div>

      {/* Co-op Family Reward Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-pink-950/30 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400/30" />
            <h4 className="font-bold text-sm text-white">Семейная кооп-цель 28-дневного цикла</h4>
          </div>
          <span className="text-xs font-bold text-amber-300 font-mono">
            {apartment.coopCurrentPoints} / {apartment.coopTargetPoints} pts
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-white">{apartment.coopRewardTitle}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Откроется автоматически при достижении цели цикла на двоих!
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
            {coopPercent}%
          </span>
        </div>

        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-cyan-400 via-teal-400 to-rose-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${coopPercent}%` }}
          />
        </div>
      </div>

      {/* Individual Progression & Disgust Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[member1, member2].map((member, idx) => {
          const tier = idx === 0 ? m1Tier : m2Tier;
          const dirtyTasksCount = member.disgustBreakdown.fu + member.disgustBreakdown.extreme;

          return (
            <div key={member.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{member.avatar}</span>
                  <div>
                    <h4 className="font-bold text-base text-white">{member.name}</h4>
                    <div className="text-xs text-cyan-400 font-medium">{member.roleTitle}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Ранг чистоты:</div>
                  <div className="text-sm font-bold text-amber-300 flex items-center gap-1 justify-end">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    {member.currentLevel}
                  </div>
                </div>
              </div>

              {/* Progress to next level */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>До «{tier.nextTitle}»</span>
                  <span className="font-mono text-cyan-300">{tier.needed > 0 ? `ещё ${tier.needed} pts` : 'Максимум!'}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all"
                    style={{ width: `${tier.progress}%` }}
                  />
                </div>
              </div>

              {/* Disgust Matrix */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Распределение по сложности (К):</span>
                  <span className="text-rose-400 font-bold">Фу/Жесть: {dirtyTasksCount}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Норм (1.0)</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      {member.disgustBreakdown.norm}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Средне (1.5)</div>
                    <div className="text-sm font-bold text-yellow-400 font-mono">
                      {member.disgustBreakdown.moderate}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Фу (2.0)</div>
                    <div className="text-sm font-bold text-orange-400 font-mono">
                      {member.disgustBreakdown.fu}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Жесть (2.5)</div>
                    <div className="text-sm font-bold text-rose-400 font-mono">
                      {member.disgustBreakdown.extreme}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* History Feed */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h4 className="font-bold text-sm text-white">Журнал выполненных уборок</h4>
          </div>
          <span className="text-xs text-slate-400">Снимки очков неизменны</span>
        </div>

        <div className="divide-y divide-slate-800">
          {apartment.history.map((record) => (
            <div key={record.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-200">{record.taskTitle}</div>
                <div className="text-[11px] text-slate-400">
                  Выполнил(а): <span className="text-cyan-300 font-medium">{record.memberName}</span> · {record.timestamp}
                </div>
              </div>
              <span className="font-mono font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                +{record.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
