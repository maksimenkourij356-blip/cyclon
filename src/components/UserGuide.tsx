import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Sparkles,
  Clock,
  Flame,
  Scale,
  HeartHandshake,
  Layers,
  Award,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  DoorOpen,
  Play,
  Zap,
  Coffee,
  Cat,
  Bath,
  Utensils,
  Bed,
  Sofa,
  Shirt,
  ShieldCheck,
  Check,
  ChevronRight,
  PhoneCall,
  Share2,
  CalendarDays,
  Target,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Apartment } from '../types';

interface UserGuideProps {
  apartment: Apartment;
  onGoToApartment: () => void;
  onOpenIntercom: () => void;
  onOpenConfig?: () => void;
}

export const UserGuide: React.FC<UserGuideProps> = ({
  apartment,
  onGoToApartment,
  onOpenIntercom,
  onOpenConfig,
}) => {
  // Two sub-pages / sections
  const [activeSubTab, setActiveSubTab] = useState<'philosophy' | 'symbols'>('philosophy');

  // Interactive sample state for the interactive task demo card
  const [demoChecked, setDemoChecked] = useState<number[]>([0]);
  const [demoTaken, setDemoTaken] = useState(false);
  const [demoTransferred, setDemoTransferred] = useState(false);
  const [demoPromise, setDemoPromise] = useState<string>('Приготовлю кофе и блинчики в субботу ☕🥞');

  const toggleDemoCheck = (index: number) => {
    setDemoChecked((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner / Intro */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-8 top-8 opacity-10 text-cyan-400 pointer-events-none">
          <BookOpen className="w-32 h-32" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Руководство жильца · Всё о ЦИКЛON!</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Как устроен идеальный быт вдвоём
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Забудьте о генеральных уборках на полдня по субботам и спорах о том, «кто моет
            посуду сегодня». ЦИКЛON превращает поддержание дома в предсказуемый 28-дневный
            ритм по 15 минут в день.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onGoToApartment}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all cursor-pointer"
            >
              <DoorOpen className="w-4 h-4" />
              <span>Вернуться в квартиру № {apartment.apartmentNumber}</span>
            </button>

            <button
              onClick={onOpenIntercom}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-cyan-400" />
              <span>Домофон и код доступа</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Main Sections Toggle */}
      <div className="flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-xl mx-auto shadow-inner">
        <button
          onClick={() => setActiveSubTab('philosophy')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'philosophy'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Суть и правила цикла</span>
        </button>

        <button
          onClick={() => setActiveSubTab('symbols')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'symbols'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>2. Значки, очки и механики</span>
        </button>
      </div>

      {/* CONTENT: TAB 1 - PHILOSOPHY & CYCLE */}
      {activeSubTab === 'philosophy' && (
        <motion.div
          key="philosophy"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {/* Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Принцип микро-спринтов (15–20 мин)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Генеральная уборка на выходных крадёт силы. В ЦИКЛON день разбит на <strong>1–2 коротких микро-дела</strong> (всего 15–20 мин на пару). Включайте таймер и делайте дело быстро, без переутомления.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Баланс очков и усилий</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Помыть грязный унитаз или духовку в разы труднее, чем запустить робот-пылесос.
                Система учитывает <strong>коэффициент сложности («Фактор Фу»)</strong>, начисляя за трудные дела заслуженно больше очков.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Кооперация вместо упрёков</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Вы не соперничаете, а наполняете <strong>общую семейную Кооп-банку</strong>.
                Накопив цель (например, 200 очков), пара награждает себя праздничным ужином, массажем или совместным отдыхом.
              </p>
            </div>
          </div>

          {/* 28-Day Cycle Structure */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-cyan-400" />
                  <span>Архитектура 28-дневного макроцикла</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Почему ровно 28 дней? Это ровно 4 полные недели (понедельник всегда совпадает с днём недели цикла).
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                4 недели по 7 дней
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Week 1 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-cyan-400">Неделя 1</span>
                  <span className="text-[10px] text-slate-400 font-mono">Дни 1–7</span>
                </div>
                <h4 className="text-xs font-bold text-white">Базовый каркас дома</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Полы роботом/руками, варочная панель, текстиль от пыли/шерсти, экспресс-санузел, полы шваброй, ревизия холодильника и глубокая ванна.
                </p>
                <div className="text-[10px] text-emerald-400 font-medium">✓ Фокус: быстрое снятие хаоса</div>
              </div>

              {/* Week 2 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-cyan-400">Неделя 2</span>
                  <span className="text-[10px] text-slate-400 font-mono">Дни 8–14</span>
                </div>
                <h4 className="text-xs font-bold text-white">Гигиена и детализация</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Влажные полы, все зеркала, фильтр посудомойки / сифон, глубокий лоток питомца, чистка щёток робота, смена постельного белья и фасады кухни.
                </p>
                <div className="text-[10px] text-cyan-400 font-medium">✓ Фокус: свежесть и уход за техникой</div>
              </div>

              {/* Week 3 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-400">Неделя 3</span>
                  <span className="text-[10px] text-slate-400 font-mono">Дни 15–21</span>
                </div>
                <h4 className="text-xs font-bold text-white">Мёртвые зоны (Dead Zones)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Духовка от нагара, за стиральной машиной, подоконники и радиаторы, балкон/гардероб, смесители от налёта, кофемашина и банные полотенца.
                </p>
                <div className="text-[10px] text-amber-400 font-medium">✓ Фокус: зоны, о которых вечно забывают</div>
              </div>

              {/* Week 4 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-400">Неделя 4</span>
                  <span className="text-[10px] text-slate-400 font-mono">Дни 22–28</span>
                </div>
                <h4 className="text-xs font-bold text-white">Финал и награда</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Жировые фильтры вытяжки, под диваном, дезинфекция дверных ручек, трап душа / швы плитки, ревизия бытовой химии, финальные полы и праздник!
                </p>
                <div className="text-[10px] text-purple-400 font-medium">🏆 Фокус: разблокировка Кооп-приза</div>
              </div>
            </div>
          </div>

          {/* Three types of tasks every day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Coffee className="w-4 h-4 text-emerald-400" />
                <span>1. Ежедневные фоновые ритуалы (Rituals)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Это мелкие привычки на 3–5 минут, которые не дают бытовой грязи разрастаться:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Сброс кухни после еды:</strong> загрузить посудомойку или помыть раковину, протереть стол.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Вечерний питомец:</strong> убрать кошачий лоток / ополоснуть миски и лапомойку собаки.</span>
                </li>
              </ul>
              <div className="p-2.5 rounded-xl bg-slate-950/70 text-[11px] text-slate-400 border border-slate-800">
                💡 Ритуалы висят на виду каждый день и моментально дают очки за поддержание гигиены.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>2. Фокусные задачи дня («Сделать сегодня»)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Сфокусированные дела дня (1–2 коротких спринта по 7–15 минут):
              </p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>Партнёр жмёт <strong>«Взять себе»</strong> или сразу запускает <strong>«Таймер»</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>Устали или нет времени? Жмите <strong>«Передать партнёру»</strong> с дружеской распиской («Завтрак в постель / массаж»).</span>
                </li>
              </ul>
              <div className="p-2.5 rounded-xl bg-slate-950/70 text-[11px] text-slate-400 border border-slate-800">
                ⚖️ Дела поделены так, чтобы в сумме на пару уходило не более 15–20 минут в день!
              </div>
            </div>
          </div>

          {/* Transfer & Debts Mechanics */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/20 via-slate-900 to-amber-950/20 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <FileText className="w-4 h-4" />
              <span>Механика передачи задач и «Долговые расписки»</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Жизнь непредсказуема: усталость на работе, головная боль или срочные дела. В ЦИКЛON задача не превращается
              в скандал. Партнёр может передоверить дело другому, прикрепив долговую расписку.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-0.5">🥐 Завтрак в постель</span>
                <span className="text-[11px] text-slate-400">Передай мытьё плиты в обмен на кофе и круассан в субботу.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-0.5">💆 Массаж 15 минут</span>
                <span className="text-[11px] text-slate-400">Идеальная компенсация за сложную уборку духовки или лотка.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-0.5">🍰 Любимый десерт</span>
                <span className="text-[11px] text-slate-400">Купить вкусняшку по пути домой в знак благодарности.</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* CONTENT: TAB 2 - SYMBOLS, POINTS, UI GUIDE */}
      {activeSubTab === 'symbols' && (
        <motion.div
          key="symbols"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {/* Disgust Factor Explanation */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>Коэффициент отвращения («Фактор Фу»)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Формула честных очков: <strong>Очки = Расчётное время (мин) × Коэффициент сложности</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* x1.0 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs">
                    ×1.0 Норм
                  </span>
                  <span className="text-lg">☕</span>
                </div>
                <h4 className="text-xs font-bold text-white">Обычные дела</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Стереть сухую пыль с подоконников, сложить плед, запустить робот-пылесос, сменить постельное бельё.
                </p>
                <div className="text-[10px] text-slate-400">Пример: 10 мин = <strong>10 очков</strong></div>
              </div>

              {/* x1.5 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-mono font-bold text-xs">
                    ×1.5 Не очень
                  </span>
                  <span className="text-lg">🧤</span>
                </div>
                <h4 className="text-xs font-bold text-white">Требует перчаток</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Жирная варочная панель, мытьё полов со шваброй, очистка фильтра посудомойки, сбор шерсти с дивана.
                </p>
                <div className="text-[10px] text-amber-300">Пример: 10 мин = <strong>15 очков</strong></div>
              </div>

              {/* x2.0 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-orange-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 font-mono font-bold text-xs">
                    ×2.0 Фу
                  </span>
                  <span className="text-lg">🧽</span>
                </div>
                <h4 className="text-xs font-bold text-white">Высокая брезгливость</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Чаша и ободок унитаза, пригоревший жир в духовке, глубокая мойка лотка кошки, известковый налёт в ванне.
                </p>
                <div className="text-[10px] text-orange-300">Пример: 10 мин = <strong>20 очков</strong></div>
              </div>

              {/* x2.5 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-mono font-bold text-xs">
                    ×2.5 Жесть
                  </span>
                  <span className="text-lg">💀</span>
                </div>
                <h4 className="text-xs font-bold text-white">Мёртвые зоны («Герой»)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Вековая пыль за стиральной машиной, очистка волосоуловителя в сифоне душевой, чистка вытяжки.
                </p>
                <div className="text-[10px] text-rose-300">Пример: 15 мин = <strong>37.5 очков</strong></div>
              </div>
            </div>
          </div>

          {/* Zones Atlas */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Атлас зон квартиры</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Utensils, label: 'Кухня (Kitchen)', emoji: '🍳', color: 'text-amber-400 bg-amber-500/10', desc: 'Столешницы, ПММ, плита, холодильник' },
                { icon: Bath, label: 'Санузел (Bathroom)', emoji: '🚿', color: 'text-cyan-400 bg-cyan-500/10', desc: 'Унитаз, ванна, зеркала, краны' },
                { icon: Sofa, label: 'Гостиная (Living)', emoji: '🛋️', color: 'text-indigo-400 bg-indigo-500/10', desc: 'Диван, робот, текстиль, подоконники' },
                { icon: Bed, label: 'Спальня (Bedroom)', emoji: '🛏️', color: 'text-purple-400 bg-purple-500/10', desc: 'Постельное бельё, плинтуса, шкафы' },
                { icon: DoorOpen, label: 'Прихожая (Hallway)', emoji: '🚪', color: 'text-blue-400 bg-blue-500/10', desc: 'Обувница, зеркало в пол, входной коврик' },
                { icon: Cat, label: 'Питомцы (Pet)', emoji: '🐱/🐕', color: 'text-rose-400 bg-rose-500/10', desc: 'Лоток, миски, лапомойка, лежанки' },
                { icon: Shirt, label: 'Постирочная (Laundry)', emoji: '🧺', color: 'text-teal-400 bg-teal-500/10', desc: 'Стиралка, лоток для порошка, порошки' },
                { icon: Sparkles, label: 'Спец-зоны', emoji: '✨', color: 'text-yellow-400 bg-yellow-500/10', desc: 'Кофемашина, балкон, шторы' },
              ].map((zone, i) => {
                const IconComponent = zone.icon;
                return (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${zone.color}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">{zone.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{zone.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Breakdown of a Task Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[11px] font-semibold mb-1">
                Интерактивный тренажёр
              </div>
              <h3 className="text-base font-bold text-white">Как читать карточку задачи</h3>
              <p className="text-xs text-slate-400">
                Нажимайте на чекбоксы и кнопки ниже, чтобы увидеть, как всё устроено на практике.
              </p>
            </div>

            {/* Interactive Demo Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                    День 4 · Неделя 1
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[11px] font-medium">
                    Санузел 🚿
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 text-[11px] font-bold">
                    ×2.0 Фу 🧽
                  </span>
                </div>

                <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  +20 очков в копилку
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">Санузел: раковина, зеркало и унитаз</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Очистить чашу унитаза ёршиком со средством, протереть ободок и смыть брызги с раковины.
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Пошаговый чек-лист (попробуйте нажать):
                </div>
                {[
                  'Залить гель под ободок унитаза',
                  'Протереть смеситель и раковину',
                  'Продезинфицировать сиденье унитаза',
                ].map((item, index) => {
                  const isDone = demoChecked.includes(index);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDemoCheck(index)}
                      className="w-full flex items-center gap-2.5 text-left text-xs cursor-pointer group"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                            : 'border-slate-600 bg-slate-950 group-hover:border-slate-500'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={isDone ? 'line-through text-slate-500' : 'text-slate-300'}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons Callouts */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDemoTaken(!demoTaken);
                      if (demoTransferred) setDemoTransferred(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      demoTaken
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-850 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {demoTaken ? '✓ Взято вами' : 'Взять себе'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDemoTransferred(!demoTransferred);
                      setDemoTaken(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      demoTransferred
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                        : 'bg-slate-800 hover:bg-slate-750 text-pink-300 border border-pink-500/20'
                    }`}
                    title="Нажмите, чтобы протестировать механику передачи с обещанием"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />
                    <span>{demoTransferred ? 'Передано партнёру ✓' : 'Передать партнёру'}</span>
                  </button>

                  <div className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" />
                    <span>Таймер 10:00</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Ориентир: ~10 минут
                </div>
              </div>

              {/* Demo Transfer Promise banner */}
              {demoTransferred && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-pink-950/40 border border-pink-500/30 text-xs text-pink-200 flex items-start gap-2.5"
                >
                  <HeartHandshake className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-pink-300">
                      Задача передана партнёру с дружеской распиской!
                    </div>
                    <div className="text-slate-300 mt-0.5 italic">
                      «{demoPromise}»
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Quick FAQ */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Часто задаваемые вопросы (FAQ)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">Что если мы пропустили день или уехали в отпуск?</div>
                <div className="text-slate-400 leading-relaxed">
                  Никаких штрафов! Задачи не накапливаются бесконечной лавиной. Вы можете либо пропустить день и продолжить цикл, либо отработать задачу в удобный вечер. В настройках также доступен режим «Отпуск».
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">Как пригласить партнёра в нашу квартиру?</div>
                <div className="text-slate-400 leading-relaxed">
                  Нажмите кнопку <strong>«Поделиться»</strong> в шапке квартиры и отправьте ссылку в Telegram. Партнёр сразу откроет ваш дом без регистрации, а также сможет ввести 4-значный PIN через домофон на входе!
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">Как настроить список задач под свои условия (робот, кот, собака)?</div>
                <div className="text-slate-400 leading-relaxed">
                  Кликните на кнопку <strong>«Быт»</strong> в шапке квартиры. Там можно указать наличие питомцев, робота-пылесоса, посудомойки и ванны — задачи мгновенно перестроятся под ваш дом!
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom Floating Navigation Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Готовы навести идеальный порядок?</div>
            <div className="text-xs text-slate-400">Сегодня день {apartment.cycleDay} из 28 в квартире № {apartment.apartmentNumber}</div>
          </div>
        </div>

        <button
          onClick={onGoToApartment}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>Перейти во вкладку «Сделать сегодня»</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
