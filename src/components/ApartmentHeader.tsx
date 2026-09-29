import React, { useState } from 'react';
import { 
  Building2, 
  DoorOpen, 
  Send, 
  KeyRound, 
  Flame, 
  CheckCircle2, 
  Calendar, 
  Scale, 
  Award, 
  AlertTriangle,
  UserCheck,
  Settings2,
  BookOpen,
  Eye,
  EyeOff
} from 'lucide-react';
import { Apartment, HouseholdMember } from '../types';

interface ApartmentHeaderProps {
  apartment: Apartment;
  activeMember: HouseholdMember;
  activeTab: 'today' | 'calendar' | 'balance' | 'badges' | 'debts';
  onSelectTab: (tab: 'today' | 'calendar' | 'balance' | 'badges' | 'debts') => void;
  onSwitchMember: (memberId: string) => void;
  onOpenLobby: () => void;
  onOpenIntercom: () => void;
  onOpenShare: () => void;
  onOpenConfig?: () => void;
  onOpenGuide?: () => void;
}

export const ApartmentHeader: React.FC<ApartmentHeaderProps> = ({
  apartment,
  activeMember,
  activeTab,
  onSelectTab,
  onSwitchMember,
  onOpenLobby,
  onOpenIntercom,
  onOpenShare,
  onOpenConfig,
  onOpenGuide,
}) => {
  const currentStreak = Math.max(...apartment.members.map((m) => m.streakDays));
  const debtsCount = apartment.debts.length;
  const [showPin, setShowPin] = useState(false);

  const getPetBadgeText = () => {
    switch (apartment.config?.petType) {
      case 'cat':
        return '🐱 Кошка';
      case 'dog':
        return '🐕 Собака';
      case 'both':
        return '🐾 Кот + Пёс';
      case 'none':
        return '🌿 Без питомцев';
      default:
        return '🐱 Кошка';
    }
  };

  return (
    <header className="space-y-4">
      {/* Top Bar: Lobby link, Apt Title, Intercom, Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLobby}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
            title="Вернуться в Холл дома и общий рейтинг"
          >
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Холл дома</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Кв. {apartment.apartmentNumber} · {apartment.familyTitle}
              </h1>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                @{apartment.handle}
              </span>
              <button
                onClick={() => setShowPin(!showPin)}
                className="px-2 py-0.5 rounded-md bg-slate-950 text-cyan-300 border border-cyan-500/30 font-mono text-[11px] font-bold flex items-center gap-1.5 hover:border-cyan-400 transition-colors cursor-pointer"
                title={showPin ? "Скрыть секретный PIN" : "Показать PIN домофона квартиры"}
              >
                <KeyRound className="w-3 h-3 text-cyan-400" />
                <span>PIN: {showPin ? apartment.pinCode : '••••'}</span>
                {showPin ? (
                  <EyeOff className="w-3 h-3 text-slate-400 hover:text-white" />
                ) : (
                  <Eye className="w-3 h-3 text-slate-400 hover:text-white" />
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs text-slate-400">
                День {apartment.cycleDay} из 28 · Стрик: {currentStreak} дн. 🔥
              </p>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700/80 text-slate-300">
                  {getPetBadgeText()}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700/80 text-slate-300">
                  {apartment.config?.hasRobotVacuum ? '🤖 Робот' : '🧹 Ручной'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700/80 text-slate-300 hidden md:inline-block">
                  {apartment.config?.hasDishwasher ? '🫧 ПММ' : '🧽 Ручная'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Member Switcher & Share & Config */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* Switch Active Member */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            {apartment.members.map((member) => {
              const isActive = member.id === activeMember.id;
              return (
                <button
                  key={member.id}
                  onClick={() => onSwitchMember(member.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{member.avatar}</span>
                  <span>{member.name}</span>
                  <span className={`text-[10px] font-mono ${isActive ? 'text-cyan-100' : 'text-slate-500'}`}>
                    ({member.totalPoints})
                  </span>
                </button>
              );
            })}
          </div>

          {onOpenConfig && (
            <button
              onClick={onOpenConfig}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Конфигуратор бытовых условий и задач"
            >
              <Settings2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden xl:inline">Быт</span>
            </button>
          )}

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Как устроен ЦИКЛON: руководство и атлас значков"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline">Гид</span>
            </button>
          )}

          <button
            onClick={onOpenIntercom}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Открыть домофон / сменить квартиру"
          >
            <DoorOpen className="w-4 h-4 text-cyan-400" />
            <span className="hidden xl:inline">Домофон</span>
          </button>

          <button
            onClick={onOpenShare}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Поделиться с партнером в Telegram / Скопировать ссылку"
          >
            <Send className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">Партнёру</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium scrollbar-none">
        <button
          onClick={() => onSelectTab('today')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'today'
              ? 'bg-cyan-500 text-white font-bold shadow-md shadow-cyan-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-850'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Сделать сегодня
        </button>

        <button
          onClick={() => onSelectTab('calendar')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-cyan-500 text-white font-bold shadow-md shadow-cyan-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-850'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Цикл 28 дней
        </button>

        <button
          onClick={() => onSelectTab('balance')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'balance'
              ? 'bg-cyan-500 text-white font-bold shadow-md shadow-cyan-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-850'
          }`}
        >
          <Scale className="w-4 h-4" />
          Баланс очков
        </button>

        <button
          onClick={() => onSelectTab('badges')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-cyan-500 text-white font-bold shadow-md shadow-cyan-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-850'
          }`}
        >
          <Award className="w-4 h-4" />
          Достижения
        </button>

        <button
          onClick={() => onSelectTab('debts')}
          className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'debts'
              ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-850'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Долги
          {debtsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
              {debtsCount}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
};
