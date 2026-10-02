import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Sparkles, 
  DoorOpen, 
  PhoneCall, 
  Heart,
  Flame,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  KeyRound,
  X,
  Calendar,
  Scale,
  Award,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Apartment, CleaningTask, HouseholdMember, DutyMessage, DutyMessageSubject } from './types';
import { 
  loadApartments, 
  saveApartments, 
  getActiveApartmentId, 
  setActiveApartmentId, 
  getActiveMemberId, 
  setActiveMemberId,
  getAuthorizedApartmentIds,
  authorizeApartment,
  deauthorizeApartment,
  savePreviousSessionApartmentId,
  clearPreviousSession,
  getPreviousSessionApartmentId
} from './utils/storage';
import { calculateLevel } from './data/initialData';
import { soundEffects } from './utils/audio';

import { IntercomModal } from './components/IntercomModal';
import { BuildingLobby } from './components/BuildingLobby';
import { ApartmentHeader } from './components/ApartmentHeader';
import { TodayTasks } from './components/TodayTasks';
import { CycleCalendar } from './components/CycleCalendar';
import { BalanceAndStats } from './components/BalanceAndStats';
import { BadgesAndStreaks } from './components/BadgesAndStreaks';
import { DebtsList } from './components/DebtsList';
import { CleaningTimerModal } from './components/CleaningTimerModal';
import { TelegramShareModal } from './components/TelegramShareModal';
import { ApartmentConfigModal } from './components/ApartmentConfigModal';
import { TransferTaskModal } from './components/TransferTaskModal';
import { UserGuide } from './components/UserGuide';
import { StarostaModal } from './components/StarostaModal';
import { ContactDutyModal } from './components/ContactDutyModal';
import { DEFAULT_KRASIKOVS_CONFIG, generateTasksForConfig, generateBadgesForConfig } from './data/taskGenerator';
import { evaluateBadgesOnTaskComplete } from './utils/badgeEngine';
import { ApartmentConfig, SystemConfig } from './types';
import { INITIAL_APARTMENTS } from './data/initialData';
import { 
  subscribeToCloudApartments, 
  syncApartmentToCloud, 
  deleteApartmentFromCloud, 
  deleteAllApartmentsFromCloud,
  restoreDemoApartmentsToCloud,
  seedCloudIfEmpty, 
  subscribeToSystemConfig, 
  saveSystemConfig, 
  DEFAULT_SYSTEM_CONFIG,
  subscribeToDutyMessages,
  sendDutyMessageToCloud,
  updateDutyMessageInCloud,
  deleteDutyMessageFromCloud
} from './utils/firebase';
import { 
  advanceApartmentDay, 
  checkApartmentDayAutoAdvance, 
  getLocalTodayDateString,
  getCurrentRealDayOfWeek
} from './utils/dayCycle';

export default function App() {
  const [apartments, setApartments] = useState<Apartment[]>(() => loadApartments());
  const [authorizedAptIds, setAuthorizedAptIds] = useState<string[]>(() => getAuthorizedApartmentIds());
  const [activeAptId, setActiveAptIdState] = useState<string>(() => {
    const prev = getPreviousSessionApartmentId();
    const authorized = getAuthorizedApartmentIds();
    if (prev && authorized.includes(prev)) {
      return prev;
    }
    const active = getActiveApartmentId();
    if (active && authorized.includes(active)) {
      return active;
    }
    return '';
  });
  const [activeMemberId, setActiveMemberIdState] = useState<string>(() => {
    const prev = getPreviousSessionApartmentId();
    const authorized = getAuthorizedApartmentIds();
    const targetAptId = (prev && authorized.includes(prev)) ? prev : getActiveApartmentId();
    return targetAptId ? getActiveMemberId(targetAptId) : '';
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);

  const [currentView, setCurrentView] = useState<'lobby' | 'apartment' | 'guide'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('apt') || params.get('code')) {
        return 'apartment';
      }
    }
    const prev = getPreviousSessionApartmentId();
    const authorized = getAuthorizedApartmentIds();
    if (prev && authorized.includes(prev)) {
      return 'apartment';
    }
    return 'lobby';
  });
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'balance' | 'badges' | 'debts'>('today');

  // Modals state
  const [isIntercomOpen, setIsIntercomOpen] = useState(false);
  const [isStarostaOpen, setIsStarostaOpen] = useState(false);
  const [targetApartmentForIntercom, setTargetApartmentForIntercom] = useState<Apartment | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isContactDutyOpen, setIsContactDutyOpen] = useState(false);
  const [contactDutyAptNum, setContactDutyAptNum] = useState<number | null>(null);
  const [contactDutySubject, setContactDutySubject] = useState<DutyMessageSubject>('forgot_pin');
  const [dutyMessages, setDutyMessages] = useState<DutyMessage[]>([]);
  const [timerTask, setTimerTask] = useState<CleaningTask | null>(null);
  const [taskToTransfer, setTaskToTransfer] = useState<CleaningTask | null>(null);
  const [daySwitchToast, setDaySwitchToast] = useState<{
    message: string;
    debtsCount: number;
    targetDay: number;
    missedRituals?: string[];
    allRitualsDone?: boolean;
  } | null>(null);

  const [ritualPraiseToast, setRitualPraiseToast] = useState<{
    memberName: string;
    taskTitle: string;
    points?: number;
    message: string;
    icon: string;
    subtitle?: string;
  } | null>(null);

  // Active apartment & active member objects
  const activeApartment = apartments.find((a) => a.id === activeAptId) || null;
  const isAuthorizedInActiveApartment = activeApartment ? authorizedAptIds.includes(activeApartment.id) : false;
  const activeMember =
    activeApartment?.members?.find((m) => m.id === activeMemberId) ||
    activeApartment?.members?.[0] ||
    null;
  const otherMember =
    activeApartment?.members?.find((m) => m.id !== activeMember?.id) ||
    activeApartment?.members?.[1] ||
    activeMember;

  // Sync to storage
  useEffect(() => {
    saveApartments(apartments);
  }, [apartments]);

  // Real-time synchronization with Firebase Cloud Firestore
  useEffect(() => {
    // Seed initial apartments if cloud is newly provisioned
    seedCloudIfEmpty().catch(console.warn);

    // Subscribe to cloud apartments in real-time
    const unsubscribeApts = subscribeToCloudApartments((cloudApts) => {
      setIsCloudLoaded(true);
      if (cloudApts !== undefined && cloudApts !== null) {
        setApartments(cloudApts);
        saveApartments(cloudApts);
        if (cloudApts.length === 0) {
          setActiveAptIdState('');
          setCurrentView('lobby');
        }
      }
    });

    // Subscribe to Starosta / system config
    const unsubscribeConfig = subscribeToSystemConfig((cfg) => {
      setSystemConfig(cfg);
    });

    // Subscribe to resident duty messages in real-time
    const unsubscribeMessages = subscribeToDutyMessages((msgs) => {
      setDutyMessages(msgs);
    });

    return () => {
      unsubscribeApts();
      unsubscribeConfig();
      unsubscribeMessages();
    };
  }, []);

  // Automatic day advancement across calendar days (midnight check & periodic poll)
  useEffect(() => {
    if (!isCloudLoaded) return;

    const runAutoAdvanceCheck = () => {
      setApartments((prevApts) => {
        let anyChanged = false;
        const updatedApts = prevApts.map((apt) => {
          const res = checkApartmentDayAutoAdvance(apt);
          if (res.shouldUpdate) {
            anyChanged = true;
            syncApartmentToCloud(res.updatedApt);

            // If active apartment advanced to a new day, celebrate & inform user
            if (apt.id === activeAptId && res.advanced) {
              soundEffects.playVictory();
              setDaySwitchToast({
                message: `Наступил новый день (День ${res.updatedApt.cycleDay} цикла)! Ежедневные рутины сброшены, вчерашние незакрытые задачи перенесены в долги без штрафов 🕊️`,
                debtsCount: res.movedCount,
                targetDay: res.updatedApt.cycleDay,
                missedRituals: res.missedRitualMessages,
                allRitualsDone: res.missedRitualMessages.length === 0,
              });
              setTimeout(() => {
                setDaySwitchToast(null);
              }, 8000);
            }
            return res.updatedApt;
          }
          return apt;
        });

        return anyChanged ? updatedApts : prevApts;
      });
    };

    // Run on initial load
    runAutoAdvanceCheck();

    // Check periodically (every 30s) so if the tab is left open past midnight, it advances seamlessly
    const intervalId = setInterval(runAutoAdvanceCheck, 30000);

    // Also check on tab refocus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runAutoAdvanceCheck();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeAptId]);

  // If active apartment ID is set but was deleted or is not authorized, clear it and redirect to lobby
  useEffect(() => {
    if (activeAptId) {
      const found = apartments.find((a) => a.id === activeAptId);
      const isAuth = authorizedAptIds.includes(activeAptId);
      if (!found || !isAuth) {
        setActiveAptIdState('');
        setActiveApartmentId('');
        if (currentView === 'apartment') {
          setCurrentView('lobby');
        }
      }
    }
  }, [apartments, activeAptId, authorizedAptIds, currentView]);

  // Handle URL query parameters (?apt=101&pin=1111 or ?apt=101)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const aptParam = params.get('apt');
      const pinParam = params.get('pin') || params.get('code');

      if (aptParam) {
        const found = apartments.find(
          (a) =>
            a.apartmentNumber.toString() === aptParam ||
            a.pinCode === aptParam ||
            (pinParam && a.handle.toLowerCase() === pinParam.toLowerCase())
        );

        if (found) {
          // If valid PIN is supplied in link, directly authorize partner
          if (pinParam && found.pinCode === pinParam) {
            authorizeApartment(found.id);
            setAuthorizedAptIds(getAuthorizedApartmentIds());
            savePreviousSessionApartmentId(found.id);
            setActiveAptIdState(found.id);
            setActiveApartmentId(found.id);
            if (found.members?.length > 0) {
              setActiveMemberIdState(found.members[0].id);
              setActiveMemberId(found.id, found.members[0].id);
            }
            setCurrentView('apartment');
            // Clean up the URL query to avoid leaving secret PIN in address bar
            try {
              window.history.replaceState({}, '', window.location.pathname);
            } catch {
              // ignore
            }
          } else {
            // Target the apartment and prompt for PIN via intercom
            setTargetApartmentForIntercom(found);
            setIsIntercomOpen(true);
          }
        }
      }
    }
  }, [apartments]);

  const handleAttemptEnterApartment = (apt: Apartment) => {
    setTargetApartmentForIntercom(apt);
    setIsIntercomOpen(true);
  };

  const handleSelectApartment = (apt: Apartment) => {
    authorizeApartment(apt.id);
    setAuthorizedAptIds(getAuthorizedApartmentIds());
    savePreviousSessionApartmentId(apt.id);
    setActiveAptIdState(apt.id);
    setActiveApartmentId(apt.id);
    if (apt.members.length > 0) {
      setActiveMemberIdState(apt.members[0].id);
      setActiveMemberId(apt.id, apt.members[0].id);
    }
    setCurrentView('apartment');
  };

  const handleLogoutApartment = (aptId: string) => {
    deauthorizeApartment(aptId);
    clearPreviousSession();
    setAuthorizedAptIds(getAuthorizedApartmentIds());
    setActiveAptIdState('');
    setActiveApartmentId('');
    setCurrentView('lobby');
    soundEffects.playDoorClose();
  };

  const handleSwitchMember = (memberId: string) => {
    setActiveMemberIdState(memberId);
    setActiveMemberId(activeApartment.id, memberId);
  };

  const handleOpenContactDuty = (aptNumber?: number, subject?: DutyMessageSubject) => {
    setContactDutyAptNum(aptNumber ?? null);
    setContactDutySubject(subject ?? 'forgot_pin');
    setIsContactDutyOpen(true);
  };

  const handleSendDutyMessage = async (
    msgData: Omit<DutyMessage, 'id' | 'createdAt' | 'status'>
  ) => {
    const newMsg: DutyMessage = {
      ...msgData,
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'new',
    };
    setDutyMessages((prev) => [newMsg, ...prev]);
    await sendDutyMessageToCloud(newMsg);
  };

  const handleUpdateDutyMessage = async (id: string, updates: Partial<DutyMessage>) => {
    setDutyMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    await updateDutyMessageInCloud(id, updates);
  };

  const handleDeleteDutyMessage = async (id: string) => {
    setDutyMessages((prev) => prev.filter((m) => m.id !== id));
    await deleteDutyMessageFromCloud(id);
  };

  const handleCreateApartment = (
    newAptData: Partial<Apartment> & { 
      includeMissedDaysInDebts?: boolean;
      midWeekMode?: 'debts' | 'today' | 'fresh' | 'day1';
    }
  ) => {
    const config: ApartmentConfig = newAptData.config || DEFAULT_KRASIKOVS_CONFIG;
    const generatedTasks = generateTasksForConfig(config);
    const generatedBadges = generateBadgesForConfig(config, true); // new apartment starts with clean progress

    const aptId = newAptData.id || `apt-${newAptData.apartmentNumber || Date.now()}-${Date.now()}`;
    const todayStr = getLocalTodayDateString();
    const realDay = getCurrentRealDayOfWeek();
    const midWeekMode = newAptData.midWeekMode || (newAptData.includeMissedDaysInDebts ? 'debts' : 'debts');
    const targetCycleDay = midWeekMode === 'day1' ? 1 : (newAptData.cycleDay || realDay);

    const initialDebts: CleaningTask[] = [];
    let initialTasks = [...generatedTasks];

    if (midWeekMode === 'debts' && targetCycleDay > 1) {
      const missedTasks = generatedTasks.filter(
        (t) => t.category !== 'ritual' && t.dayOfCycle && t.dayOfCycle < targetCycleDay
      );
      missedTasks.forEach((t) => {
        initialDebts.push({
          ...t,
          id: `debt-${t.id}`,
          description: `${t.description} (с Дня ${t.dayOfCycle})`,
          status: 'available',
        });
      });
    } else if (midWeekMode === 'today' && targetCycleDay > 1) {
      initialTasks = initialTasks.map((t) => {
        if (t.category !== 'ritual' && t.dayOfCycle && t.dayOfCycle < targetCycleDay) {
          return {
            ...t,
            dayOfCycle: targetCycleDay,
            description: `${t.description} (с Дня ${t.dayOfCycle})`,
          };
        }
        return t;
      });
    }

    const newApt: Apartment = {
      id: aptId,
      handle: newAptData.handle || 'family',
      pinCode: newAptData.pinCode || '0100',
      apartmentNumber: newAptData.apartmentNumber || 100,
      floor: newAptData.floor || Math.max(1, Math.ceil((newAptData.apartmentNumber || 100) / 10)),
      familyTitle: newAptData.familyTitle || 'Новая семья',
      config,
      members: newAptData.members || [],
      cycleDay: targetCycleDay,
      cycleStartDate: todayStr,
      lastActiveCalendarDate: todayStr,
      coopTargetPoints: 1000,
      coopCurrentPoints: 0,
      coopRewardTitle: newAptData.coopRewardTitle || 'Семейный ужин / Отдых 🎉',
      tasks: initialTasks,
      debts: initialDebts,
      badges: generatedBadges,
      history: [],
      settings: { allowPwaPush: true, vacationMode: false },
    };

    authorizeApartment(newApt.id);
    setApartments((prev) => [newApt, ...prev]);
    syncApartmentToCloud(newApt);
    handleSelectApartment(newApt);
    setCurrentView('apartment');
  };

  const handlePullMissedTasksToToday = () => {
    if (!activeApartment) return;
    soundEffects.playTaskSuccess();
    const cycleDay = activeApartment.cycleDay;
    
    // Check if there are debts from earlier days of this cycle
    const earlierDebts = (activeApartment.debts || []).filter((d) => d.dayOfCycle && d.dayOfCycle < cycleDay);
    const remainingDebts = (activeApartment.debts || []).filter((d) => !d.dayOfCycle || d.dayOfCycle >= cycleDay);

    // Also check tasks from earlier days in tasks array
    let updatedTasks = activeApartment.tasks.map((t) => {
      if (t.category !== 'ritual' && t.dayOfCycle && t.dayOfCycle < cycleDay && t.status !== 'completed') {
        return {
          ...t,
          dayOfCycle: cycleDay,
          description: t.description.includes('(с Дня') ? t.description : `${t.description} (с Дня ${t.dayOfCycle})`,
        };
      }
      return t;
    });

    // Convert earlier debts into active tasks for today
    if (earlierDebts.length > 0) {
      earlierDebts.forEach((d) => {
        const originalId = d.id.replace('debt-', '');
        const existing = updatedTasks.find((t) => t.id === originalId);
        if (existing) {
          existing.dayOfCycle = cycleDay;
          existing.status = 'available';
        } else {
          updatedTasks.push({
            ...d,
            id: originalId,
            dayOfCycle: cycleDay,
            status: 'available',
          });
        }
      });
    }

    const updatedApt = {
      ...activeApartment,
      tasks: updatedTasks,
      debts: remainingDebts,
    };

    setApartments((prev) => prev.map((a) => (a.id === updatedApt.id ? updatedApt : a)));
    syncApartmentToCloud(updatedApt);
    setRitualPraiseToast({
      memberName: activeMember?.name || 'Жильцы',
      taskTitle: 'Задачи добавлены в Сегодня',
      points: 0,
      icon: '📥',
      message: `Задачи с начала недели успешно перенесены в сегодняшний список дел!`,
    });
  };

  const handleMoveMissedTasksToDebts = () => {
    if (!activeApartment) return;
    soundEffects.playTaskSuccess();
    const cycleDay = activeApartment.cycleDay;

    const missedTasks = activeApartment.tasks.filter(
      (t) => t.category !== 'ritual' && t.dayOfCycle && t.dayOfCycle < cycleDay && t.status !== 'completed'
    );
    const newDebts = [...(activeApartment.debts || [])];
    missedTasks.forEach((t) => {
      const debtId = `debt-${t.id}`;
      if (!newDebts.some((d) => d.id === debtId)) {
        newDebts.push({
          ...t,
          id: debtId,
          description: t.description.includes('(с Дня') ? t.description : `${t.description} (с Дня ${t.dayOfCycle})`,
          status: 'available',
        });
      }
    });

    const updatedApt = {
      ...activeApartment,
      debts: newDebts,
    };

    setApartments((prev) => prev.map((a) => (a.id === updatedApt.id ? updatedApt : a)));
    syncApartmentToCloud(updatedApt);
    setRitualPraiseToast({
      memberName: activeMember?.name || 'Жильцы',
      taskTitle: 'Задачи перенесены в Долги',
      points: 0,
      icon: '📦',
      message: `Задачи прошлых дней перенесены во вкладку «Долги» без штрафов.`,
    });
  };

  const handleSaveApartmentConfig = (newConfig: ApartmentConfig, regenerateTasks: boolean) => {
    soundEffects.playDoorOpen();
    let updatedTargetApt: Apartment | null = null;
    setApartments((prev) =>
      prev.map((apt) => {
        if (apt.id !== activeApartment.id) return apt;

        let updatedTasks = apt.tasks;
        let updatedBadges = apt.badges;

        if (regenerateTasks) {
          const freshTasks = generateTasksForConfig(newConfig);
          // Preserve completed/in_progress state if matching id exists
          updatedTasks = freshTasks.map((fresh) => {
            const existing = apt.tasks.find((t) => t.id === fresh.id);
            if (existing) {
              return {
                ...fresh,
                status: existing.status,
                takenBy: existing.takenBy,
                completedBy: existing.completedBy,
              };
            }
            return fresh;
          });
          updatedBadges = generateBadgesForConfig(newConfig);
        }

        const updated = {
          ...apt,
          config: newConfig,
          tasks: updatedTasks,
          badges: updatedBadges,
        };
        updatedTargetApt = updated;
        return updated;
      })
    );
    if (updatedTargetApt) {
      syncApartmentToCloud(updatedTargetApt);
    }
  };

  const handleImportApartmentData = (importedApt: Apartment) => {
    soundEffects.playTaskSuccess();
    setApartments((prev) => {
      const exists = prev.some((a) => a.id === importedApt.id);
      if (exists) {
        return prev.map((a) => (a.id === importedApt.id ? importedApt : a));
      }
      return [importedApt, ...prev];
    });
    syncApartmentToCloud(importedApt);
    handleSelectApartment(importedApt);
    setRitualPraiseToast({
      memberName: importedApt.familyTitle,
      taskTitle: 'Данные восстановлены',
      points: 0,
      icon: '📂',
      message: `Квартира № ${importedApt.apartmentNumber} (${importedApt.familyTitle}) успешно импортирована!`,
      subtitle: `Загружено очков: ${importedApt.coopCurrentPoints}, задач: ${importedApt.tasks.length}`,
    });
  };

  // Starosta (Admin) Handlers
  const handleStarostaUpdateApartment = async (updatedApt: Apartment) => {
    setApartments((prev) => prev.map((a) => (a.id === updatedApt.id ? updatedApt : a)));
    await syncApartmentToCloud(updatedApt);
  };

  const handleStarostaDeleteApartment = async (aptId: string) => {
    setApartments((prev) => {
      const remaining = prev.filter((a) => a.id !== aptId);
      saveApartments(remaining);
      if (activeAptId === aptId) {
        setActiveAptIdState('');
        setActiveApartmentId('');
        setCurrentView('lobby');
      }
      return remaining;
    });
    deauthorizeApartment(aptId);
    setAuthorizedAptIds(getAuthorizedApartmentIds());
    await deleteApartmentFromCloud(aptId);
  };

  const handleStarostaDeleteAllApartments = async () => {
    setApartments([]);
    saveApartments([]);
    setActiveAptIdState('');
    setActiveApartmentId('');
    setCurrentView('lobby');
    setAuthorizedAptIds([]);
    await deleteAllApartmentsFromCloud();
  };

  const handleStarostaRestoreDemoApartments = async () => {
    setApartments(INITIAL_APARTMENTS);
    saveApartments(INITIAL_APARTMENTS);
    await restoreDemoApartmentsToCloud();
  };

  const handleStarostaCreateApartment = async (newAptData: Partial<Apartment>) => {
    const config: ApartmentConfig = newAptData.config || DEFAULT_KRASIKOVS_CONFIG;
    const generatedTasks = generateTasksForConfig(config);
    const generatedBadges = generateBadgesForConfig(config, true);

    const aptId = newAptData.id || `apt-${newAptData.apartmentNumber || Date.now()}`;
    const newApt: Apartment = {
      id: aptId,
      handle: newAptData.handle || `apt${newAptData.apartmentNumber || Date.now()}`,
      pinCode: newAptData.pinCode || '1234',
      apartmentNumber: newAptData.apartmentNumber || 100,
      floor: newAptData.floor || Math.max(1, Math.ceil((newAptData.apartmentNumber || 100) / 10)),
      familyTitle: newAptData.familyTitle || 'Новая семья',
      config,
      members: newAptData.members || [],
      cycleDay: newAptData.cycleDay || getCurrentRealDayOfWeek(),
      cycleStartDate: getLocalTodayDateString(),
      lastActiveCalendarDate: getLocalTodayDateString(),
      coopTargetPoints: 1000,
      coopCurrentPoints: 0,
      coopRewardTitle: newAptData.coopRewardTitle || 'Семейный ужин / Отдых 🎉',
      tasks: generatedTasks,
      debts: (() => {
        const cDay = newAptData.cycleDay || getCurrentRealDayOfWeek();
        if (cDay <= 1) return [];
        return generatedTasks
          .filter((t) => t.category !== 'ritual' && t.dayOfCycle && t.dayOfCycle < cDay)
          .map((t) => ({
            ...t,
            id: `debt-${t.id}`,
            description: `${t.description} (с Дня ${t.dayOfCycle})`,
            status: 'available' as const,
          }));
      })(),
      badges: generatedBadges,
      history: [],
      settings: { allowPwaPush: true, vacationMode: false },
    };

    setApartments((prev) => [newApt, ...prev]);
    await syncApartmentToCloud(newApt);
  };

  const handleUpdateSystemConfig = async (newConfig: Partial<SystemConfig>) => {
    setSystemConfig((prev) => ({ ...prev, ...newConfig }));
    await saveSystemConfig(newConfig);
  };

  const handleStarostaSyncAll = async () => {
    for (const apt of apartments) {
      await syncApartmentToCloud(apt);
    }
  };

  // Task Actions
  const handleTakeTask = (task: CleaningTask) => {
    soundEffects.playKeypadTone('5');
    setApartments((prev) =>
      prev.map((apt) => {
        if (apt.id !== activeApartment.id) return apt;
        const updated = {
          ...apt,
          tasks: apt.tasks.map((t) => {
            if (t.id === task.id) {
              return { ...t, status: 'in_progress', takenBy: activeMember.id };
            }
            return t;
          }),
        };
        syncApartmentToCloud(updated);
        return updated;
      })
    );
  };

  const handlePassTask = (task: CleaningTask) => {
    soundEffects.playKeypadTone('8');
    setTaskToTransfer(task);
  };

  const handleConfirmTransferTask = (taskId: string, promiseText: string) => {
    soundEffects.playTaskSuccess();
    setApartments((prev) =>
      prev.map((apt) => {
        if (apt.id !== activeApartment.id) return apt;
        const updated = {
          ...apt,
          tasks: apt.tasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                status: 'in_progress',
                takenBy: otherMember.id,
                transferPromise: {
                  fromMemberId: activeMember.id,
                  fromMemberName: activeMember.name,
                  toMemberId: otherMember.id,
                  promiseText,
                  timestamp: new Date().toISOString(),
                },
              };
            }
            return t;
          }),
        };
        syncApartmentToCloud(updated);
        return updated;
      })
    );

    setRitualPraiseToast({
      memberName: activeMember.name,
      taskTitle: 'Передача задачи партнёру',
      points: 0,
      message: `Задача передана ${otherMember.name}! Обещание зафиксировано: «${promiseText}»`,
      icon: '🤝',
    });
    setTimeout(() => {
      setRitualPraiseToast(null);
    }, 4500);
  };

  const handleCompleteTask = (task: CleaningTask) => {
    soundEffects.playTaskSuccess();
    const pointsAwarded = Math.round(task.estimatedMinutes * task.disgustFactor);

    try {
      confetti({
        particleCount: 50,
        spread: 55,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    // Special praise notification for completing daily rituals
    if (task.category === 'ritual') {
      let praiseMsg = `Молодец, ${activeMember.name}! Ежедневная рутина закрыта — дома чисто и уютно! ✨`;
      let praiseIcon = '🌟';
      const idLower = task.id.toLowerCase();
      const titleLower = task.title.toLowerCase();

      if (idLower.includes('kitchen') || idLower.includes('dishes') || titleLower.includes('посуд') || titleLower.includes('кухн')) {
        praiseMsg = `Молодец, ${activeMember.name}! Посуда вымыта, раковина и столешница блестят! 🧽`;
        praiseIcon = '🧽';
      } else if (idLower.includes('cat') || titleLower.includes('кошк') || titleLower.includes('кот')) {
        praiseMsg = `Молодец, ${activeMember.name}! Лоток убран, свежая водичка налита — котик доволен! 🐱`;
        praiseIcon = '🐱';
      } else if (idLower.includes('dog') || titleLower.includes('собак')) {
        praiseMsg = `Молодец, ${activeMember.name}! Собака довольна, лапки чистые и миски сверкают! 🐕`;
        praiseIcon = '🐕';
      } else if (idLower.includes('trash') || titleLower.includes('мусор')) {
        praiseMsg = `Молодец, ${activeMember.name}! Мусор вынесен, дома свежесть и порядок! 🗑️`;
        praiseIcon = '🗑️';
      }

      setRitualPraiseToast({
        memberName: activeMember.name,
        taskTitle: task.title,
        points: pointsAwarded,
        message: praiseMsg,
        icon: praiseIcon,
      });

      setTimeout(() => {
        setRitualPraiseToast(null);
      }, 4500);
    }

    setApartments((prev) =>
      prev.map((apt) => {
        if (apt.id !== activeApartment.id) return apt;

        // Update member points & stats
        const updatedMembers = apt.members.map((m) => {
          if (m.id === activeMember.id) {
            const newTotal = m.totalPoints + pointsAwarded;
            const disgustKey =
              task.disgustFactor === 1.0
                ? 'norm'
                : task.disgustFactor === 1.5
                ? 'moderate'
                : task.disgustFactor === 2.0
                ? 'fu'
                : 'extreme';

            return {
              ...m,
              totalPoints: newTotal,
              completedTasksCount: m.completedTasksCount + 1,
              currentLevel: calculateLevel(newTotal),
              disgustBreakdown: {
                ...m.disgustBreakdown,
                [disgustKey]: m.disgustBreakdown[disgustKey] + 1,
              },
            };
          }
          return m;
        });

        // Add to history
        const newHistoryRecord = {
          id: `hist-${Date.now()}`,
          taskId: task.id,
          taskTitle: task.title,
          completedBy: activeMember.id,
          memberName: activeMember.name,
          points: pointsAwarded,
          timestamp: 'Только что',
        };

        // Update tasks list
        const updatedTasks = apt.tasks.map((t) => {
          if (t.id === task.id) {
            return {
              ...t,
              status: 'completed' as const,
              completedBy: activeMember.id,
              completedAt: new Date().toISOString(),
              pointsSnapshot: pointsAwarded,
            };
          }
          return t;
        });

        // Evaluate Badges dynamically
        const { updatedBadges, newlyUnlockedBadges } = evaluateBadgesOnTaskComplete(
          apt.badges,
          task,
          updatedTasks,
          apt.history,
          updatedMembers
        );

        if (newlyUnlockedBadges.length > 0) {
          const unlockedBadge = newlyUnlockedBadges[0];
          setRitualPraiseToast({
            memberName: activeMember.name,
            taskTitle: 'Ачивка разблокирована! 🏆',
            points: pointsAwarded,
            icon: '🏆',
            message: `Новое достижение: «${unlockedBadge.title}»!`,
            subtitle: unlockedBadge.description,
          });
          try {
            confetti({
              particleCount: 75,
              spread: 70,
              origin: { y: 0.5 },
            });
          } catch {
            // ignore
          }
        }

        const updated = {
          ...apt,
          members: updatedMembers,
          coopCurrentPoints: apt.coopCurrentPoints + pointsAwarded,
          tasks: updatedTasks,
          debts: apt.debts.filter((d) => d.id !== task.id),
          badges: updatedBadges,
          history: [newHistoryRecord, ...apt.history],
        };
        syncApartmentToCloud(updated);
        return updated;
      })
    );
  };

  const handleCompleteDebt = (debt: CleaningTask) => {
    soundEffects.playTaskSuccess();
    const pointsAwarded = Math.round(debt.estimatedMinutes * debt.disgustFactor);

    try {
      confetti({
        particleCount: 50,
        spread: 55,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    setApartments((prev) =>
      prev.map((apt) => {
        if (apt.id !== activeApartment.id) return apt;

        const updatedMembers = apt.members.map((m) => {
          if (m.id === activeMember.id) {
            const newTotal = m.totalPoints + pointsAwarded;
            const disgustKey =
              debt.disgustFactor === 1.0
                ? 'norm'
                : debt.disgustFactor === 1.5
                ? 'moderate'
                : debt.disgustFactor === 2.0
                ? 'fu'
                : 'extreme';

            return {
              ...m,
              totalPoints: newTotal,
              completedTasksCount: m.completedTasksCount + 1,
              currentLevel: calculateLevel(newTotal),
              disgustBreakdown: {
                ...m.disgustBreakdown,
                [disgustKey]: m.disgustBreakdown[disgustKey] + 1,
              },
            };
          }
          return m;
        });

        // Evaluate Badges for completed debt as well
        const { updatedBadges, newlyUnlockedBadges } = evaluateBadgesOnTaskComplete(
          apt.badges,
          debt,
          apt.tasks,
          apt.history,
          updatedMembers
        );

        if (newlyUnlockedBadges.length > 0) {
          const unlockedBadge = newlyUnlockedBadges[0];
          setRitualPraiseToast({
            memberName: activeMember.name,
            taskTitle: 'Ачивка разблокирована! 🏆',
            points: pointsAwarded,
            icon: '🏆',
            message: `Новое достижение: «${unlockedBadge.title}»!`,
            subtitle: unlockedBadge.description,
          });
        }

        const updated = {
          ...apt,
          members: updatedMembers,
          coopCurrentPoints: apt.coopCurrentPoints + pointsAwarded,
          debts: apt.debts.filter((d) => d.id !== debt.id),
          badges: updatedBadges,
          history: [
            {
              id: `hist-${Date.now()}`,
              taskId: debt.id,
              taskTitle: `(Долг) ${debt.title}`,
              completedBy: activeMember.id,
              memberName: activeMember.name,
              points: pointsAwarded,
              timestamp: 'Только что',
            },
            ...apt.history,
          ],
        };
        syncApartmentToCloud(updated);
        return updated;
      })
    );
  };

  const handleAmnestyDebt = (debt: CleaningTask) => {
    soundEffects.playKeypadTone('clear');
    setApartments((prev) =>
      prev.map((apt) => {
        if (apt.id !== activeApartment.id) return apt;
        const updated = {
          ...apt,
          debts: apt.debts.filter((d) => d.id !== debt.id),
        };
        syncApartmentToCloud(updated);
        return updated;
      })
    );

    // Warm, burnout-protection amnesty toast message
    setRitualPraiseToast({
      memberName: activeMember.name,
      taskTitle: debt.title,
      icon: '🕊️',
      message: `Амнистия долга: «${debt.title}» списан!`,
      subtitle: 'Прощаем без вины и упрёков! Ментальное спокойствие важнее идеального графика. Двигаемся дальше с лёгким сердцем! ✨',
    });
    setTimeout(() => {
      setRitualPraiseToast(null);
    }, 5000);
  };

  const handleSetCycleDay = (newDay: number) => {
    if (newDay === activeApartment.cycleDay) return;

    soundEffects.playKeypadTone('5');

    let movedCount = 0;
    let missedRitualMessages: string[] = [];
    let hadRitualsYesterday = false;
    let targetUpdatedApt: Apartment | null = null;

    setApartments((prev) =>
      prev.map((apt) => {
        if (apt.id !== activeApartment.id) return apt;

        hadRitualsYesterday = apt.tasks.filter((t) => t.category === 'ritual').length > 0;
        const res = advanceApartmentDay(apt, newDay, getLocalTodayDateString());
        movedCount = res.movedCount;
        missedRitualMessages = res.missedRitualMessages;
        targetUpdatedApt = res.updatedApt;
        return res.updatedApt;
      })
    );

    if (targetUpdatedApt) {
      syncApartmentToCloud(targetUpdatedApt);
    }

    if (movedCount > 0) {
      soundEffects.playKeypadTone('clear');
      setDaySwitchToast({
        message: `День изменён на ${newDay}. Перенесено в долги: ${movedCount} ${
          movedCount === 1 ? 'задача' : movedCount < 5 ? 'задачи' : 'задач'
        }.`,
        debtsCount: movedCount,
        targetDay: newDay,
        missedRituals: missedRitualMessages,
        allRitualsDone: hadRitualsYesterday && missedRitualMessages.length === 0,
      });
    } else {
      setDaySwitchToast({
        message: `День цикла изменён на ${newDay}. Все плановые задачи предыдущего дня закрыты! ✨`,
        debtsCount: 0,
        targetDay: newDay,
        missedRituals: missedRitualMessages,
        allRitualsDone: hadRitualsYesterday && missedRitualMessages.length === 0,
      });
    }

    setTimeout(() => {
      setDaySwitchToast(null);
    }, missedRitualMessages.length > 0 ? 9000 : 5000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Global Navigation Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCurrentView('lobby')}
              className="flex items-center gap-2 font-extrabold text-base tracking-tight text-white hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <span className="text-xl">🌀</span>
              <span>ЦИКЛON!</span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                PWA / 28 ДНЕЙ
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setCurrentView(currentView === 'guide' ? 'apartment' : 'guide')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'guide'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-amber-300 border-slate-700/80'
              }`}
              title="Как устроен сервис ЦИКЛON: философия и атлас значков"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Гид 📖</span>
              <span className="sm:hidden text-[11px]">Гид</span>
            </button>

            {currentView === 'apartment' ? (
              <button
                onClick={() => setCurrentView('lobby')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Холл дома</span>
                <span className="sm:hidden text-[11px]">Холл</span>
              </button>
            ) : activeApartment && isAuthorizedInActiveApartment ? (
              <button
                onClick={() => setCurrentView('apartment')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950/40 cursor-pointer"
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Кв. {activeApartment.apartmentNumber}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setTargetApartmentForIntercom(null);
                  setIsIntercomOpen(true);
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950/40 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Войти по PIN</span>
                <span className="sm:hidden text-[11px]">PIN-вход</span>
              </button>
            )}

            <button
              onClick={() => setIsIntercomOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Открыть цифровой домофон"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Домофон 📟</span>
              <span className="sm:hidden text-[11px]">Домофон</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ritual Praise Notification Toast */}
      <AnimatePresence>
        {ritualPraiseToast && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] px-4 py-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 shadow-2xl shadow-emerald-950/60 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl shrink-0">
                {ritualPraiseToast.icon}
              </span>
              <div className="min-w-0">
                <div className="font-bold text-white text-xs sm:text-sm leading-tight">
                  {ritualPraiseToast.message}
                </div>
                {ritualPraiseToast.subtitle ? (
                  <div className="text-[11px] text-amber-300/90 font-medium mt-0.5">
                    {ritualPraiseToast.subtitle}
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono font-bold">+{ritualPraiseToast.points || 0} pts</span>
                    <span className="text-slate-400">· начислено {ritualPraiseToast.memberName} в общий банк чистоты</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setRitualPraiseToast(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day switch toast notification */}
      <AnimatePresence>
        {daySwitchToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl space-y-2.5 text-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0">
                  {daySwitchToast.debtsCount > 0 ? '📋' : '✨'}
                </span>
                <span className="text-slate-200 font-medium leading-tight">
                  {daySwitchToast.message}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {daySwitchToast.debtsCount > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab('debts');
                      setCurrentView('apartment');
                      setDaySwitchToast(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 transition-colors cursor-pointer shadow-sm"
                  >
                    К долгам →
                  </button>
                )}
                <button
                  onClick={() => setDaySwitchToast(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Missed daily rituals reminder (do not go to debts, but display humorous friendly message) */}
            {daySwitchToast.missedRituals && daySwitchToast.missedRituals.length > 0 && (
              <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400">
                  <span>💡 Вчерашняя рутина:</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (в долги не идёт, сегодня новый шанс)
                  </span>
                </div>
                <div className="space-y-1">
                  {daySwitchToast.missedRituals.map((msg, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-900/40 text-amber-200 text-xs flex items-center justify-between gap-2"
                    >
                      <span className="font-medium">{msg}</span>
                      <span className="text-[10px] font-mono text-amber-400 shrink-0 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                        сегодня с нуля
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* If all rituals were done */}
            {daySwitchToast.allRitualsDone && (
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
                <span>🌟</span>
                <span>Вчера все ежедневные рутины были закрыты! Дома порядок!</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-8">
        <AnimatePresence mode="wait">
          {currentView === 'lobby' ? (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <BuildingLobby
                apartments={apartments}
                activeApartment={isAuthorizedInActiveApartment ? activeApartment : null}
                onOpenIntercom={() => {
                  setTargetApartmentForIntercom(null);
                  setIsIntercomOpen(true);
                }}
                onSelectApartment={handleSelectApartment}
                onGoToActiveApartment={() => {
                  if (activeApartment && isAuthorizedInActiveApartment) {
                    setCurrentView('apartment');
                  } else {
                    setIsIntercomOpen(true);
                  }
                }}
                onOpenGuide={() => setCurrentView('guide')}
                onAttemptEnterApartment={handleAttemptEnterApartment}
                onOpenStarosta={() => setIsStarostaOpen(true)}
                onCreateApartment={handleCreateApartment}
                onOpenContactDuty={handleOpenContactDuty}
                onRestoreDemo={handleStarostaRestoreDemoApartments}
                dutyMessages={dutyMessages}
                systemConfig={systemConfig}
              />
            </motion.div>
          ) : currentView === 'guide' ? (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <UserGuide
                apartment={activeApartment || apartments[0] || null}
                onGoToApartment={() => {
                  if (activeApartment && isAuthorizedInActiveApartment) {
                    setCurrentView('apartment');
                  } else {
                    setCurrentView('lobby');
                  }
                }}
                onOpenIntercom={() => setIsIntercomOpen(true)}
                onOpenConfig={() => setIsConfigOpen(true)}
              />
            </motion.div>
          ) : !activeApartment || !isAuthorizedInActiveApartment ? (
            <motion.div
              key="no-apartment"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-center py-16 px-6 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-4 max-w-lg mx-auto my-8"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl">
                🔒
              </div>
              <h3 className="text-xl font-bold text-white">Требуется авторизация</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Для доступа к пульту квартиры выберите свою квартиру и введите персональный 4-значный PIN-код домофона.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setTargetApartmentForIntercom(activeApartment || null);
                    setIsIntercomOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm cursor-pointer"
                >
                  Ввести PIN домофона 📟
                </button>
                <button
                  onClick={() => setCurrentView('lobby')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm cursor-pointer"
                >
                  Вернуться в холл дома
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="apartment"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Apartment Header & Tab bar */}
              <ApartmentHeader
                apartment={activeApartment}
                activeMember={activeMember!}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onSwitchMember={handleSwitchMember}
                onOpenLobby={() => setCurrentView('lobby')}
                onOpenIntercom={() => setIsIntercomOpen(true)}
                onOpenShare={() => setIsShareOpen(true)}
                onOpenConfig={() => setIsConfigOpen(true)}
                onOpenGuide={() => setCurrentView('guide')}
                onOpenStarosta={() => setIsStarostaOpen(true)}
                onLogout={() => handleLogoutApartment(activeApartment.id)}
              />

              {/* Sub-view by Tab */}
              {activeTab === 'today' && (
                <TodayTasks
                  tasks={activeApartment.tasks}
                  debts={activeApartment.debts || []}
                  activeMember={activeMember}
                  otherMember={otherMember}
                  cycleDay={activeApartment.cycleDay}
                  onTakeTask={handleTakeTask}
                  onPassTask={handlePassTask}
                  onStartTimer={(task) => setTimerTask(task)}
                  onCompleteDirectly={handleCompleteTask}
                  onGoToDebts={() => setActiveTab('debts')}
                  onPullEarlierDaysToToday={handlePullMissedTasksToToday}
                  onMoveEarlierDaysToDebts={handleMoveMissedTasksToDebts}
                />
              )}

              {activeTab === 'calendar' && (
                <CycleCalendar
                  currentCycleDay={activeApartment.cycleDay}
                  tasks={activeApartment.tasks}
                  debts={activeApartment.debts}
                  onSetCycleDay={handleSetCycleDay}
                  onGoToDebts={() => setActiveTab('debts')}
                />
              )}

              {activeTab === 'balance' && (
                <BalanceAndStats apartment={activeApartment} />
              )}

              {activeTab === 'badges' && (
                <BadgesAndStreaks
                  badges={activeApartment.badges}
                  members={activeApartment.members}
                />
              )}

              {activeTab === 'debts' && (
                <DebtsList
                  debts={activeApartment.debts}
                  onCompleteDebt={handleCompleteDebt}
                  onAmnestyDebt={handleAmnestyDebt}
                  onStartTimer={(task) => setTimerTask(task)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      {currentView === 'apartment' && activeApartment && isAuthorizedInActiveApartment && (
        <nav
          aria-label="Навигация по разделам квартиры"
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          <div className="grid grid-cols-5 items-center text-center">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] ${
                activeTab === 'today' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className={`w-5 h-5 ${activeTab === 'today' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1 leading-none">Сегодня</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] ${
                activeTab === 'calendar' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className={`w-5 h-5 ${activeTab === 'calendar' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1 leading-none">28 дней</span>
            </button>

            <button
              onClick={() => setActiveTab('balance')}
              className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] ${
                activeTab === 'balance' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className={`w-5 h-5 ${activeTab === 'balance' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1 leading-none">Баланс</span>
            </button>

            <button
              onClick={() => setActiveTab('badges')}
              className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] ${
                activeTab === 'badges' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className={`w-5 h-5 ${activeTab === 'badges' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1 leading-none">Награды</span>
            </button>

            <button
              onClick={() => setActiveTab('debts')}
              className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer min-h-[44px] relative ${
                activeTab === 'debts' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <AlertTriangle className={`w-5 h-5 ${activeTab === 'debts' ? 'stroke-[2.5]' : ''}`} />
                {activeApartment.debts.length > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold font-mono text-[9px] leading-tight">
                    {activeApartment.debts.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-none">Долги</span>
            </button>
          </div>
        </nav>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">ЦИКЛON! 🌀</span>
            <span>— «Уборка всегда ON»</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Модель 28-дневного цикла · Будни ≤ 15 мин · Выходные ≤ 30 мин · Защита от выгорания</span>
            <button
              type="button"
              onClick={() => setIsStarostaOpen(true)}
              className="p-1 rounded text-slate-700 hover:text-slate-500 opacity-20 hover:opacity-100 transition-opacity cursor-pointer"
              title=""
              aria-label="Служебный вход"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Intercom Keypad Modal */}
      <IntercomModal
        isOpen={isIntercomOpen}
        onClose={() => {
          setIsIntercomOpen(false);
          setTargetApartmentForIntercom(null);
        }}
        apartments={apartments}
        onSelectApartment={handleSelectApartment}
        onCreateApartment={handleCreateApartment}
        targetApartment={targetApartmentForIntercom}
        onClearTargetApartment={() => setTargetApartmentForIntercom(null)}
        onOpenStarosta={() => setIsStarostaOpen(true)}
        onOpenContactDuty={handleOpenContactDuty}
        systemConfig={systemConfig}
      />

      {/* Cleaning Sprint Timer Modal */}
      <CleaningTimerModal
        isOpen={!!timerTask}
        task={timerTask}
        activeMemberName={activeMember?.name || 'Партнер'}
        onClose={() => setTimerTask(null)}
        onCompleteTask={handleCompleteTask}
      />

      {/* Telegram & PWA Share Modal */}
      {activeApartment && (
        <TelegramShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          apartment={activeApartment}
        />
      )}

      {/* Apartment Configuration Modal */}
      {activeApartment && (
        <ApartmentConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          apartment={activeApartment}
          onSaveConfig={handleSaveApartmentConfig}
          onImportData={handleImportApartmentData}
        />
      )}

      {/* Transfer Task to Partner Modal with Friendly Promise */}
      <TransferTaskModal
        isOpen={!!taskToTransfer}
        onClose={() => setTaskToTransfer(null)}
        task={taskToTransfer}
        fromMember={activeMember}
        partnerMember={otherMember}
        onConfirmTransfer={handleConfirmTransferTask}
      />

      {/* Starosta Admin & PIN Reset Modal */}
      <StarostaModal
        isOpen={isStarostaOpen}
        onClose={() => setIsStarostaOpen(false)}
        apartments={apartments}
        systemConfig={systemConfig}
        onUpdateApartment={handleStarostaUpdateApartment}
        onDeleteApartment={handleStarostaDeleteApartment}
        onDeleteAllApartments={handleStarostaDeleteAllApartments}
        onRestoreDemoApartments={handleStarostaRestoreDemoApartments}
        onCreateApartment={handleStarostaCreateApartment}
        onUpdateSystemConfig={handleUpdateSystemConfig}
        onSyncAll={handleStarostaSyncAll}
        dutyMessages={dutyMessages}
        onUpdateDutyMessage={handleUpdateDutyMessage}
        onDeleteDutyMessage={handleDeleteDutyMessage}
      />

      {/* Contact Duty Officer Modal */}
      <ContactDutyModal
        isOpen={isContactDutyOpen}
        onClose={() => setIsContactDutyOpen(false)}
        apartments={apartments}
        initialApartmentNumber={contactDutyAptNum}
        initialSubject={contactDutySubject}
        dutyMessages={dutyMessages}
        onSendMessage={handleSendDutyMessage}
        onSelectApartment={handleSelectApartment}
      />
    </div>
  );
}
