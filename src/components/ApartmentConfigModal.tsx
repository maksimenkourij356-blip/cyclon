import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Settings2, 
  Cat, 
  Bot, 
  Sparkles, 
  Check, 
  Bath, 
  Utensils, 
  SunMedium, 
  Layers, 
  HelpCircle,
  AlertCircle,
  Download,
  Upload,
  FileJson,
  CheckCircle2
} from 'lucide-react';
import { Apartment, ApartmentConfig } from '../types';

interface ApartmentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: Apartment;
  onSaveConfig: (newConfig: ApartmentConfig, regenerateTasks: boolean) => void;
  onImportData?: (importedApt: Apartment) => void;
}

export const ApartmentConfigModal: React.FC<ApartmentConfigModalProps> = ({
  isOpen,
  onClose,
  apartment,
  onSaveConfig,
  onImportData,
}) => {
  const [petType, setPetType] = useState<ApartmentConfig['petType']>(
    apartment.config?.petType || 'cat'
  );
  const [hasRobotVacuum, setHasRobotVacuum] = useState<boolean>(
    apartment.config?.hasRobotVacuum ?? true
  );
  const [hasDishwasher, setHasDishwasher] = useState<boolean>(
    apartment.config?.hasDishwasher ?? true
  );
  const [hasBalcony, setHasBalcony] = useState<boolean>(
    apartment.config?.hasBalcony ?? false
  );
  const [bathType, setBathType] = useState<ApartmentConfig['bathType']>(
    apartment.config?.bathType || 'bath'
  );

  const [regenerate, setRegenerate] = useState<boolean>(true);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(apartment, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `cyclon-apt-${apartment.apartmentNumber}-backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupSuccessMsg('Файл бэкапа успешно скачан!');
      setTimeout(() => setBackupSuccessMsg(''), 4000);
    } catch {
      setBackupSuccessMsg('Не удалось скачать файл');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.id && json.apartmentNumber && Array.isArray(json.members)) {
          if (onImportData) {
            onImportData(json as Apartment);
            setBackupSuccessMsg('Данные квартиры успешно восстановлены!');
            setTimeout(() => {
              setBackupSuccessMsg('');
              onClose();
            }, 1000);
          }
        } else {
          setBackupSuccessMsg('Ошибка: файл не является корректным бэкапом квартиры ЦИКЛON');
        }
      } catch {
        setBackupSuccessMsg('Ошибка: не удалось прочесть файл');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    const newConfig: ApartmentConfig = {
      petType,
      hasRobotVacuum,
      hasDishwasher,
      hasBalcony,
      bathType,
    };
    onSaveConfig(newConfig, regenerate);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-cyan-950/40 overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Settings2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  Конфигуратор квартиры № {apartment.apartmentNumber}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Адаптация пула задач под ваши условия
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Context info */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              💡 Задачи кардинально меняются под ваши реалии: уход за лотком или собакой, очистка фильтра робота или ручной пылесос, посудомойка или ручная мойка раковины.
            </div>

            {/* Parameter 1: Animals / Pets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>1. Домашние животные</span>
                <span className="text-[11px] font-normal text-cyan-400">Влияет на ритуалы и шерсть</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'none', title: 'Нет животных', icon: '🌿', desc: 'Меньше шерсти' },
                  { id: 'cat', title: 'Кошка', icon: '🐱', desc: 'Лоток, пелёнка' },
                  { id: 'dog', title: 'Собака', icon: '🐕', desc: 'Лапы, лежанка' },
                  { id: 'both', title: 'Кот + Собака', icon: '🐾', desc: 'Двойной комбо' },
                ].map((item) => {
                  const isSelected = petType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPetType(item.id as ApartmentConfig['petType'])}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xl mb-1">{item.icon}</div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Parameter 2: Robot vacuum cleaner */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>2. Робот-пылесос</span>
                <span className="text-[11px] font-normal text-cyan-400">Регулярность полов</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHasRobotVacuum(true)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    hasRobotVacuum
                      ? 'bg-cyan-500/15 border-cyan-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🤖</span>
                    <span className="text-xs font-bold text-slate-200">Есть робот</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Задачи: очистка щёток, запуск влажной уборки, промывка контейнера (5 мин).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setHasRobotVacuum(false)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    !hasRobotVacuum
                      ? 'bg-cyan-500/15 border-cyan-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🧹</span>
                    <span className="text-xs font-bold text-slate-200">Обычный пылесос</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Задачи: ручная уборка комнат пылесосом, углы и плинтуса вручную (15 мин).
                  </p>
                </button>
              </div>
            </div>

            {/* Parameter 3: Dishwasher */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>3. Посудомоечная машина</span>
                <span className="text-[11px] font-normal text-cyan-400">Кухонный ритуал</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHasDishwasher(true)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    hasDishwasher
                      ? 'bg-cyan-500/15 border-cyan-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🫧</span>
                    <span className="text-xs font-bold text-slate-200">Есть посудомойка</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Задачи: загрузка/разбор ПММ (5 мин), чистка нижнего фильтра и форсунок.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setHasDishwasher(false)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    !hasDishwasher
                      ? 'bg-cyan-500/15 border-cyan-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🧽</span>
                    <span className="text-xs font-bold text-slate-200">Мойка руками</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Задачи: ежедневная мойка раковины и сушилки, дезинфекция сифона.
                  </p>
                </button>
              </div>
            </div>

            {/* Parameter 4: Bath / Shower & Balcony */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  4. Санузел: чаша / душ
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBathType('shower')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold cursor-pointer ${
                      bathType === 'shower'
                        ? 'bg-cyan-500/15 border-cyan-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    🚿 Душ / кабина
                  </button>
                  <button
                    type="button"
                    onClick={() => setBathType('bath')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold cursor-pointer ${
                      bathType === 'bath'
                        ? 'bg-cyan-500/15 border-cyan-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    🛁 Ванна
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  5. Балкон / Лоджия
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHasBalcony(true)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold cursor-pointer ${
                      hasBalcony
                        ? 'bg-cyan-500/15 border-cyan-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    🌿 Есть балкон
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasBalcony(false)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold cursor-pointer ${
                      !hasBalcony
                        ? 'bg-cyan-500/15 border-cyan-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    🚫 Нет балкона
                  </button>
                </div>
              </div>
            </div>

            {/* Regeneration option */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
              <input
                type="checkbox"
                id="regenerateTasks"
                checked={regenerate}
                onChange={(e) => setRegenerate(e.target.checked)}
                className="mt-1 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="regenerateTasks" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-bold text-white block">
                  Обновить 28-дневный пул задач по новым параметрам
                </span>
                <span>
                  Задачи автоматически подстроятся (добавятся/удалятся уход за животным, роботом, балконом или посудомойкой).
                </span>
              </label>
            </div>

            {/* Backup & Migration Data Section */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <FileJson className="w-4 h-4 text-cyan-400" />
                  <span>Резервная копия и перенос данных</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Сохраните файл с вашими очками, историей уборок и ачивками, чтобы перенести их на новый домен или сохранить прогресс.
              </p>

              {backupSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{backupSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать бэкап JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Восстановить из файла</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3 sticky bottom-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Применить настройки
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
