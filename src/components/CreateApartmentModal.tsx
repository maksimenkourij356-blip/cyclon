import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  X, 
  Sparkles, 
  KeyRound, 
  Users, 
  Home, 
  Cat, 
  Dog, 
  Bot, 
  Check, 
  UtensilsCrossed, 
  ShieldCheck,
  HeartHandshake,
  Calendar
} from 'lucide-react';
import { Apartment, ApartmentConfig, HouseholdMember } from '../types';
import { soundEffects } from '../utils/audio';
import { getNextAvailableApartmentNumber } from '../utils/storage';
import { 
  getCurrentRealDayOfWeek, 
  getWeekdayNameForCycleDay, 
  WEEKDAY_NAMES_RU 
} from '../utils/dayCycle';

interface CreateApartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingApartments: Apartment[];
  onCreateApartment: (newAptData: Partial<Apartment>) => void;
}

export const CreateApartmentModal: React.FC<CreateApartmentModalProps> = ({
  isOpen,
  onClose,
  existingApartments,
  onCreateApartment,
}) => {
  const suggestedNum = getNextAvailableApartmentNumber(existingApartments);
  const todayIsoWeekday = getCurrentRealDayOfWeek(); // 2 for Tuesday
  const todayWeekdayName = WEEKDAY_NAMES_RU[todayIsoWeekday - 1]; // "Вторник"

  const [apartmentNumber, setApartmentNumber] = useState<number>(suggestedNum);
  const [familyTitle, setFamilyTitle] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [startDayChoice, setStartDayChoice] = useState<'weekday' | 'day1'>('weekday');
  const [partner1Name, setPartner1Name] = useState('');
  const [partner2Name, setPartner2Name] = useState('');
  const [petType, setPetType] = useState<ApartmentConfig['petType']>('cat');
  const [hasRobot, setHasRobot] = useState<boolean>(true);
  const [hasDishwasher, setHasDishwasher] = useState<boolean>(true);
  const [hasBalcony, setHasBalcony] = useState<boolean>(true);
  const [bathType, setBathType] = useState<ApartmentConfig['bathType']>('both');
  const [coopReward, setCoopReward] = useState('Семейный ужин / Отдых 🎉');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!apartmentNumber || apartmentNumber <= 0) {
      setErrorMsg('Укажите корректный номер квартиры');
      soundEffects.playKeypadTone('clear');
      return;
    }

    // Check if apartment number already exists
    const duplicate = existingApartments.find((a) => a.apartmentNumber === Number(apartmentNumber));
    if (duplicate) {
      setErrorMsg(`Квартира №${apartmentNumber} уже зарегистрирована в доме`);
      soundEffects.playKeypadTone('clear');
      return;
    }

    if (!pinCode || pinCode.length < 4) {
      setErrorMsg('Придумайте 4-значный PIN-код для защиты доступа к квартире');
      soundEffects.playKeypadTone('clear');
      return;
    }

    const p1 = partner1Name.trim() || 'Жилец 1';
    const p2 = partner2Name.trim() || (partner1Name.trim() ? 'Партнёр' : 'Жилец 2');
    const title = familyTitle.trim() || `Квартира №${apartmentNumber}`;

    const members: HouseholdMember[] = [
      {
        id: `member-${Date.now()}-1`,
        name: p1,
        avatar: p1[0].toUpperCase(),
        roleTitle: 'Партнёр',
        totalPoints: 0,
        completedTasksCount: 0,
        streakDays: 0,
        currentLevel: 'Новичок',
        disgustBreakdown: { norm: 0, moderate: 0, fu: 0, extreme: 0 },
      },
      {
        id: `member-${Date.now()}-2`,
        name: p2,
        avatar: p2[0].toUpperCase(),
        roleTitle: 'Партнёр',
        totalPoints: 0,
        completedTasksCount: 0,
        streakDays: 0,
        currentLevel: 'Новичок',
        disgustBreakdown: { norm: 0, moderate: 0, fu: 0, extreme: 0 },
      },
    ];

    const config: ApartmentConfig = {
      petType,
      hasRobotVacuum: hasRobot,
      hasDishwasher,
      hasBalcony,
      bathType,
    };

    soundEffects.playVictory();

    onCreateApartment({
      id: `apt-${apartmentNumber}`,
      handle: `apt${apartmentNumber}`,
      apartmentNumber: Number(apartmentNumber),
      floor: Math.max(1, Math.ceil(Number(apartmentNumber) / 10)),
      familyTitle: title,
      pinCode,
      config,
      members,
      cycleDay: startDayChoice === 'weekday' ? todayIsoWeekday : 1,
      coopRewardTitle: coopReward.trim() || 'Семейный ужин 🎉',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 my-8 space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Заселение в ЖК ЦИКЛON
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Создайте пульт вашей квартиры и синхронизируйте задачи в облаке
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Номер квартиры
              </label>
              <div className="relative">
                <Home className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min={1}
                  max={999}
                  value={apartmentNumber}
                  onChange={(e) => setApartmentNumber(parseInt(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white font-mono text-sm"
                  placeholder="Например, 42"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Секретный PIN-код (4 цифры)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white font-mono text-sm tracking-widest"
                  placeholder="••••"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Для входа только вашей семьи</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Название квартиры / Семья
            </label>
            <input
              type="text"
              value={familyTitle}
              onChange={(e) => setFamilyTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-white text-sm"
              placeholder="Например: Семья Ивановых или Максим и Анна"
            />
          </div>

          {/* Cycle start day synchronized with real calendar */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Старт 28-дневного цикла:
              </span>
              <span className="text-[11px] text-slate-400">Сегодня: {todayWeekdayName}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStartDayChoice('weekday')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  startDayChoice === 'weekday'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-cyan-300 flex items-center justify-between">
                  <span>День {todayIsoWeekday} ({todayWeekdayName})</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-200">Рекомендуется</span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal mt-1 leading-snug">
                  В точном синхроне с календарём: задачи на сегодня сразу актуальны
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStartDayChoice('day1')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  startDayChoice === 'day1'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-slate-200">
                  <span>День 1 (Понедельник)</span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal mt-1 leading-snug">
                  С самого начала первой недели (без привязки к дню недели)
                </div>
              </button>
            </div>
          </div>

          {/* Household members */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Кто живёт в квартире (2 партнёра):</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Партнёр 1</label>
                <input
                  type="text"
                  value={partner1Name}
                  onChange={(e) => setPartner1Name(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                  placeholder="Имя (напр. Денис)"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Партнёр 2</label>
                <input
                  type="text"
                  value={partner2Name}
                  onChange={(e) => setPartner2Name(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white"
                  placeholder="Имя (напр. Марина)"
                />
              </div>
            </div>
          </div>

          {/* Home Specs & Pets */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3.5">
            <div className="text-xs font-bold text-slate-300">
              Питомцы в квартире:
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPetType('none')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-all ${
                  petType === 'none'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>🚫</span>
                <span className="text-[11px] font-medium">Без питомцев</span>
              </button>

              <button
                type="button"
                onClick={() => setPetType('cat')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-all ${
                  petType === 'cat'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Cat className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-medium">Кошка / Кот</span>
              </button>

              <button
                type="button"
                onClick={() => setPetType('dog')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-all ${
                  petType === 'dog'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Dog className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-medium">Собака</span>
              </button>

              <button
                type="button"
                onClick={() => setPetType('both')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-all ${
                  petType === 'both'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>🐱🐶</span>
                <span className="text-[11px] font-medium">И кот, и собака</span>
              </button>
            </div>

            <div className="text-xs font-bold text-slate-300 pt-1">
              Оснащение и зоны:
            </div>

            {/* Toggle badges */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHasRobot(!hasRobot)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium cursor-pointer transition-all ${
                  hasRobot
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Робот-пылесос</span>
                {hasRobot && <Check className="w-3.5 h-3.5 ml-auto text-cyan-400" />}
              </button>

              <button
                type="button"
                onClick={() => setHasDishwasher(!hasDishwasher)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium cursor-pointer transition-all ${
                  hasDishwasher
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4 text-cyan-400" />
                <span>Посудомойка</span>
                {hasDishwasher && <Check className="w-3.5 h-3.5 ml-auto text-cyan-400" />}
              </button>

              <button
                type="button"
                onClick={() => setHasBalcony(!hasBalcony)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium cursor-pointer transition-all ${
                  hasBalcony
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>🪴</span>
                <span>Балкон</span>
                {hasBalcony && <Check className="w-3.5 h-3.5 ml-auto text-cyan-400" />}
              </button>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400">Ванная:</span>
                <select
                  value={bathType}
                  onChange={(e) => setBathType(e.target.value as ApartmentConfig['bathType'])}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="both" className="bg-slate-900">Ванна + душ</option>
                  <option value="bath" className="bg-slate-900">Ванна</option>
                  <option value="shower" className="bg-slate-900">Душевая</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Создать квартиру и заселиться</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
