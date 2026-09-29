import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Send, Smartphone, ShieldCheck, QrCode } from 'lucide-react';
import { Apartment } from '../types';

interface TelegramShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: Apartment;
}

export const TelegramShareModal: React.FC<TelegramShareModalProps> = ({
  isOpen,
  onClose,
  apartment,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLink = `${currentUrl}?apt=${apartment.pinCode}&code=${apartment.handle}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(
      `Привет! Заходи в наш пульт уборки «ЦИКЛON!» 🌀 (Кв. ${apartment.apartmentNumber}, код домофона: ${apartment.pinCode}):\n${shareLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 p-6 space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Подключение партнёра</h3>
                <p className="text-xs text-slate-400">Telegram и PWA доступ к кв. {apartment.apartmentNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Apartment Access Details */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Данные для входа в домофон:
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Номер квартиры:</span>
              <span className="font-mono font-bold text-white text-base">№ {apartment.apartmentNumber}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Логин семьи:</span>
              <span className="font-mono text-cyan-400 font-semibold">@{apartment.handle}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Код домофона (PIN):</span>
              <span className="font-mono font-bold text-cyan-300 text-base">{apartment.pinCode}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Семья:</span>
              <span className="font-medium text-white">{apartment.familyTitle}</span>
            </div>
          </div>

          {/* Quick Share Link */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Прямая ссылка для входа:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono truncate"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Скопировано' : 'Копия'}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleTelegramShare}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Отправить в Telegram партнёру
            </button>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300 flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Установка как PWA: </span>
                <span>
                  В Safari на iPhone нажмите «Поделиться» → «На экран Домой». В Chrome на Android: три точки → «Установить приложение».
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
