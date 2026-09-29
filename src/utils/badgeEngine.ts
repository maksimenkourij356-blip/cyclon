import { Badge, CleaningTask, HouseholdMember, Apartment } from '../types';

export interface BadgeEvaluationResult {
  updatedBadges: Badge[];
  newlyUnlockedBadges: Badge[];
}

/**
 * Checks all badge criteria and updates progress and unlock status
 */
export function evaluateBadgesOnTaskComplete(
  currentBadges: Badge[],
  completedTask: CleaningTask,
  allTasks: CleaningTask[],
  history: Apartment['history'],
  members: HouseholdMember[]
): BadgeEvaluationResult {
  const newlyUnlockedBadges: Badge[] = [];
  const todayStr = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  const titleLower = completedTask.title.toLowerCase();
  const descLower = completedTask.description.toLowerCase();
  const idLower = completedTask.id.toLowerCase();
  const zone = completedTask.zone;

  const maxStreak = members.length > 0 ? Math.max(...members.map((m) => m.streakDays || 1)) : 1;

  const updatedBadges = currentBadges.map((badge) => {
    // If already unlocked, keep as is
    if (badge.isUnlocked) return badge;

    let newProgress = badge.progress;
    let unlocked = false;

    switch (badge.id) {
      // 1. Первый шаг — выполнить первую задачу
      case 'first_step': {
        newProgress = 1;
        unlocked = true;
        break;
      }

      // 2. Идеальная неделя — 7 дней подряд
      case 'streak_week': {
        newProgress = Math.min(badge.maxProgress, maxStreak);
        if (newProgress >= badge.maxProgress) {
          unlocked = true;
        }
        break;
      }

      // 3. Санитар — вымыть санузел 10 раз
      case 'sanitary': {
        const isBathroomTask =
          zone === 'bathroom' ||
          titleLower.includes('санузел') ||
          titleLower.includes('ванн') ||
          titleLower.includes('унитаз') ||
          titleLower.includes('душ');
        if (isBathroomTask) {
          newProgress = Math.min(badge.maxProgress, badge.progress + 1);
          if (newProgress >= badge.maxProgress) {
            unlocked = true;
          }
        }
        break;
      }

      // 4. Жироборец — очистить духовку и вытяжку в один день
      case 'fat_fighter': {
        const isOvenOrHood =
          titleLower.includes('духовк') ||
          titleLower.includes('вытяжк') ||
          idLower.includes('oven') ||
          idLower.includes('hood');

        if (isOvenOrHood) {
          // Check if the other counterpart was completed today in history or active tasks
          const isOvenNow = titleLower.includes('духовк') || idLower.includes('oven');
          const isHoodNow = titleLower.includes('вытяжк') || idLower.includes('hood');

          const hasCompletedOvenToday =
            isOvenNow ||
            history.some((h) => h.taskTitle.toLowerCase().includes('духовк')) ||
            allTasks.some((t) => t.status === 'completed' && t.title.toLowerCase().includes('духовк'));

          const hasCompletedHoodToday =
            isHoodNow ||
            history.some((h) => h.taskTitle.toLowerCase().includes('вытяжк')) ||
            allTasks.some((t) => t.status === 'completed' && t.title.toLowerCase().includes('вытяжк'));

          if (hasCompletedOvenToday && hasCompletedHoodToday) {
            newProgress = 1;
            unlocked = true;
          }
        }
        break;
      }

      // 5. Кошачий бог — уход за кошкой, лотком и шерстью (30 раз)
      case 'cat_god': {
        const isCatTask =
          zone === 'pet' && (titleLower.includes('кошк') || titleLower.includes('кот') || titleLower.includes('лоток') || idLower.includes('cat'));
        if (isCatTask) {
          newProgress = Math.min(badge.maxProgress, badge.progress + 1);
          if (newProgress >= badge.maxProgress) {
            unlocked = true;
          }
        }
        break;
      }

      // 6. Друг хвостатых — лапомойка, лежанка и уход за собакой (20 раз)
      case 'dog_champion': {
        const isDogTask =
          zone === 'pet' && (titleLower.includes('собак') || titleLower.includes('лапомойк') || idLower.includes('dog'));
        if (isDogTask) {
          newProgress = Math.min(badge.maxProgress, badge.progress + 1);
          if (newProgress >= badge.maxProgress) {
            unlocked = true;
          }
        }
        break;
      }

      // 7. Тёмный рыцарь — победить мёртвые зоны 3 раза
      case 'dark_knight': {
        const isDeadZone =
          titleLower.includes('стирал') ||
          titleLower.includes('плинтус') ||
          titleLower.includes('диван') ||
          titleLower.includes('мёртв') ||
          titleLower.includes('угл') ||
          descLower.includes('плинтус') ||
          descLower.includes('за стиральной') ||
          descLower.includes('стык');
        if (isDeadZone) {
          newProgress = Math.min(badge.maxProgress, badge.progress + 1);
          if (newProgress >= badge.maxProgress) {
            unlocked = true;
          }
        }
        break;
      }

      // 8. Ранняя пташка — выполнить плановую задачу до 9:00 утра
      case 'early_bird': {
        if (currentHour < 9) {
          newProgress = 1;
          unlocked = true;
        }
        break;
      }

      default:
        break;
    }

    if (unlocked && !badge.isUnlocked) {
      const unlockedBadge: Badge = {
        ...badge,
        progress: badge.maxProgress,
        isUnlocked: true,
        unlockedAt: todayStr,
      };
      newlyUnlockedBadges.push(unlockedBadge);
      return unlockedBadge;
    }

    if (newProgress !== badge.progress) {
      return {
        ...badge,
        progress: newProgress,
      };
    }

    return badge;
  });

  return {
    updatedBadges,
    newlyUnlockedBadges,
  };
}
