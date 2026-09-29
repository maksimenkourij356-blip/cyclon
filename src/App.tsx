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
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Apartment, CleaningTask, HouseholdMember } from './types';
import { 
  loadApartments, 
  saveApartments, 
  getActiveApartmentId, 
  setActiveApartmentId, 
  getActiveMemberId, 
  setActiveMemberId,
  authorizeApartment,
  savePreviousSessionApartmentId 
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
import { DEFAULT_KRASIKOVS_CONFIG, generateTasksForConfig, generateBadgesForConfig } from './data/taskGenerator';
import { evaluateBadgesOnTaskComplete } from './utils/badgeEngine';
import { ApartmentConfig, SystemConfig } from './types';
import { 
  subscribeToCloudApartments, 
  syncApartmentToCloud, 
  deleteApartmentFromCloud, 
  seedCloudIfEmpty, 
  subscribeToSystemConfig, 
  saveSystemConfig, 
  DEFAULT_SYSTEM_CONFIG 
} from './utils/firebase';

export default function App() {
  const [apartments, setApartments] = useState<Apartment[]>(() => loadApartments());
  const [activeAptId, setActiveAptIdState] = useState<string>(() => getActiveApartmentId());
  const [activeMemberId, setActiveMemberIdState] = useState<string>(() =>
    getActiveMemberId(getActiveApartmentId())
  );
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);

  const [currentView, setCurrentView] = useState<'lobby' | 'apartment' | 'guide'>('apartment');
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'balance' | 'badges' | 'debts'>('today');

  // Modals state
  const [isIntercomOpen, setIsIntercomOpen] = useState(false);
  const [isStarostaOpen, setIsStarostaOpen] = useState(false);
  const [targetApartmentForIntercom, setTargetApartmentForIntercom] = useState<Apartment | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
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
  const activeApartment = apartments.find((a) => a.id === activeAptId) || apartments[0];
  const activeMember =
    activeApartment?.members.find((m) => m.id === activeMemberId) ||
    activeApartment?.members[0];
  const otherMember =
    activeApartment?.members.find((m) => m.id !== activeMember?.id) ||
    activeApartment?.members[1] ||
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
      if (cloudApts && cloudApts.length > 0) {
        setApartments(cloudApts);
        saveApartments(cloudApts);
      }
    });

    // Subscribe to Starosta / system config
    const unsubscribeConfig = subscribeToSystemConfig((cfg) => {
      setSystemConfig(cfg);
    });

    return () => {
      unsubscribeApts();
      unsubscribeConfig();
    };
  }, []);

  // Ensure active apartment ID is valid
  useEffect(() => {
    if (apartments.length > 0 && !apartments.find((a) => a.id === activeAptId)) {
      setActiveAptIdState(apartments[0].id);
      setActiveApartmentId(apartments[0].id);
      if (apartments[0].members?.length > 0) {
        setActiveMemberIdState(apartments[0].members[0].id);
      }
    }
  }, [apartments, activeAptId]);

  // Handle URL query parameters (?apt=0244)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const aptParam = params.get('apt');
      const codeParam = params.get('code');

      if (aptParam || codeParam) {
        const found = apartments.find(
          (a) =>
            a.pinCode === aptParam ||
            a.apartmentNumber.toString() === aptParam ||
            (codeParam && a.handle.toLowerCase() === codeParam.toLowerCase())
        );
        if (found) {
          authorizeApartment(found.id);
          setActiveAptIdState(found.id);
          setActiveApartmentId(found.id);
          setCurrentView('apartment');
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
    savePreviousSessionApartmentId(apt.id);
    setActiveAptIdState(apt.id);
    setActiveApartmentId(apt.id);
    if (apt.members.length > 0) {
      setActiveMemberIdState(apt.members[0].id);
      setActiveMemberId(apt.id, apt.members[0].id);
    }
    setCurrentView('apartment');
  };

  const handleSwitchMember = (memberId: string) => {
    setActiveMemberIdState(memberId);
    setActiveMemberId(activeApartment.id, memberId);
  };

  const handleCreateApartment = (newAptData: Partial<Apartment>) => {
    const config: ApartmentConfig = newAptData.config || DEFAULT_KRASIKOVS_CONFIG;
    const generatedTasks = generateTasksForConfig(config);
    const generatedBadges = generateBadgesForConfig(config, true); // new apartment starts with clean progress

    const aptId = newAptData.id || `apt-${newAptData.apartmentNumber || Date.now()}-${Date.now()}`;
    const newApt: Apartment = {
      id: aptId,
      handle: newAptData.handle || 'family',
      pinCode: newAptData.pinCode || '0100',
      apartmentNumber: newAptData.apartmentNumber || 100,
      floor: newAptData.floor || Math.max(1, Math.ceil((newAptData.apartmentNumber || 100) / 10)),
      familyTitle: newAptData.familyTitle || 'Новая семья',
      config,
      members: newAptData.members || [],
      cycleDay: 1,
      cycleStartDate: new Date().toISOString().split('T')[0],
      coopTargetPoints: 1000,
      coopCurrentPoints: 0,
      coopRewardTitle: 'Семейный ужин / Отдых 🎉',
      tasks: generatedTasks,
      debts: [],
      badges: generatedBadges,
      history: [],
      settings: { allowPwaPush: true, vacationMode: false },
    };

    setApartments((prev) => [newApt, ...prev]);
    syncApartmentToCloud(newApt);
    handleSelectApartment(newApt);
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
      if (activeAptId === aptId && remaining.length > 0) {
        setActiveAptIdState(remaining[0].id);
        setActiveApartmentId(remaining[0].id);
      }
      return remaining;
    });
    await deleteApartmentFromCloud(aptId);
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
      cycleDay: 1,
      cycleStartDate: new Date().toISOString().split('T')[0],
      coopTargetPoints: 1000,
      coopCurrentPoints: 0,
      coopRewardTitle: 'Семейный ужин / Отдых 🎉',
      tasks: generatedTasks,
      debts: [],
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
        return {
          ...apt,
          tasks: apt.tasks.map((t) => {
            if (t.id === task.id) {
              return { ...t, status: 'in_progress', takenBy: activeMember.id };
            }
            return t;
          }),
        };
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
        return {
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
    const missedRitualMessages: string[] = [];
    let hadRitualsYesterday = false;

    setApartments((prev) =>
      prev.map((apt) => {
        if (apt.id !== activeApartment.id) return apt;

        const oldDay = apt.cycleDay;

        // 1. Check yesterday's daily rituals (category === 'ritual')
        const yesterdayRituals = apt.tasks.filter((t) => t.category === 'ritual');
        hadRitualsYesterday = yesterdayRituals.length > 0;
        const uncompletedRituals = yesterdayRituals.filter((t) => t.status !== 'completed');

        // Build friendly humor reminders for uncompleted rituals (they do NOT go to debts)
        uncompletedRituals.forEach((r) => {
          const id = r.id.toLowerCase();
          const title = r.title.toLowerCase();
          if (id.includes('kitchen') || id.includes('dishes') || title.includes('посуд') || title.includes('кухн')) {
            missedRitualMessages.push('Эх, вчера посуда осталась немытой 🧽');
          } else if (id.includes('cat') || title.includes('кошк') || title.includes('кот')) {
            missedRitualMessages.push('Эх, вчера у кошки остался грязный туалет 🐱');
          } else if (id.includes('dog') || title.includes('собак')) {
            missedRitualMessages.push('Эх, вчера лапомойка и миски собаки остались без внимания 🐕');
          } else if (id.includes('trash') || title.includes('мусор')) {
            missedRitualMessages.push('Эх, вчера мусор остался стоять дома 🗑️');
          } else {
            missedRitualMessages.push(`Эх, вчера ежедневная рутина «${r.title}» осталась невыполненной 🧹`);
          }
        });

        // 2. Collect uncompleted NON-RITUAL planned tasks scheduled for the day(s) being left behind -> to DEBTS
        const uncompletedPlanned = apt.tasks.filter((t) => {
          if (t.category === 'ritual') return false; // Daily rituals do NOT accumulate in debts!
          if (!t.dayOfCycle) return false;
          if (t.status === 'completed') return false;

          // If moving forward in time (e.g. Day 1 -> Day 3), collect all uncompleted tasks between oldDay and newDay - 1
          if (newDay > oldDay) {
            return t.dayOfCycle >= oldDay && t.dayOfCycle < newDay;
          }
          // If moving to any other day, collect uncompleted tasks of current day
          return t.dayOfCycle === oldDay;
        });

        // Prepare new debts, avoiding duplicates
        const existingDebtIds = new Set(apt.debts.map((d) => d.id));
        const originalDebtTaskIds = new Set(apt.debts.map((d) => d.id.replace(/^debt-/, '')));

        const newDebtsToAdd: CleaningTask[] = [];

        uncompletedPlanned.forEach((t) => {
          const debtId = t.id.startsWith('debt-') ? t.id : `debt-${t.id}`;
          if (!existingDebtIds.has(debtId) && !originalDebtTaskIds.has(t.id)) {
            newDebtsToAdd.push({
              ...t,
              id: debtId,
              description: `${t.description} (с Дня ${t.dayOfCycle})`,
              status: 'available',
              takenBy: undefined, // free for any partner to take in debts
            });
          }
        });

        movedCount = newDebtsToAdd.length;

        // Remove the moved tasks from apt.tasks so they live exclusively in apt.debts
        const movedTaskIds = new Set(uncompletedPlanned.map((t) => t.id));
        const remainingTasks = apt.tasks.filter((t) => !movedTaskIds.has(t.id));

        // 3. CRITICAL: RESET ALL DAILY RITUALS FOR THE NEW DAY!
        // Every daily ritual is refreshed to 'available' with fresh status for the new day
        const refreshedTasks = remainingTasks.map((t) => {
          if (t.category === 'ritual') {
            return {
              ...t,
              status: 'available' as const,
              takenBy: undefined,
              completedBy: undefined,
              completedAt: undefined,
              pointsSnapshot: undefined,
            };
          }
          return t;
        });

        return {
          ...apt,
          cycleDay: newDay,
          tasks: refreshedTasks,
          debts: [...newDebtsToAdd, ...apt.debts],
        };
      })
    );

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('lobby')}
              className="flex items-center gap-2 font-extrabold text-base tracking-tight text-white hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <span className="text-xl">🌀</span>
              <span>ЦИКЛON!</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                PWA / 28 ДНЕЙ
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView(currentView === 'guide' ? 'apartment' : 'guide')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'guide'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-amber-300 border-slate-700/80'
              }`}
              title="Как устроен сервис ЦИКЛON: философия и атлас значков"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Гид 📖</span>
            </button>

            {currentView === 'apartment' ? (
              <button
                onClick={() => setCurrentView('lobby')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Холл дома</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('apartment')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950/40 cursor-pointer"
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Кв. {activeApartment.apartmentNumber}</span>
              </button>
            )}

            <button
              onClick={() => setIsIntercomOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Открыть цифровой домофон"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Домофон 📟</span>
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
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
                activeApartment={activeApartment}
                onOpenIntercom={() => {
                  setTargetApartmentForIntercom(null);
                  setIsIntercomOpen(true);
                }}
                onSelectApartment={handleSelectApartment}
                onGoToActiveApartment={() => setCurrentView('apartment')}
                onOpenGuide={() => setCurrentView('guide')}
                onAttemptEnterApartment={handleAttemptEnterApartment}
                onOpenStarosta={() => setIsStarostaOpen(true)}
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
                apartment={activeApartment}
                onGoToApartment={() => setCurrentView('apartment')}
                onOpenIntercom={() => setIsIntercomOpen(true)}
                onOpenConfig={() => setIsConfigOpen(true)}
              />
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
                activeMember={activeMember}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onSwitchMember={handleSwitchMember}
                onOpenLobby={() => setCurrentView('lobby')}
                onOpenIntercom={() => setIsIntercomOpen(true)}
                onOpenShare={() => setIsShareOpen(true)}
                onOpenConfig={() => setIsConfigOpen(true)}
                onOpenGuide={() => setCurrentView('guide')}
                onOpenStarosta={() => setIsStarostaOpen(true)}
              />

              {/* Sub-view by Tab */}
              {activeTab === 'today' && (
                <TodayTasks
                  tasks={activeApartment.tasks}
                  activeMember={activeMember}
                  otherMember={otherMember}
                  cycleDay={activeApartment.cycleDay}
                  onTakeTask={handleTakeTask}
                  onPassTask={handlePassTask}
                  onStartTimer={(task) => setTimerTask(task)}
                  onCompleteDirectly={handleCompleteTask}
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
      <TelegramShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        apartment={activeApartment}
      />

      {/* Apartment Configuration Modal */}
      <ApartmentConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        apartment={activeApartment}
        onSaveConfig={handleSaveApartmentConfig}
        onImportData={handleImportApartmentData}
      />

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
        onCreateApartment={handleStarostaCreateApartment}
        onUpdateSystemConfig={handleUpdateSystemConfig}
        onSyncAll={handleStarostaSyncAll}
      />
    </div>
  );
}
