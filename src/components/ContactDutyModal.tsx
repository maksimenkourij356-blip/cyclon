import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MessageSquare, 
  KeyRound, 
  HelpCircle, 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  Sparkles,
  MessageCircle,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Apartment, DutyMessage, DutyMessageSubject } from '../types';
import { soundEffects } from '../utils/audio';

interface ContactDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartments: Apartment[];
  initialApartmentNumber?: number | null;
  initialSubject?: DutyMessageSubject;
  dutyMessages: DutyMessage[];
  onSendMessage: (msg: Omit<DutyMessage, 'id' | 'createdAt' | 'status'>) => Promise<void> | void;
  onSelectApartment?: (apt: Apartment) => void;
}

export const ContactDutyModal: React.FC<ContactDutyModalProps> = ({
  isOpen,
  onClose,
  apartments,
  initialApartmentNumber = null,
  initialSubject = 'forgot_pin',
  dutyMessages,
  onSendMessage,
  onSelectApartment,
}) => {
  const [subject, setSubject] = useState<DutyMessageSubject>(initialSubject);
  const [aptNumber, setAptNumber] = useState<string>(initialApartmentNumber ? String(initialApartmentNumber) : '');
  const [senderName, setSenderName] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [sentSuccess, setSentSuccess] = useState<boolean>(false);

  // Sync initial props whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialApartmentNumber) {
        setAptNumber(String(initialApartmentNumber));
      }
      setSubject(initialSubject || 'forgot_pin');
      setSentSuccess(false);

      if (initialSubject === 'forgot_pin' && !message) {
        const numStr = initialApartmentNumber ? ` №${initialApartmentNumber}` : '';
        setMessage(`Здравствуйте! Мы забыли PIN-код от квартиры${numStr}. Пожалуйста, помогите восстановить доступ или сбросить PIN.`);
      }
    }
  }, [isOpen, initialApartmentNumber, initialSubject]);

  // When subject changes to forgot_pin, offer template if message is blank
  const handleSubjectChange = (newSub: DutyMessageSubject) => {
    setSubject(newSub);
    if (newSub === 'forgot_pin' && (!message || message.includes('Здравствуйте!'))) {
      const numStr = aptNumber ? ` №${aptNumber}` : '';
      setMessage(`Здравствуйте! Мы забыли PIN-код от квартиры${numStr}. Пожалуйста, помогите восстановить доступ или сбросить PIN.`);
    }
  };

  if (!isOpen) return null;

  const currentApt = apartments.find((a) => a.apartmentNumber === Number(aptNumber));

  // Filter messages related to this user or apartment
  const myMessages = dutyMessages.filter((m) => {
    if (aptNumber && m.apartmentNumber === Number(aptNumber)) return true;
    return false;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !senderName.trim()) return;

    setIsSubmitting(true);
    soundEffects.playKeypadTone('call');

    try {
      await onSendMessage({
        apartmentNumber: aptNumber ? Number(aptNumber) : undefined,
        apartmentId: currentApt?.id,
        familyTitle: currentApt?.familyTitle || (aptNumber ? `Квартира №${aptNumber}` : undefined),
        senderName: senderName.trim(),
        contact: contact.trim() || undefined,
        subject,
        message: message.trim(),
      });

      soundEffects.playVictory();
      setSentSuccess(true);
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Связь с дежурным по дому
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Онлайн
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Помощь с восстановлением PIN-кода и вопросами по дому
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Recent Replies / Status for this apartment */}
          {myMessages.length > 0 && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Ваши обращения (кв. №{aptNumber}):
                </span>
                <span className="text-[11px] font-mono text-slate-500">{myMessages.length} записей</span>
              </div>

              <div className="space-y-2.5">
                {myMessages.slice(0, 3).map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                      msg.reply
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-white">
                        {msg.subject === 'forgot_pin' ? '🔑 Забыли PIN-код' : msg.subject}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          msg.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : msg.reply
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {msg.status === 'resolved'
                          ? 'Решено'
                          : msg.reply
                          ? 'Получен ответ'
                          : 'На рассмотрении'}
                      </span>
                    </div>

                    <p className="text-slate-400 text-[11px] bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                      «{msg.message}»
                    </p>

                    {msg.reply && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-1">
                        <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ответ дежурного:
                        </div>
                        <p className="text-xs text-emerald-100 font-medium whitespace-pre-line">
                          {msg.reply}
                        </p>
                        {currentApt && onSelectApartment && (
                          <div className="pt-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectApartment(currentApt);
                                onClose();
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 flex items-center gap-1.5 cursor-pointer shadow"
                            >
                              <span>Войти в квартиру №{currentApt.apartmentNumber}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {sentSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Обращение успешно отправлено!</h3>
              <p className="text-xs text-emerald-200/80 max-w-sm mx-auto leading-relaxed">
                Дежурный по дому получил ваше сообщение. Ответ появится здесь в реальном времени, а при необходимости дежурный свяжется с вами по указанному контакту.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSentSuccess(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Отправить ещё одно сообщение
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Тема обращения
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSubjectChange('forgot_pin')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                      subject === 'forgot_pin'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Забыли PIN-код</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubjectChange('access_issue')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                      subject === 'access_issue'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Доступ / домофон</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubjectChange('general_question')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                      subject === 'general_question'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Вопрос по уборке</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubjectChange('other')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                      subject === 'other'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Другой вопрос</span>
                  </button>
                </div>
              </div>

              {/* Apartment number & Resident name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Номер квартиры
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min={1}
                      max={999}
                      value={aptNumber}
                      onChange={(e) => setAptNumber(e.target.value)}
                      placeholder="Напр. 42"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  {currentApt && (
                    <span className="text-[10px] text-cyan-400 mt-1 block">
                      {currentApt.familyTitle}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ваше имя
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Иван или Анна"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contact info (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Контакт для связи (телефон / Telegram) <span className="text-slate-500 font-normal">(необязательно)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+7 (999) 000-00-00 или @username"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Message text */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Сообщение дежурному
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Опишите ситуацию подробнее..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim() || !senderName.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Отправка...' : 'Отправить дежурному'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
