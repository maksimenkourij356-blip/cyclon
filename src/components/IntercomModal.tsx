import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Delete, 
  PhoneCall, 
  Building2, 
  KeyRound, 
  ShieldAlert, 
  Sparkles, 
  UserPlus, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Lock,
  Search,
  Dices,
  LogOut,
  Hash,
  AtSign,
  History,
  MessageSquare
} from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { Apartment, ApartmentConfig, SystemConfig, DutyMessageSubject } from '../types';
import { 
  authorizeApartment, 
  getPreviousSessionApartmentId, 
  savePreviousSessionApartmentId, 
  clearPreviousSession,
  getNextAvailableApartmentNumber 
} from '../utils/storage';

interface IntercomModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartments: Apartment[];
  onSelectApartment: (apt: Apartment) => void;
  onCreateApartment: (newApt: Partial<Apartment>) => void;
  targetApartment?: Apartment | null;
  onClearTargetApartment?: () => void;
  onOpenStarosta?: () => void;
  onOpenContactDuty?: (aptNumber?: number, subject?: DutyMessageSubject) => void;
  systemConfig?: SystemConfig;
}

export const IntercomModal: React.FC<IntercomModalProps> = ({
  isOpen,
  onClose,
  apartments,
  onSelectApartment,
  onCreateApartment,
  targetApartment = null,
  onClearTargetApartment,
  onOpenStarosta,
  onOpenContactDuty,
  systemConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'dial' | 'create'>('dial');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [callingState, setCallingState] = useState<'idle' | 'calling' | 'opened'>('idle');
  const [selectedTarget, setSelectedTarget] = useState<Apartment | null>(targetApartment || null);
  const [loginInput, setLoginInput] = useState('');
  const [previousSessionId, setPreviousSessionId] = useState<string | null>(getPreviousSessionApartmentId());

  // Multi-step creation: step 1 = basic info, step 2 = apartment configuration survey
  const [createStep, setCreateStep] = useState<1 | 2>(1);

  // Auto-calculated apartment number for new registration
  const nextApartmentNumber = useMemo(() => getNextAvailableApartmentNumber(apartments), [apartments]);

  // Form state for creating new apartment
  const [formFamily, setFormFamily] = useState('');
  const [formHandle, setFormHandle] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formMember1, setFormMember1] = useState('');
  const [formMember2, setFormMember2] = useState('');

  // Configuration survey state
  const [surveyPet, setSurveyPet] = useState<ApartmentConfig['petType']>('cat');
  const [surveyRobot, setSurveyRobot] = useState<boolean>(true);
  const [surveyDishwasher, setSurveyDishwasher] = useState<boolean>(true);
  const [surveyBalcony, setSurveyBalcony] = useState<boolean>(false);
  const [surveyBath, setSurveyBath] = useState<ApartmentConfig['bathType']>('bath');

  // Refresh previous session ID whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviousSessionId(getPreviousSessionApartmentId());
      setCode('');
      setErrorMsg('');
      setCallingState('idle');
      if (targetApartment) {
        setSelectedTarget(targetApartment);
      }
    }
  }, [isOpen, targetApartment]);

  // Auto transliterate family name to login handle if handle is empty or untouched
  const handleFamilyChange = (val: string) => {
    setFormFamily(val);
    const translit: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
      з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
      п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
      ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
    };
    const suggested = val
      .toLowerCase()
      .split('')
      .map((c) => translit[c] || c)
      .join('')
      .replace(/[^a-z0-9]/g, '');
    setFormHandle(suggested);
  };

  // Generate random 4-digit PIN for new apartment
  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormPin(randomPin);
    soundEffects.playKeypadTone('call');
  };

  // Physical keyboard listener for digits 0-9, Backspace, Enter
  useEffect(() => {
    if (!isOpen || activeTab !== 'dial' || callingState !== 'idle') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in the login input box
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT') return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCall();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, callingState, code, selectedTarget]);

  if (!isOpen) return null;

  const previousSessionApt = apartments.find((a) => a.id === previousSessionId) || null;

  const handleDigit = (digit: string) => {
    if (callingState !== 'idle') return;
    // Exactly 4 digits limit!
    if (code.length >= 4) return;

    soundEffects.playKeypadTone(digit);
    setErrorMsg('');
    const newCode = code + digit;
    setCode(newCode);

    // If 4 digits reached, auto-verify if an apartment is targeted
    if (newCode.length === 4 && selectedTarget) {
      verifyCode(newCode, selectedTarget);
    }
  };

  const handleBackspace = () => {
    if (callingState !== 'idle') return;
    soundEffects.playKeypadTone('clear');
    setCode((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    soundEffects.playKeypadTone('clear');
    setCode('');
    setErrorMsg('');
  };

  const verifyCode = (codeToVerify: string, targetApt: Apartment) => {
    setCallingState('calling');

    setTimeout(() => {
      if (codeToVerify === targetApt.pinCode) {
        soundEffects.playDoorOpen();
        authorizeApartment(targetApt.id);
        savePreviousSessionApartmentId(targetApt.id);
        setPreviousSessionId(targetApt.id);
        setCallingState('opened');

        setTimeout(() => {
          onSelectApartment(targetApt);
          setCallingState('idle');
          setCode('');
          if (onClearTargetApartment) onClearTargetApartment();
          onClose();
        }, 900);
      } else {
        setCallingState('idle');
        setErrorMsg(`Неверный PIN-код для кв. ${targetApt.apartmentNumber}! Попробуйте снова 🚫`);
        setCode('');
      }
    }, 450);
  };

  const handleCall = () => {
    if (code.length !== 4) {
      setErrorMsg('Наберите ровно 4 цифры PIN-кода');
      return;
    }

    soundEffects.playKeypadTone('call');

    // Case 0: Master PIN for Starosta cabinet
    const starostaMasterPin = systemConfig?.starostaPin || '7777';
    if (code === starostaMasterPin) {
      soundEffects.playVictory();
      setCode('');
      setErrorMsg('');
      onClose();
      if (onOpenStarosta) onOpenStarosta();
      return;
    }

    // Case 1: Specific apartment targeted
    if (selectedTarget) {
      verifyCode(code, selectedTarget);
      return;
    }

    // Case 2: General dial without pre-selected apartment - check if code matches any apartment PIN
    const match = apartments.find((a) => a.pinCode === code);
    if (match) {
      verifyCode(code, match);
      return;
    }

    // Check if code matches an apartment number
    const numMatch = apartments.find((a) => a.apartmentNumber.toString() === code);
    if (numMatch) {
      setSelectedTarget(numMatch);
      setCode('');
      setErrorMsg(`Кв. ${numMatch.apartmentNumber} (${numMatch.familyTitle}) найдена. Введите её 4-значный PIN:`);
      return;
    }

    setErrorMsg(`PIN [${code}] не совпадает ни с одной квартирой. Выберите логин или номер выше.`);
    setCode('');
  };

  // Instant login via previous session
  const handleSelectPreviousSession = (apt: Apartment) => {
    soundEffects.playDoorOpen();
    authorizeApartment(apt.id);
    savePreviousSessionApartmentId(apt.id);
    setCallingState('opened');
    setTimeout(() => {
      onSelectApartment(apt);
      setCallingState('idle');
      if (onClearTargetApartment) onClearTargetApartment();
      onClose();
    }, 400);
  };

  // Clear previous session so user can test "Если ее нет"
  const handleClearSession = () => {
    clearPreviousSession();
    setPreviousSessionId(null);
    setSelectedTarget(null);
    setCode('');
    setErrorMsg('');
  };

  // Handle selecting or submitting an apartment by login/number
  const handleSelectByLoginOrNumber = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginInput.trim()) return;

    const query = loginInput.trim().toLowerCase();
    const match = apartments.find(
      (a) =>
        a.handle.toLowerCase() === query ||
        a.apartmentNumber.toString() === query ||
        a.familyTitle.toLowerCase() === query
    );

    if (match) {
      setSelectedTarget(match);
      setLoginInput('');
      setCode('');
      setErrorMsg('');
    } else {
      setErrorMsg(`Квартира с логином или номером «${loginInput}» не найдена в доме.`);
    }
  };

  const handleGoToSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFamily.trim() || !formMember1.trim() || !formMember2.trim()) {
      setErrorMsg('Пожалуйста, укажите фамилию и имена обоих партнёров');
      return;
    }
    const pinToUse = formPin.trim();
    if (pinToUse.length !== 4) {
      setErrorMsg('PIN-код должен состоять ровно из 4 цифр');
      return;
    }

    const testHandle = (formHandle.trim() || formFamily.toLowerCase().replace(/[^a-z0-9]/g, '')).toLowerCase();
    if (apartments.some((a) => a.handle.toLowerCase() === testHandle)) {
      setErrorMsg(`Логин @${testHandle} уже занят в доме. Выберите другой логин.`);
      return;
    }

    setErrorMsg('');
    setCreateStep(2);
  };

  const handleSubmitNewApt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFamily.trim() || !formMember1.trim() || !formMember2.trim()) {
      setErrorMsg('Пожалуйста, заполните все обязательные поля');
      setCreateStep(1);
      return;
    }

    const pin = formPin.trim().padStart(4, '0');
    let handle = formHandle.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || formFamily.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (apartments.some((a) => a.handle.toLowerCase() === handle.toLowerCase())) {
      handle = `${handle}${nextApartmentNumber}`;
    }

    const newConfig: ApartmentConfig = {
      petType: surveyPet,
      hasRobotVacuum: surveyRobot,
      hasDishwasher: surveyDishwasher,
      hasBalcony: surveyBalcony,
      bathType: surveyBath,
    };

    const newAptId = `apt-${nextApartmentNumber}-${Date.now()}`;

    onCreateApartment({
      id: newAptId,
      familyTitle: formFamily.trim(),
      handle,
      apartmentNumber: nextApartmentNumber, // AUTO-ASSIGNED
      pinCode: pin,
      config: newConfig,
      members: [
        {
          id: `member-${Date.now()}-1`,
          name: formMember1.trim(),
          avatar: '🧑',
          roleTitle: 'Новосел',
          totalPoints: 0,
          completedTasksCount: 0,
          streakDays: 1,
          currentLevel: 'Новичок',
          disgustBreakdown: { norm: 0, moderate: 0, fu: 0, extreme: 0 },
        },
        {
          id: `member-${Date.now()}-2`,
          name: formMember2.trim(),
          avatar: '👩',
          roleTitle: 'Новосел',
          totalPoints: 0,
          completedTasksCount: 0,
          streakDays: 1,
          currentLevel: 'Новичок',
          disgustBreakdown: { norm: 0, moderate: 0, fu: 0, extreme: 0 },
        },
      ],
    });

    // Authorize & save as active and previous session
    authorizeApartment(newAptId);
    savePreviousSessionApartmentId(newAptId);
    soundEffects.playDoorOpen();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl shadow-cyan-950/40 overflow-hidden text-slate-100 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  ДОМОФОН ЖК <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">ЦИКЛON</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Авторизация по логину квартиры и 4-значному PIN-коду
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onOpenStarosta && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStarosta();
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-slate-700/60 hover:bg-slate-500 transition-colors opacity-30 hover:opacity-90 cursor-pointer mr-1"
                  aria-label="Сервисный вход"
                  title=""
                />
              )}
              <button
                onClick={() => {
                  if (onClearTargetApartment) onClearTargetApartment();
                  onClose();
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 border-b border-slate-800 text-xs font-medium">
            <button
              onClick={() => {
                setActiveTab('dial');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'dial'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Вход по PIN
            </button>
            <button
              onClick={() => {
                setActiveTab('create');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Новая квартира
            </button>
          </div>

          {activeTab === 'dial' ? (
            <div className="p-5 space-y-4">
              {/* Target Apartment Selector or Search by Login / Apartment Number */}
              {selectedTarget ? (
                <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold font-mono text-xs">
                      {selectedTarget.apartmentNumber}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Кв. {selectedTarget.apartmentNumber} ({selectedTarget.familyTitle})</span>
                        <Lock className="w-3 h-3 text-amber-400" />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Логин: <span className="font-mono text-cyan-300">@{selectedTarget.handle}</span> · Наберите 4 цифры PIN
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTarget(null);
                      if (onClearTargetApartment) onClearTargetApartment();
                      setCode('');
                      setErrorMsg('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Сменить
                  </button>
                </div>
              ) : (
                /* Login / Apartment Number input if no target selected */
                <div className="space-y-2">
                  <form onSubmit={handleSelectByLoginOrNumber} className="relative">
                    <div className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <AtSign className="w-3 h-3 text-cyan-400" />
                        Введите логин или номер квартиры:
                      </span>
                      <span className="text-[10px] text-slate-400">например, krasikovs или 101</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Логин или номер..."
                          value={loginInput}
                          onChange={(e) => {
                            setLoginInput(e.target.value);
                            setErrorMsg('');
                          }}
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-750 focus:border-cyan-500 focus:outline-none text-xs text-white placeholder-slate-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!loginInput.trim()}
                        className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Далее</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </form>

                  {/* Quick Apartment Chips */}
                  <div className="pt-1">
                    <div className="text-[10px] text-slate-400 mb-1">Или выберите зарегистрированную квартиру:</div>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                      {apartments.map((apt) => (
                        <button
                          key={apt.id}
                          type="button"
                          onClick={() => {
                            setSelectedTarget(apt);
                            setCode('');
                            setErrorMsg('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-750 hover:border-cyan-500/50 text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span className="font-mono font-bold text-cyan-400">№{apt.apartmentNumber}</span>
                          <span>{apt.familyTitle}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Intercom Digital Screen with 4 Plain (Unhidden) Digits */}
              <div className="relative p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-inner overflow-hidden">
                <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-cyan-400/80 mb-1.5">
                  <span>
                    {selectedTarget 
                      ? `КВ. ${selectedTarget.apartmentNumber} · ВВОД 4-ЗНАЧНОГО PIN` 
                      : 'ПАНЕЛЬ ДОМОФОНА · 4 ЗНАКА'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ON-LINE
                  </span>
                </div>

                <div className="py-2 flex flex-col items-center justify-center">
                  {callingState === 'calling' ? (
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="text-cyan-300 font-mono text-lg font-bold tracking-widest flex items-center gap-2"
                    >
                      <PhoneCall className="w-5 h-5 text-cyan-400 animate-bounce" />
                      ПРОВЕРКА PIN-КОДА...
                    </motion.div>
                  ) : callingState === 'opened' ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-emerald-400 font-mono text-lg font-bold tracking-wider flex items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      ДОСТУП РАЗРЕШЁН!
                    </motion.div>
                  ) : (
                    /* 4 Distinct Digital Slots, unhidden plain text */
                    <div className="flex items-center justify-center gap-2.5 my-1">
                      {[0, 1, 2, 3].map((idx) => {
                        const digit = code[idx];
                        const isCurrentSlot = code.length === idx;
                        return (
                          <div
                            key={idx}
                            className={`w-12 h-14 rounded-2xl flex items-center justify-center text-3xl font-mono font-extrabold transition-all ${
                              digit
                                ? 'bg-cyan-500/15 text-cyan-300 border-2 border-cyan-400 shadow-md shadow-cyan-900/30'
                                : isCurrentSlot
                                ? 'bg-slate-900 text-cyan-400/70 border-2 border-cyan-500/60 animate-pulse'
                                : 'bg-slate-900/60 text-slate-700 border border-slate-800'
                            }`}
                          >
                            {digit ? (
                              <span>{digit}</span>
                            ) : isCurrentSlot ? (
                              <span className="text-xl text-cyan-400">_</span>
                            ) : (
                              <span className="text-xl text-slate-700">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-rose-400 bg-rose-950/50 py-1.5 px-2.5 rounded-lg border border-rose-800/50 text-center">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Physical Metallic Keypad (Exactly 4 digits allowed) */}
              <div className="grid grid-cols-3 gap-2 max-w-[270px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleDigit(digit)}
                    disabled={code.length >= 4 || callingState !== 'idle'}
                    className="h-12 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 hover:from-slate-750 hover:to-slate-800 active:scale-95 disabled:opacity-50 border border-slate-700/80 shadow-sm font-mono text-xl font-bold text-slate-100 flex items-center justify-center transition-all cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                {/* Clear / Backspace Button */}
                <button
                  onClick={handleBackspace}
                  disabled={callingState !== 'idle'}
                  className="h-12 rounded-2xl bg-slate-850 hover:bg-slate-800 active:scale-95 border border-slate-700/80 text-amber-400 text-xs font-bold uppercase tracking-wider flex flex-col items-center justify-center transition-all cursor-pointer"
                  title="Удалить последний знак"
                >
                  <Delete className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">Сброс</span>
                </button>
                {/* Zero */}
                <button
                  onClick={() => handleDigit('0')}
                  disabled={code.length >= 4 || callingState !== 'idle'}
                  className="h-12 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 hover:from-slate-750 hover:to-slate-800 active:scale-95 disabled:opacity-50 border border-slate-700/80 shadow-sm font-mono text-xl font-bold text-slate-100 flex items-center justify-center transition-all cursor-pointer"
                >
                  0
                </button>
                {/* Call Button (Enter) */}
                <button
                  onClick={handleCall}
                  disabled={code.length !== 4 || callingState !== 'idle'}
                  className="h-12 rounded-2xl bg-gradient-to-b from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 active:scale-95 disabled:opacity-40 border border-cyan-400/40 shadow-lg shadow-cyan-900/30 text-white font-bold flex flex-col items-center justify-center transition-all cursor-pointer"
                  title="Проверить PIN и войти"
                >
                  <PhoneCall className="w-3.5 h-3.5 mb-0.5" />
                  <span className="text-[10px] font-mono tracking-wider">ВЫЗОВ</span>
                </button>
              </div>

              {/* Contact Duty Officer Link */}
              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenContactDuty) {
                      onOpenContactDuty(selectedTarget?.apartmentNumber, 'forgot_pin');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Забыли PIN-код? Написать дежурному</span>
                </button>
              </div>

              {/* Highlighted Previous Session Card at the Bottom */}
              <div className="pt-2 border-t border-slate-800">
                {previousSessionApt ? (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border-2 border-cyan-500/50 shadow-lg shadow-cyan-950/40">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Предыдущая сессия на этом устройстве
                      </span>
                      <button
                        onClick={handleClearSession}
                        className="text-slate-400 hover:text-rose-400 text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                        title="Забыть сессию для проверки входа"
                      >
                        <LogOut className="w-3 h-3" />
                        Сменить
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          {previousSessionApt.apartmentNumber}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate">
                            Кв. {previousSessionApt.apartmentNumber} · {previousSessionApt.familyTitle}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            Логин: <span className="text-cyan-300 font-mono">@{previousSessionApt.handle}</span> · {previousSessionApt.members.map((m) => m.name).join(' & ')}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectPreviousSession(previousSessionApt)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1 shadow-md transition-all cursor-pointer"
                      >
                        <span>Войти сразу</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Нет сохранённой сессии. Наберите логин или номер выше и введите 4-значный PIN.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Create Apartment Multi-Step Wizard */
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Step indicator */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      createStep === 1
                        ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    1
                  </span>
                  <span className={createStep === 1 ? 'text-white font-semibold' : 'text-slate-400'}>
                    Семья и PIN
                  </span>
                  <span className="text-slate-600">→</span>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      createStep === 2
                        ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    2
                  </span>
                  <span className={createStep === 2 ? 'text-white font-semibold' : 'text-slate-400'}>
                    Опрос быта
                  </span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">Шаг {createStep}/2</span>
              </div>

              {createStep === 1 ? (
                /* Step 1: Base details with AUTO-ASSIGNED apartment number */
                <form onSubmit={handleGoToSurvey} className="space-y-3.5">
                  {/* Auto-assigned apartment number badge */}
                  <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                        Номер квартиры в ЖК
                      </div>
                      <div className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
                        <Hash className="w-4 h-4 text-cyan-400" />
                        <span>Квартира № {nextApartmentNumber}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Присвоен автоматически
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Фамилия или название семьи *
                    </label>
                    <input
                      type="text"
                      placeholder="Например: Ивановы"
                      value={formFamily}
                      onChange={(e) => handleFamilyChange(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs text-white placeholder-slate-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Логин для входа *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">@</span>
                        <input
                          type="text"
                          placeholder="ivanovy"
                          value={formHandle}
                          onChange={(e) => setFormHandle(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                          className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs text-white font-mono placeholder-slate-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                          PIN (4 знака) *
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateRandomPin}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          title="Сгенерировать случайный PIN"
                        >
                          <Dices className="w-3 h-3" />
                          Случайный
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Напр: 4591"
                        value={formPin}
                        onChange={(e) => setFormPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs text-cyan-300 font-mono font-bold tracking-widest text-center placeholder-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Партнёр 1 (имя) *
                      </label>
                      <input
                        type="text"
                        placeholder="Алексей"
                        value={formMember1}
                        onChange={(e) => setFormMember1(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs text-white placeholder-slate-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Партнёр 2 (имя) *
                      </label>
                      <input
                        type="text"
                        placeholder="Валерия"
                        value={formMember2}
                        onChange={(e) => setFormMember2(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:outline-none text-xs text-white placeholder-slate-500"
                        required
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
                      {errorMsg}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 cursor-pointer"
                    >
                      <span>Далее: опрос условий быта</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Configuration survey */
                <form onSubmit={handleSubmitNewApt} className="space-y-3.5">
                  <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    Отметьте бытовые условия кв. № {nextApartmentNumber} для формирования цикла задач:
                  </div>

                  {/* Pets */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Домашние животные
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'cat', title: '🐱 Кошка', desc: 'Лоток, чесалка' },
                        { id: 'dog', title: '🐕 Собака', desc: 'Мытьё лап, лежанка' },
                        { id: 'both', title: '🐾 Кот и Пёс', desc: 'Полный уход' },
                        { id: 'none', title: '🌿 Без питомцев', desc: 'Исключить' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSurveyPet(p.id as any)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            surveyPet === p.id
                              ? 'bg-cyan-500/15 border-cyan-500 text-white font-semibold shadow-sm'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="text-xs">{p.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Appliances */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                      Техника и планировка
                    </label>

                    {/* Robot Vacuum */}
                    <div
                      onClick={() => setSurveyRobot(!surveyRobot)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        surveyRobot
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-xs">
                        <div className="font-semibold">🤖 Робот-пылесос</div>
                        <div className="text-[10px] text-slate-400">
                          {surveyRobot ? 'Очистка базы и щеток' : 'Традиционный ручной пылесос'}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        surveyRobot ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700'
                      }`}>
                        {surveyRobot && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Dishwasher */}
                    <div
                      onClick={() => setSurveyDishwasher(!surveyDishwasher)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        surveyDishwasher
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-xs">
                        <div className="font-semibold">🫧 Посудомоечная машина (ПММ)</div>
                        <div className="text-[10px] text-slate-400">
                          {surveyDishwasher ? 'Промывка фильтра и запуск' : 'Ручная сушилка для посуды'}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        surveyDishwasher ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700'
                      }`}>
                        {surveyDishwasher && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Balcony */}
                    <div
                      onClick={() => setSurveyBalcony(!surveyBalcony)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        surveyBalcony
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-xs">
                        <div className="font-semibold">🪴 Балкон или лоджия</div>
                        <div className="text-[10px] text-slate-400">
                          {surveyBalcony ? 'Сезонная чистка остекления' : 'Балкон отсутствует'}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        surveyBalcony ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700'
                      }`}>
                        {surveyBalcony && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  {/* Bath type */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Тип санузла
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'bath', title: '🛁 Ванна' },
                        { id: 'shower', title: '🚿 Душ' },
                        { id: 'both', title: '✨ Оба типа' },
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSurveyBath(b.id as any)}
                          className={`p-2 rounded-xl text-center border text-xs transition-all cursor-pointer ${
                            surveyBath === b.id
                              ? 'bg-cyan-500/15 border-cyan-500 text-white font-semibold'
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {b.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCreateStep(1)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Назад</span>
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Создать кв. №{nextApartmentNumber} и войти</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
