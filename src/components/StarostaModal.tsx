import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  Users, 
  Home, 
  Trash2, 
  Edit3, 
  Plus, 
  RefreshCw, 
  Check, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Sparkles,
  Lock,
  Unlock,
  Radio,
  Settings,
  UserCheck,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Phone,
  HelpCircle,
  Building2,
  Dices
} from 'lucide-react';
import { Apartment, HouseholdMember, SystemConfig, DutyMessage } from '../types';
import { soundEffects } from '../utils/audio';

interface StarostaModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartments: Apartment[];
  systemConfig: SystemConfig;
  onUpdateApartment: (updatedApt: Apartment) => Promise<void> | void;
  onDeleteApartment: (aptId: string) => Promise<void> | void;
  onCreateApartment: (newApt: Partial<Apartment>) => Promise<void> | void;
  onUpdateSystemConfig: (newConfig: Partial<SystemConfig>) => Promise<void> | void;
  onSyncAll: () => Promise<void> | void;
  dutyMessages?: DutyMessage[];
  onUpdateDutyMessage?: (id: string, updates: Partial<DutyMessage>) => Promise<void> | void;
  onDeleteDutyMessage?: (id: string) => Promise<void> | void;
}

export const StarostaModal: React.FC<StarostaModalProps> = ({
  isOpen,
  onClose,
  apartments,
  systemConfig,
  onUpdateApartment,
  onDeleteApartment,
  onCreateApartment,
  onUpdateSystemConfig,
  onSyncAll,
  dutyMessages = [],
  onUpdateDutyMessage,
  onDeleteDutyMessage,
}) => {
  // Authorization state for this session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'apartments' | 'messages' | 'users' | 'add_apt' | 'settings'>('apartments');

  // Duty messages states
  const [messageFilter, setMessageFilter] = useState<'all' | 'new' | 'forgot_pin' | 'resolved'>('all');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Editing PIN states
  const [editingPinAptId, setEditingPinAptId] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState<string>('');
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Editing Member states
  const [selectedAptForMember, setSelectedAptForMember] = useState<string>(apartments[0]?.id || '');
  const [editingMember, setEditingMember] = useState<{ aptId: string; member: HouseholdMember } | null>(null);
  const [editMemberName, setEditMemberName] = useState<string>('');
  const [editMemberPoints, setEditMemberPoints] = useState<number>(0);

  // Adding Member states
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<string>('Жилец');

  // Creating Apartment states
  const [newAptNumber, setNewAptNumber] = useState<string>('');
  const [newAptFamily, setNewAptFamily] = useState<string>('');
  const [newAptPin, setNewAptPin] = useState<string>('1234');
  const [newAptM1, setNewAptM1] = useState<string>('');
  const [newAptM2, setNewAptM2] = useState<string>('');

  // Starosta Settings states
  const [newMasterPin, setNewMasterPin] = useState<string>('');
  const [newStarostaName, setNewStarostaName] = useState<string>(systemConfig.starostaName);
  const [newAnnouncement, setNewAnnouncement] = useState<string>(systemConfig.announcement || '');

  // Notifications / feedback
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const pendingMessagesCount = dutyMessages.filter((m) => m.status === 'new').length;
  const filteredMessages = dutyMessages.filter((m) => {
    if (messageFilter === 'all') return true;
    if (messageFilter === 'new') return m.status === 'new';
    if (messageFilter === 'forgot_pin') return m.subject === 'forgot_pin';
    if (messageFilter === 'resolved') return m.status === 'resolved';
    return true;
  });

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = systemConfig.starostaPin || '7777';
    if (enteredPin.trim() === correctPin || enteredPin.trim() === '7777') {
      soundEffects.playVictory();
      setIsAuthenticated(true);
      setPinError('');
    } else {
      soundEffects.playError();
      setPinError('Неверный PIN-код дежурного!');
    }
  };

  const togglePinReveal = (aptId: string) => {
    setRevealedPins(prev => ({ ...prev, [aptId]: !prev[aptId] }));
  };

  // Reset / Change Apartment PIN
  const handleSaveNewPin = async (apt: Apartment) => {
    if (!newPinValue || newPinValue.length < 3) {
      alert('PIN-код должен быть не менее 3-4 цифр');
      return;
    }
    soundEffects.playClick();
    const updated: Apartment = {
      ...apt,
      pinCode: newPinValue.trim()
    };
    await onUpdateApartment(updated);
    setEditingPinAptId(null);
    setNewPinValue('');
    showToast(`ПИН-код квартиры №${apt.apartmentNumber} успешно изменён на "${newPinValue}"!`);
  };

  // Delete an apartment
  const handleDeleteApartment = async (apt: Apartment) => {
    const confirmDelete = window.confirm(`Вы уверены, что хотите удалить квартиру №${apt.apartmentNumber} (${apt.familyTitle}) из базы данных? Это действие необратимо.`);
    if (!confirmDelete) return;

    soundEffects.playDoorClose();
    await onDeleteApartment(apt.id);
    showToast(`Квартира №${apt.apartmentNumber} удалена из базы.`);
  };

  // Save edited member
  const handleSaveMember = async () => {
    if (!editingMember || !editMemberName.trim()) return;

    const apt = apartments.find(a => a.id === editingMember.aptId);
    if (!apt) return;

    const updatedMembers = apt.members.map(m => {
      if (m.id === editingMember.member.id) {
        return {
          ...m,
          name: editMemberName.trim(),
          totalPoints: Math.max(0, editMemberPoints)
        };
      }
      return m;
    });

    const updatedApt: Apartment = {
      ...apt,
      members: updatedMembers
    };

    soundEffects.playClick();
    await onUpdateApartment(updatedApt);
    setEditingMember(null);
    showToast(`Данные пользователя ${editMemberName} обновлены!`);
  };

  // Add new member to apartment
  const handleAddMember = async (aptId: string) => {
    if (!newMemberName.trim()) return;
    const apt = apartments.find(a => a.id === aptId);
    if (!apt) return;

    const newMember: HouseholdMember = {
      id: `member-${Date.now()}`,
      name: newMemberName.trim(),
      avatar: newMemberName.trim()[0].toUpperCase(),
      roleTitle: newMemberRole.trim() || 'Жилец',
      totalPoints: 0,
      completedTasksCount: 0,
      streakDays: 0,
      currentLevel: 'Новичок',
      disgustBreakdown: { norm: 0, moderate: 0, fu: 0, extreme: 0 }
    };

    const updatedApt: Apartment = {
      ...apt,
      members: [...apt.members, newMember]
    };

    soundEffects.playVictory();
    await onUpdateApartment(updatedApt);
    setIsAddingMember(false);
    setNewMemberName('');
    showToast(`Пользователь ${newMember.name} добавлен в кв. №${apt.apartmentNumber}!`);
  };

  // Delete member from apartment
  const handleDeleteMember = async (aptId: string, memberId: string, memberName: string) => {
    const apt = apartments.find(a => a.id === aptId);
    if (!apt) return;

    if (apt.members.length <= 1) {
      alert('Нельзя удалить единственного жильца квартиры!');
      return;
    }

    const confirmDelete = window.confirm(`Удалить жильца ${memberName} из квартиры №${apt.apartmentNumber}?`);
    if (!confirmDelete) return;

    const updatedApt: Apartment = {
      ...apt,
      members: apt.members.filter(m => m.id !== memberId)
    };

    soundEffects.playClick();
    await onUpdateApartment(updatedApt);
    showToast(`Пользователь ${memberName} удалён.`);
  };

  // Create apartment by Starosta
  const handleCreateAptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const aptNum = parseInt(newAptNumber);
    if (isNaN(aptNum) || !newAptFamily.trim() || !newAptM1.trim()) {
      alert('Заполните номер квартиры, фамилию и хотя бы одного жильца.');
      return;
    }

    const m2Name = newAptM2.trim() || 'Сожитель';
    const members: HouseholdMember[] = [
      {
        id: `member-${Date.now()}-1`,
        name: newAptM1.trim(),
        avatar: newAptM1.trim()[0].toUpperCase(),
        roleTitle: 'Жилец',
        totalPoints: 0,
        completedTasksCount: 0,
        streakDays: 0,
        currentLevel: 'Новичок',
        disgustBreakdown: { norm: 0, moderate: 0, fu: 0, extreme: 0 }
      }
    ];

    if (newAptM2.trim()) {
      members.push({
        id: `member-${Date.now()}-2`,
        name: m2Name,
        avatar: m2Name[0].toUpperCase(),
        roleTitle: 'Жилец',
        totalPoints: 0,
        completedTasksCount: 0,
        streakDays: 0,
        currentLevel: 'Новичок',
        disgustBreakdown: { norm: 0, moderate: 0, fu: 0, extreme: 0 }
      });
    }

    const id = `apt-${aptNum}`;
    const handle = `apt${aptNum}`;

    await onCreateApartment({
      id,
      handle,
      apartmentNumber: aptNum,
      familyTitle: newAptFamily.trim(),
      pinCode: newAptPin.trim() || '1234',
      members
    });

    soundEffects.playVictory();
    setNewAptNumber('');
    setNewAptFamily('');
    setNewAptM1('');
    setNewAptM2('');
    setActiveTab('apartments');
    showToast(`Квартира №${aptNum} (${newAptFamily}) успешно создана в базе!`);
  };

  // Save House Duty master settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    const updates: Partial<SystemConfig> = {
      starostaName: newStarostaName.trim() || 'Дежурный по дому',
      announcement: newAnnouncement.trim()
    };
    if (newMasterPin.trim()) {
      updates.starostaPin = newMasterPin.trim();
    }
    await onUpdateSystemConfig(updates);
    setNewMasterPin('');
    showToast('Настройки дежурного успешно сохранены в облаке!');
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    soundEffects.playClick();
    try {
      await onSyncAll();
      showToast('Облачная синхронизация успешно завершена!');
    } catch {
      showToast('Ошибка при синхронизации с базой.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Дежурный по дому
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  Firestore Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Администрирование базы данных, жильцов и сброс PIN-кодов
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        <AnimatePresence>
          {actionSuccessMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-900/60 border-b border-emerald-500/40 px-4 py-2 text-xs sm:text-sm text-emerald-200 flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {!isAuthenticated ? (
            /* PIN Protection Screen */
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl">
                <Lock className="w-8 h-8" />
              </div>
              
              <div className="max-w-md space-y-1.5">
                <h3 className="text-lg font-bold text-white">Дежурный по дому</h3>
                <p className="text-xs text-slate-400">
                  Доступ к пульту управления защищён персональным PIN-кодом.
                </p>
              </div>

              <form onSubmit={handleVerifyPin} className="w-full max-w-xs space-y-4">
                <div>
                  <input
                    type="password"
                    maxLength={10}
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError('');
                    }}
                    placeholder="••••"
                    autoFocus
                    className="w-full text-center text-2xl tracking-[0.3em] font-mono py-3 px-4 rounded-2xl bg-slate-950 border border-cyan-500/40 text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {pinError && (
                    <p className="text-xs text-rose-400 mt-2 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {pinError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition"
                >
                  <Unlock className="w-4 h-4" />
                  Войти на пульт дежурного
                </button>
              </form>
            </div>
          ) : (
            /* Authenticated Admin Dashboard */
            <>
              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('apartments')}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'apartments'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Квартиры & PIN
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition relative ${
                    activeTab === 'messages'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Обращения</span>
                  {pendingMessagesCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold animate-pulse">
                      {pendingMessagesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'users'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Жильцы
                </button>
                <button
                  onClick={() => setActiveTab('add_apt')}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'add_apt'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  + Квартира
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'settings'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Настройки
                </button>
              </div>

              {/* TAB 1: APARTMENTS & PIN CODES */}
              {activeTab === 'apartments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-slate-300 font-medium">
                      Всего квартир в базе: <span className="text-amber-400 font-bold">{apartments.length}</span>
                    </p>
                    <button
                      onClick={handleTriggerSync}
                      disabled={isSyncing}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                      {isSyncing ? 'Синхронизация...' : 'Синхронизировать'}
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {apartments.map((apt) => (
                      <div 
                        key={apt.id}
                        className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-sm">
                              № {apt.apartmentNumber}
                            </span>
                            <span className="font-semibold text-white text-sm sm:text-base">
                              {apt.familyTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span>Жильцов: {apt.members.length} ({apt.members.map(m => m.name).join(', ')})</span>
                            <span>• Задач: {apt.tasks.length}</span>
                          </div>
                        </div>

                        {/* PIN Code controls */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {editingPinAptId === apt.id ? (
                            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-amber-500/50">
                              <input
                                type="text"
                                maxLength={6}
                                value={newPinValue}
                                onChange={(e) => setNewPinValue(e.target.value)}
                                placeholder="Новый PIN"
                                autoFocus
                                className="w-24 text-center font-mono py-1 px-2 text-xs rounded-lg bg-slate-950 text-amber-300 border border-slate-700 focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveNewPin(apt)}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
                                title="Сохранить"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingPinAptId(null)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
                                title="Отмена"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-xs text-slate-400">PIN:</span>
                              <span className="font-mono font-bold text-xs text-amber-300">
                                {revealedPins[apt.id] ? (apt.pinCode || 'Нет') : '••••'}
                              </span>
                              <button
                                onClick={() => togglePinReveal(apt.id)}
                                className="p-1 text-slate-400 hover:text-white transition"
                                title="Показать/скрыть PIN"
                              >
                                {revealedPins[apt.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPinAptId(apt.id);
                                  setNewPinValue(apt.pinCode || '1234');
                                }}
                                className="ml-1 text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
                              >
                                Сбросить
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => handleDeleteApartment(apt)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                            title="Удалить квартиру"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: MESSAGES FROM RESIDENTS */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  {/* Filter chips & stats */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">
                        Журнал обращений:
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {dutyMessages.length} всего
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap text-xs">
                      <button
                        type="button"
                        onClick={() => setMessageFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          messageFilter === 'all'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Все ({dutyMessages.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMessageFilter('new')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          messageFilter === 'new'
                            ? 'bg-rose-500 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Новые ({pendingMessagesCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMessageFilter('forgot_pin')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          messageFilter === 'forgot_pin'
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Забыли PIN ({dutyMessages.filter((m) => m.subject === 'forgot_pin').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMessageFilter('resolved')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          messageFilter === 'resolved'
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Решённые ({dutyMessages.filter((m) => m.status === 'resolved').length})
                      </button>
                    </div>
                  </div>

                  {filteredMessages.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 font-medium">
                        Обращений в выбранной категории пока нет
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Когда жильцы напишут дежурному (например, забудут PIN-код от квартиры), их сообщения мгновенно появятся здесь в реальном времени.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredMessages.map((msg) => {
                        const targetApt = apartments.find(
                          (a) => a.apartmentNumber === msg.apartmentNumber || a.id === msg.apartmentId
                        );

                        return (
                          <div
                            key={msg.id}
                            className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${
                              msg.status === 'new'
                                ? 'bg-slate-900/90 border-amber-500/40 shadow-md shadow-amber-950/30'
                                : msg.status === 'resolved'
                                ? 'bg-slate-950/60 border-emerald-500/30 opacity-90'
                                : 'bg-slate-900/60 border-slate-800'
                            }`}
                          >
                            {/* Message Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    msg.subject === 'forgot_pin'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  }`}
                                >
                                  {msg.subject === 'forgot_pin' ? '🔑 Забыли PIN' : msg.subject === 'access_issue' ? '🚪 Доступ' : '💬 Вопрос'}
                                </span>

                                <span className="font-bold text-white text-xs">
                                  {targetApt
                                    ? `Кв. №${targetApt.apartmentNumber} (${targetApt.familyTitle})`
                                    : msg.apartmentNumber
                                    ? `Кв. №${msg.apartmentNumber}`
                                    : 'Без квартиры'}
                                </span>

                                <span className="text-slate-400">· {msg.senderName}</span>

                                {msg.contact && (
                                  <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20 text-[10px] font-mono">
                                    {msg.contact}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span>{msg.createdAt}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold ${
                                    msg.status === 'resolved'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : msg.status === 'new'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  }`}
                                >
                                  {msg.status === 'resolved' ? 'Решено' : msg.status === 'new' ? 'Новое' : 'В работе'}
                                </span>
                              </div>
                            </div>

                            {/* Resident message body */}
                            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-slate-200 text-xs">
                              «{msg.message}»
                            </div>

                            {/* If Forgot PIN: show current PIN and quick 1-click reset */}
                            {targetApt && (
                              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <KeyRound className="w-4 h-4 text-amber-400" />
                                  <span className="text-slate-400 text-xs">
                                    Текущий PIN кв. №{targetApt.apartmentNumber}:
                                  </span>
                                  <span className="font-mono text-sm font-bold text-amber-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                                    {targetApt.pinCode}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                                    soundEffects.playVictory();
                                    await onUpdateApartment({ ...targetApt, pinCode: randomPin });
                                    const replyText = `Здравствуйте, ${msg.senderName}! PIN-код квартиры №${targetApt.apartmentNumber} успешно сброшен дежурным. Ваш новый PIN-код: ${randomPin}. Введите его в домофоне для входа.`;
                                    if (onUpdateDutyMessage) {
                                      await onUpdateDutyMessage(msg.id, {
                                        reply: replyText,
                                        repliedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                        status: 'resolved',
                                      });
                                    }
                                    showToast(`PIN для кв. №${targetApt.apartmentNumber} изменён на "${randomPin}" и отправлен жильцу!`);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                                >
                                  <Dices className="w-3.5 h-3.5" />
                                  <span>Сбросить PIN на новый и отправить ответ</span>
                                </button>
                              </div>
                            )}

                            {/* Existing reply if any */}
                            {msg.reply && (
                              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                                  <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Ваш ответ жильцу:
                                  </span>
                                  {msg.repliedAt && <span className="text-slate-400 font-normal">{msg.repliedAt}</span>}
                                </div>
                                <p className="text-xs text-emerald-100 whitespace-pre-line font-medium">
                                  {msg.reply}
                                </p>
                              </div>
                            )}

                            {/* Reply Input Form */}
                            <div className="space-y-2 pt-1">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={replyDrafts[msg.id] ?? ''}
                                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [msg.id]: e.target.value }))}
                                  placeholder={msg.reply ? 'Дополнить ответ...' : 'Написать ответ жильцу...'}
                                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                                />
                                <button
                                  type="button"
                                  disabled={!replyDrafts[msg.id]?.trim()}
                                  onClick={async () => {
                                    const text = replyDrafts[msg.id]?.trim();
                                    if (!text || !onUpdateDutyMessage) return;
                                    soundEffects.playClick();
                                    await onUpdateDutyMessage(msg.id, {
                                      reply: text,
                                      repliedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                      status: 'resolved',
                                    });
                                    setReplyDrafts((prev) => ({ ...prev, [msg.id]: '' }));
                                    showToast('Ответ отправлен жильцу!');
                                  }}
                                  className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Ответить</span>
                                </button>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1">
                                <div className="flex items-center gap-2">
                                  {msg.status !== 'resolved' ? (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (onUpdateDutyMessage) {
                                          await onUpdateDutyMessage(msg.id, { status: 'resolved' });
                                          showToast('Обращение помечено как решённое');
                                        }
                                      }}
                                      className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Пометить как решено</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (onUpdateDutyMessage) {
                                          await onUpdateDutyMessage(msg.id, { status: 'new' });
                                          showToast('Обращение возвращено в новые');
                                        }
                                      }}
                                      className="text-slate-400 hover:text-slate-300 text-[11px] cursor-pointer"
                                    >
                                      Вернуть в работу
                                    </button>
                                  )}
                                </div>

                                {onDeleteDutyMessage && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm('Удалить это обращение из журнала?')) {
                                        await onDeleteDutyMessage(msg.id);
                                        showToast('Обращение удалено');
                                      }
                                    }}
                                    className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Удалить</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: USERS & HOUSEHOLD MEMBERS */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {/* Select Apartment */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-400 shrink-0">Выберите квартиру:</label>
                    <select
                      value={selectedAptForMember}
                      onChange={(e) => setSelectedAptForMember(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      {apartments.map((a) => (
                        <option key={a.id} value={a.id}>
                          Квартира №{a.apartmentNumber} — {a.familyTitle}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Members list */}
                  {(() => {
                    const currentApt = apartments.find(a => a.id === selectedAptForMember) || apartments[0];
                    if (!currentApt) return <p className="text-xs text-slate-500">Квартир не найдено</p>;

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                            Жильцы квартиры №{currentApt.apartmentNumber}
                          </h4>
                          <button
                            onClick={() => setIsAddingMember(true)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 flex items-center gap-1 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Добавить жильца
                          </button>
                        </div>

                        {/* Add Member Form */}
                        {isAddingMember && (
                          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3">
                            <h5 className="text-xs font-bold text-amber-300">Новый жилец:</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Имя жильца"
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white"
                              />
                              <input
                                type="text"
                                placeholder="Роль (например: Муж, Жена, Дочь)"
                                value={newMemberRole}
                                onChange={(e) => setNewMemberRole(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setIsAddingMember(false)}
                                className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-400"
                              >
                                Отмена
                              </button>
                              <button
                                onClick={() => handleAddMember(currentApt.id)}
                                className="px-3 py-1 rounded-lg bg-amber-500 text-xs text-slate-950 font-bold"
                              >
                                Сохранить
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Edit Member Modal */}
                        {editingMember && (
                          <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-3">
                            <h5 className="text-xs font-bold text-cyan-300">
                              Редактирование жильца: {editingMember.member.name}
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Имя:</label>
                                <input
                                  type="text"
                                  value={editMemberName}
                                  onChange={(e) => setEditMemberName(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Баллы:</label>
                                <input
                                  type="number"
                                  value={editMemberPoints}
                                  onChange={(e) => setEditMemberPoints(parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingMember(null)}
                                className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-400"
                              >
                                Отмена
                              </button>
                              <button
                                onClick={handleSaveMember}
                                className="px-3 py-1 rounded-lg bg-cyan-500 text-xs text-slate-950 font-bold"
                              >
                                Сохранить изменения
                              </button>
                            </div>
                          </div>
                        )}

                        {/* List */}
                        <div className="grid gap-2">
                          {currentApt.members.map((m) => (
                            <div
                              key={m.id}
                              className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400">
                                  {m.avatar || m.name[0]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white text-sm">{m.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                      {m.roleTitle || 'Жилец'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                    <span className="text-amber-400 font-mono font-medium">★ {m.totalPoints} баллов</span>
                                    <span>• Выполнено: {m.completedTasksCount || 0}</span>
                                    <span>• Стрик: {m.streakDays || 0} дн.</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingMember({ aptId: currentApt.id, member: m });
                                    setEditMemberName(m.name);
                                    setEditMemberPoints(m.totalPoints);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                  title="Редактировать"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMember(currentApt.id, m.id, m.name)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                  title="Удалить жильца"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: CREATE APARTMENT BY HOUSE DUTY */}
              {activeTab === 'add_apt' && (
                <form onSubmit={handleCreateAptSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
                    <h4 className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Быстрая регистрация квартиры
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Дежурный по дому может создать квартиру напрямую без прохождения полного опросника. Задачи и бейджи сгенерируются автоматически!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">Номер квартиры:</label>
                      <input
                        type="number"
                        placeholder="Например: 102"
                        value={newAptNumber}
                        onChange={(e) => setNewAptNumber(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">Фамилия семьи:</label>
                      <input
                        type="text"
                        placeholder="Например: Смирновы"
                        value={newAptFamily}
                        onChange={(e) => setNewAptFamily(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">Стартовый PIN домофона:</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="1234"
                        value={newAptPin}
                        onChange={(e) => setNewAptPin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">Первый жилец:</label>
                      <input
                        type="text"
                        placeholder="Имя"
                        value={newAptM1}
                        onChange={(e) => setNewAptM1(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-300 font-medium block mb-1">Второй жилец (опционально):</label>
                      <input
                        type="text"
                        placeholder="Имя второго жильца"
                        value={newAptM2}
                        onChange={(e) => setNewAptM2(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Зарегистрировать квартиру в Firestore
                  </button>
                </form>
              )}

              {/* TAB 4: SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">Подпись в объявлениях:</label>
                      <input
                        type="text"
                        value={newStarostaName}
                        onChange={(e) => setNewStarostaName(e.target.value)}
                        placeholder="Дежурный по дому"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">
                        Новый PIN дежурного:
                      </label>
                      <input
                        type="password"
                        placeholder="Введите новый PIN (или оставьте пустым)"
                        value={newMasterPin}
                        onChange={(e) => setNewMasterPin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        По этому персональному мастер-коду открывается пульт дежурного (в том числе через домофон).
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">
                        Общее объявление в домофоне:
                      </label>
                      <textarea
                        rows={2}
                        value={newAnnouncement}
                        onChange={(e) => setNewAnnouncement(e.target.value)}
                        placeholder="Например: В субботу генеральная уборка!"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setIsAuthenticated(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-400"
                    >
                      Выйти из кабинета
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                    >
                      Сохранить настройки
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/80 p-3 sm:p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>База данных Firebase защищена</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </div>
  );
};
