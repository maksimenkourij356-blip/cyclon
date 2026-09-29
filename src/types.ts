export type DisgustFactor = 1.0 | 1.5 | 2.0 | 2.5;

export type TaskCategory = 
  | 'ritual'     // Ежедневные ритуалы (кухня после еды, кошка)
  | 'robot'      // Робот-пылесос
  | 'weekly'     // Еженедельные (W)
  | 'biweekly'   // Раз в 2 недели (F)
  | 'monthly'    // Ежемесячные (M)
  | 'rare'       // Редкие (Q - кофемашина, швы)
  | 'seasonal';  // Сезонные (окна, шторы)

export interface CleaningTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  estimatedMinutes: number;
  disgustFactor: DisgustFactor; // К-фактор «фу»: 1.0 норм, 1.5 не очень, 2.0 фу, 2.5 жесть
  zone: 'kitchen' | 'bathroom' | 'living' | 'bedroom' | 'hallway' | 'pet' | 'laundry';
  checklist?: string[];
  dayOfCycle?: number; // 1 to 28
  status: 'available' | 'in_progress' | 'completed';
  takenBy?: string; // memberId
  completedBy?: string; // memberId
  completedAt?: string;
  pointsSnapshot?: number;
  transferPromise?: {
    fromMemberId: string;
    fromMemberName: string;
    toMemberId: string;
    promiseText: string;
    timestamp: string;
  };
}

export interface HouseholdMember {
  id: string;
  name: string;
  avatar: string;
  roleTitle: string;
  totalPoints: number;
  completedTasksCount: number;
  streakDays: number;
  currentLevel: string;
  disgustBreakdown: {
    norm: number;
    moderate: number;
    fu: number;
    extreme: number;
  };
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
}

export interface ApartmentConfig {
  petType: 'none' | 'cat' | 'dog' | 'both';
  hasRobotVacuum: boolean;
  hasDishwasher: boolean;
  hasBalcony: boolean;
  bathType: 'shower' | 'bath' | 'both';
}

export interface Apartment {
  id: string;
  handle: string; // e.g. "krasikovs"
  pinCode: string; // e.g. "0244" (apartment #244)
  apartmentNumber: number;
  floor?: number; // Optional legacy attribute, not used in UI
  familyTitle: string;
  config: ApartmentConfig;
  members: HouseholdMember[];
  cycleDay: number; // 1 to 28
  cycleStartDate: string;
  lastActiveCalendarDate?: string; // e.g. "2026-09-29" for auto-advancement across calendar days
  coopTargetPoints: number;
  coopCurrentPoints: number;
  coopRewardTitle: string;
  tasks: CleaningTask[];
  debts: CleaningTask[];
  badges: Badge[];
  history: Array<{
    id: string;
    taskId: string;
    taskTitle: string;
    completedBy: string;
    memberName: string;
    points: number;
    timestamp: string;
  }>;
  settings: {
    allowPwaPush: boolean;
    telegramChatId?: string;
    vacationMode: boolean;
  };
}

export interface BuildingStats {
  totalApartments: number;
  totalCleanedTasks: number;
  totalPointsEarned: number;
  topStreakApartment: string;
}

export interface SystemConfig {
  starostaPin: string; // Master pin to access Duty officer panel, default "7777"
  starostaName: string; // Default: "Дежурный по дому"
  houseName: string; // Default: "ЖК ЦИКЛON"
  announcement?: string;
  lastUpdated?: string;
}
