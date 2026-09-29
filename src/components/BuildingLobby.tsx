import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Trophy, 
  Flame, 
  Sparkles, 
  DoorOpen, 
  ShieldCheck, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  Users, 
  BookOpen,
  Lock,
  Search,
  Crown
} from 'lucide-react';
import { Apartment, SystemConfig } from '../types';
import { getAuthorizedApartmentIds } from '../utils/storage';

interface BuildingLobbyProps {
  apartments: Apartment[];
  activeApartment: Apartment;
  onOpenIntercom: () => void;
  onSelectApartment: (apt: Apartment) => void;
  onGoToActiveApartment: () => void;
  onOpenGuide?: () => void;
  onAttemptEnterApartment?: (apt: Apartment) => void;
  onOpenStarosta?: () => void;
  systemConfig?: SystemConfig;
}

export const BuildingLobby: React.FC<BuildingLobbyProps> = ({
  apartments,
  activeApartment,
  onOpenIntercom,
  onSelectApartment,
  onGoToActiveApartment,
  onOpenGuide,
  onAttemptEnterApartment,
  onOpenStarosta,
  systemConfig,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const authorizedIds = getAuthorizedApartmentIds();

  // Sort apartments by total points
  const sortedApartments = [...apartments].sort((a, b) => {
    const totalPointsA = a.members.reduce((sum, m) => sum + m.totalPoints, 0);
    const totalPointsB = b.members.reduce((sum, m) => sum + m.totalPoints, 0);
    return totalPointsB - totalPointsA;
  });

  const filteredApartments = sortedApartments.filter((apt) => {
    if (filterType === 'mine' && !authorizedIds.includes(apt.id)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = apt.apartmentNumber.toString().includes(q);
      const matchFamily = apt.familyTitle.toLowerCase().includes(q);
      const matchMember = apt.members.some((m) => m.name.toLowerCase().includes(q));
      return matchNum || matchFamily || matchMember;
    }
    return true;
  });

  const totalPointsBuilding = apartments.reduce(
    (sum, apt) => sum + apt.members.reduce((s, m) => s + m.totalPoints, 0),
    0
  );

  const maxStreak = Math.max(
    ...apartments.flatMap((a) => a.members.map((m) => m.streakDays))
  );

  const handleCardClick = (apt: Apartment) => {
    const isAuthorized = authorizedIds.includes(apt.id);
    if (isAuthorized) {
      onSelectApartment(apt);
    } else if (onAttemptEnterApartment) {
      onAttemptEnterApartment(apt);
    } else {
      onOpenIntercom();
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Lobby Welcome & Quick Entry Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-cyan-950/40 border border-slate-700/60 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide">
              <Building2 className="w-3.5 h-3.5" />
              ЖК «ЧИСТЫЙ ГОРИЗОНТ» · ЕДИНЫЙ ПОДЪЕЗД
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Рейтинг чистоты квартир <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                «Уборка всегда ON» 🌀
              </span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Объединяем жильцов в здоровой привычке: микродозы чистоты по 15 минут в день.
              Каждая квартира надёжно защищена персональным PIN-кодом от случайного входа.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={onGoToActiveApartment}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer group"
            >
              <DoorOpen className="w-5 h-5 text-cyan-200 group-hover:scale-110 transition-transform" />
              <span>Войти в кв. {activeApartment.apartmentNumber} ({activeApartment.familyTitle})</span>
              <ArrowRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenIntercom}
              className="px-6 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/40 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Позвонить в домофон 📟</span>
            </button>

            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                className="px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/40 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Как это работает? Гид и правила 📖</span>
              </button>
            )}

            {onOpenStarosta && (
              <button
                onClick={onOpenStarosta}
                className="px-6 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Кабинет Старосты (Максим) 👑</span>
              </button>
            )}
          </div>
        </div>

        {/* Announcement from Starosta */}
        {systemConfig?.announcement && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
            <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-300 mr-2">{systemConfig.starostaName || 'Староста дома'}:</span>
              <span className="text-amber-100">{systemConfig.announcement}</span>
            </div>
          </div>
        )}

        {/* Building Stats Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Квартир в сети</div>
            <div className="text-xl font-bold text-white flex items-center gap-1.5 mt-0.5">
              <Users className="w-4 h-4 text-cyan-400" />
              {apartments.length} семьи
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Очков чистоты дома</div>
            <div className="text-xl font-bold text-cyan-300 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {totalPointsBuilding.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Рекордный стрик</div>
            <div className="text-xl font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
              <Flame className="w-4 h-4 text-amber-400" />
              {maxStreak} дней подряд
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Лидер подъезда</div>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1 truncate">
              <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
              Кв. {sortedApartments[0]?.apartmentNumber} ({sortedApartments[0]?.familyTitle})
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Турнирная таблица подъезда
            </h2>
            <p className="text-xs text-slate-400">
              Баллы начисляются за выполненные задачи по формуле: Минуты × Коэффициент сложности
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск квартиры..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white placeholder-slate-500 w-36 sm:w-44"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-cyan-500 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Все ({apartments.length})
              </button>
              <button
                onClick={() => setFilterType('mine')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filterType === 'mine'
                    ? 'bg-cyan-500 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Мои ({authorizedIds.length})
              </button>
            </div>
          </div>
        </div>

        {/* Apartments Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApartments.map((apt, index) => {
            const totalPoints = apt.members.reduce((s, m) => s + m.totalPoints, 0);
            const streak = Math.max(...apt.members.map((m) => m.streakDays));
            const isCurrentApt = apt.id === activeApartment.id;
            const isAuthorized = authorizedIds.includes(apt.id);

            return (
              <motion.div
                key={apt.id}
                whileHover={{ y: -3 }}
                className={`relative rounded-2xl p-5 transition-all border ${
                  isCurrentApt
                    ? 'bg-gradient-to-b from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                    : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Rank Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold ${
                        index === 0
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-sm'
                          : index === 1
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                          : index === 2
                          ? 'bg-amber-700/20 text-amber-300 border border-amber-700/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <div>
                      <div className="text-base font-bold text-white flex items-center gap-1.5">
                        <span>Кв. {apt.apartmentNumber}</span>
                        <span className="text-slate-400 font-normal text-xs">({apt.familyTitle})</span>
                      </div>
                      <div className="text-[11px] flex items-center gap-2 mt-0.5">
                        <span className="text-cyan-400/80 font-mono text-[10px]">@{apt.handle}</span>
                        <span className="text-slate-600">·</span>
                        {isAuthorized ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Доступ открыт
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-400/70" />
                            Защищено PIN-кодом
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isCurrentApt ? (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                      Ваша квартира
                    </span>
                  ) : isAuthorized ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
                      Авторизована
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      Закрыто
                    </span>
                  )}
                </div>

                {/* Score & Streak Metrics */}
                <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Очки чистоты
                    </div>
                    <div className="text-lg font-extrabold text-cyan-300 mt-0.5">
                      {totalPoints} <span className="text-xs text-slate-400 font-normal">pts</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      Серия чистоты
                    </div>
                    <div className="text-lg font-extrabold text-amber-400 mt-0.5 flex items-center gap-1">
                      {streak} <span className="text-xs text-slate-400 font-normal">дней</span>
                    </div>
                  </div>
                </div>

                {/* Household Config Chips */}
                {apt.config && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800/70 border border-slate-700/60 text-slate-300 text-[10px]">
                      {apt.config.petType === 'cat'
                        ? '🐱 Кошка'
                        : apt.config.petType === 'dog'
                        ? '🐕 Собака'
                        : apt.config.petType === 'both'
                        ? '🐾 Кот + Пёс'
                        : '🌿 Без питомцев'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800/70 border border-slate-700/60 text-slate-300 text-[10px]">
                      {apt.config.hasRobotVacuum ? '🤖 Робот' : '🧹 Ручной пылесос'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800/70 border border-slate-700/60 text-slate-300 text-[10px]">
                      {apt.config.hasDishwasher ? '🫧 ПММ' : '🧽 Ручная мойка'}
                    </span>
                  </div>
                )}

                {/* Members Avatars & Distribution */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Участники:</span>
                    <span>День цикла: {apt.cycleDay}/28</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {apt.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                      >
                        <span>{m.avatar}</span>
                        <span className="font-medium text-slate-200">{m.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">({m.totalPoints})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coop Progress Bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="truncate max-w-[170px]">{apt.coopRewardTitle}</span>
                    <span className="font-mono text-cyan-300 font-semibold">
                      {apt.coopCurrentPoints} / {apt.coopTargetPoints}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (apt.coopCurrentPoints / apt.coopTargetPoints) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleCardClick(apt)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isCurrentApt
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-md shadow-cyan-900/30'
                      : isAuthorized
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {isCurrentApt ? (
                    <>
                      <span>Открыть пульт квартиры</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : isAuthorized ? (
                    <>
                      <DoorOpen className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Войти в квартиру →</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Войти по PIN-коду 🔒</span>
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* House Philosophy / Rules banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Принцип микродозинга</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Не более 15 минут в будни и до 30 в выходные. Никаких изнурительных субботних генеральных уборок.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Свободный рынок</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Без принудительного закрепления: кто взял — тот сделал — тому очки. Система вежливо подсветит перекосы.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Фактор «Фу» (1.0 — 2.5)</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Справедливые очки: чистка унитаза или вытяжки ценится вдвое выше, чем обычная протирка стола.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
