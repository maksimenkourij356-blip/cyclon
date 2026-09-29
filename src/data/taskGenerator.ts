import { ApartmentConfig, CleaningTask, Badge } from '../types';

export const DEFAULT_KRASIKOVS_CONFIG: ApartmentConfig = {
  petType: 'both',
  hasRobotVacuum: true,
  hasDishwasher: true,
  hasBalcony: true,
  bathType: 'both',
};

/**
 * Generates tasks for an apartment based on its configuration
 */
export function generateTasksForConfig(config: ApartmentConfig): CleaningTask[] {
  const tasks: CleaningTask[] = [];

  // 1. Ежедневные фоновые ритуалы (Rituals)
  if (config.hasDishwasher) {
    tasks.push({
      id: 'ritual-kitchen-reset',
      title: 'Кухня после еды (экспресс-сброс)',
      description: 'Загрузить/разобрать посудомойку, протереть стол и столешницу',
      category: 'ritual',
      estimatedMinutes: 5,
      disgustFactor: 1.0,
      zone: 'kitchen',
      checklist: ['Раковина свободна', 'Посудомойка запущена или разобрана', 'Столешница протёрта'],
      status: 'available',
    });
  } else {
    tasks.push({
      id: 'ritual-dishes-sink',
      title: 'Кухня: мойка посуды вручную и раковина',
      description: 'Перемыть посуду после дня, ополоснуть раковину и насухо протереть столешницу',
      category: 'ritual',
      estimatedMinutes: 10,
      disgustFactor: 1.5,
      zone: 'kitchen',
      checklist: ['Посуда вымыта на сушилку', 'Раковина очищена от остатков пищи', 'Столешница протёрта микрофиброй'],
      status: 'available',
    });
  }

  // Питомцы: Кошка / Собака / Обе / Нет
  if (config.petType === 'cat' || config.petType === 'both') {
    tasks.push({
      id: 'ritual-cat-evening',
      title: 'Кошка: лоток, пелёнка, миски + вечерний reset',
      description: 'Убрать комки из лотка, сменить пелёнку, вымыть миски, налить свежую воду',
      category: 'ritual',
      estimatedMinutes: 5,
      disgustFactor: 1.5,
      zone: 'pet',
      checklist: ['Убрать комки из лотка совочком', 'Освежить пелёнку/коврик', 'Помыть миски кошки и налить свежую воду'],
      status: 'available',
    });
  }

  if (config.petType === 'dog' || config.petType === 'both') {
    tasks.push({
      id: 'ritual-dog-evening',
      title: 'Собака: лапомойка, коврик прихожей, миски',
      description: 'Протереть зону входной двери после прогулки, ополоснуть лапомойку, вымыть миски и налить воду',
      category: 'ritual',
      estimatedMinutes: 7,
      disgustFactor: 1.5,
      zone: 'pet',
      checklist: ['Помыть миски и налить свежую воду', 'Протереть грязезащитный коврик в прихожей', 'Ополоснуть лапомойку/полотенце'],
      status: 'available',
    });
  }

  // Мусор: ежедневный вечерний ритуал чистоты
  tasks.push({
    id: 'ritual-trash-daily',
    title: 'Мусор: вынос пакета и свежий мешок в ведро',
    description: 'Завязать наполненный пакет, вынести в бак/мусоропровод, расправить чистый пакет в ведре',
    category: 'ritual',
    estimatedMinutes: 4,
    disgustFactor: 1.5,
    zone: 'kitchen',
    checklist: ['Завязать наполненный пакет', 'Вынести в мусоропровод или уличный контейнер', 'Вставить новый пакет и расправить края'],
    status: 'available',
  });

  // 2. Циклические задачи (28 дней)
  // --- НЕДЕЛЯ 1 ---
  // День 1 (Пн): Пол
  if (config.hasRobotVacuum) {
    tasks.push({
      id: 'day1-task-robot',
      title: 'Робот-пылесос: запуск и очистка пола',
      description: 'Поднять стулья и провода с пола, запустить робот-пылесос по квартире',
      category: 'robot',
      estimatedMinutes: 5,
      disgustFactor: 1.0,
      zone: 'living',
      checklist: ['Убрать с пола обувь, зарядки и стулья', 'Запустить сухую/влажную уборку робота', 'Очистить контейнер после заезда'],
      dayOfCycle: 1,
      status: 'available',
    });
  } else {
    tasks.push({
      id: 'day1-task-manual-vacuum',
      title: 'Пылесос: пропылесосить все комнаты вручную',
      description: 'Тщательно пройтись классическим или вертикальным пылесосом по всем комнатам и коридору',
      category: 'weekly',
      estimatedMinutes: 15,
      disgustFactor: 1.5,
      zone: 'living',
      checklist: ['Пылесос в спальне и гостиной', 'Пылесос в коридоре и кухне', 'Очистить пылесборник'],
      dayOfCycle: 1,
      status: 'available',
    });
  }

  // День 2 (Вт): Плита и рабочая зона
  tasks.push({
    id: 'day2-task-stove',
    title: 'Плита, варочная панель и зона вокруг',
    description: 'Очистить варочную поверхность от жировых капель, протереть стену за плитой',
    category: 'weekly',
    estimatedMinutes: 10,
    disgustFactor: 1.5,
    zone: 'kitchen',
    checklist: ['Нанести чистящее средство на варочную панель', 'Стереть нагар микрофиброй', 'Насухо отполировать стекло'],
    dayOfCycle: 2,
    status: 'available',
  });

  // День 3 (Ср): Специфика питомцев или мягкая мебель
  if (config.petType === 'cat' || config.petType === 'both') {
    tasks.push({
      id: 'day3-task-cat-wool',
      title: 'Шерсть кошки: диван, лежанки и когтеточка',
      description: 'Пройтись липким валиком или резиновой щёткой по любимым местам отдыха кошки',
      category: 'weekly',
      estimatedMinutes: 10,
      disgustFactor: 1.5,
      zone: 'pet',
      checklist: ['Очистить подушки дивана от шерсти', 'Очистить лежанку/домик', 'Пропылесосить вокруг когтеточки'],
      dayOfCycle: 3,
      status: 'available',
    });
  }
  if (config.petType === 'dog' || config.petType === 'both') {
    tasks.push({
      id: 'day3-task-dog-place',
      title: 'Лежанка собаки и чистка шерсти с ковриков',
      description: 'Вытряхнуть или пропылесосить подстилку собаки, обработать антисептиком для мебели',
      category: 'weekly',
      estimatedMinutes: 10,
      disgustFactor: 1.5,
      zone: 'pet',
      checklist: ['Вытряхнуть лежанку собаки', 'Пропылесосить коврик у входа', 'Протереть игрушки'],
      dayOfCycle: 3,
      status: 'available',
    });
  }
  if (config.petType === 'none') {
    tasks.push({
      id: 'day3-task-textile-dust',
      title: 'Обеспыливание: диван, пледы и шторы',
      description: 'Вытряхнуть диванные пледы, пройтись насадкой пылесоса по складкам мягкой мебели',
      category: 'weekly',
      estimatedMinutes: 10,
      disgustFactor: 1.0,
      zone: 'living',
      checklist: ['Пылесос по швам дивана', 'Взбить диванные подушки', 'Встряхнуть плед'],
      dayOfCycle: 3,
      status: 'available',
    });
  }

  // День 3 (Ср): Посудомойка / Губки / Слив + Прачечная: стирка и развешивание
  if (config.hasDishwasher) {
    tasks.push({
      id: 'day3-dishwasher-filter',
      title: 'Фильтр посудомойки: промыть от жира',
      description: 'Выкрутить нижний цилиндрический фильтр ПММ, промыть щёткой с мылом от жирового налёта',
      category: 'weekly',
      estimatedMinutes: 5,
      disgustFactor: 1.5,
      zone: 'kitchen',
      checklist: ['Выкрутить цилиндрический фильтр', 'Промыть сетку горячей водой со щёткой', 'Установить обратно до щелчка'],
      dayOfCycle: 3,
      status: 'available',
    });
  } else {
    tasks.push({
      id: 'day3-sink-drain',
      title: 'Слив кухонной мойки и дезинфекция губок',
      description: 'Залить кипяток со средством в слив, обдать губку кипятком или заменить на новую',
      category: 'weekly',
      estimatedMinutes: 5,
      disgustFactor: 1.5,
      zone: 'kitchen',
      checklist: ['Очистить решётку слива', 'Залить чистящее средство/кипяток', 'Заменить или продезинфицировать кухонную губку'],
      dayOfCycle: 3,
      status: 'available',
    });
  }

  // Прачечная: запуск стирки и развешивание на сушилку (в тот же день)
  tasks.push({
    id: 'day3-task-laundry-wash',
    title: 'Прачечная: запуск стирки и развесить на сушилку',
    description: 'Рассортировать вещи, запустить стирку, а по окончании цикла сразу выгрузить и развесить на сушилку',
    category: 'weekly',
    estimatedMinutes: 12,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: [
      'Рассортировать вещи (светлое/тёмное/спорт)',
      'Загрузить барабан, добавить гель/капсулу и запустить',
      'По окончании цикла достать влажное бельё, встряхнуть от заломов и ровно развесить на сушилку',
    ],
    dayOfCycle: 3,
    status: 'available',
  });

  // День 4 (Чт): Санузел экспресс + Разбор высохшей сушилки
  tasks.push({
    id: 'day4-task-toilet',
    title: 'Санузел: раковина, зеркало и унитаз',
    description: 'Очистить чашу унитаза ёршиком со средством, протереть ободок и смыть брызги с раковины',
    category: 'weekly',
    estimatedMinutes: 10,
    disgustFactor: 2.0,
    zone: 'bathroom',
    checklist: ['Залить гель под ободок унитаза', 'Протереть смеситель и раковину', 'Продезинфицировать сиденье унитаза'],
    dayOfCycle: 4,
    status: 'available',
  });

  // Прачечная: разобрать сушилку на следующий день после стирки
  tasks.push({
    id: 'day4-task-laundry-fold',
    title: 'Прачечная: разобрать сушилку и разложить по полкам',
    description: 'Снять высохшее со вчерашнего дня бельё с сушилки, аккуратно сложить стопками по шкафам, убрать сушилку',
    category: 'weekly',
    estimatedMinutes: 10,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: ['Снять сухое бельё с сушилки', 'Сложить вещи стопками и разложить по местам', 'Сложить сушилку и убрать с прохода'],
    dayOfCycle: 4,
    status: 'available',
  });

  // День 5 (Пт): Влажная уборка полов
  tasks.push({
    id: 'day5-task-mop',
    title: 'Полы шваброй: коридор, кухня и плинтуса',
    description: 'Тщательная влажная уборка шваброй в зонах максимальной проходимости',
    category: 'weekly',
    estimatedMinutes: 15,
    disgustFactor: 1.5,
    zone: 'hallway',
    checklist: ['Вымыть пол в прихожей у обувницы', 'Пройтись влажной шваброй по кухне', 'Протереть плинтуса'],
    dayOfCycle: 5,
    status: 'available',
  });

  // День 6 (Сб, Суббота Недели 1): Крупный блок кухни + Вторсырьё
  tasks.push({
    id: 'day6-task-microwave-fridge',
    title: 'Микроволновка + ревизия холодильника (F1)',
    description: 'Разогреть воду с лимоном/содой в микроволновке и вытереть пар, выбросить просрочку из холодильника',
    category: 'biweekly',
    estimatedMinutes: 20,
    disgustFactor: 1.5,
    zone: 'kitchen',
    checklist: ['Отмыть тарелку и стенки микроволновки', 'Выбросить остатки еды старше 4 дней', 'Протереть полку для овощей'],
    dayOfCycle: 6,
    status: 'available',
  });

  tasks.push({
    id: 'day6-task-boxes-recycle',
    title: 'Мусор: разбор коробок от доставок и вторсырьё',
    description: 'Смять скопившиеся картонные коробки заказов, сложить пластик и вынести к контейнерам',
    category: 'weekly',
    estimatedMinutes: 7,
    disgustFactor: 1.0,
    zone: 'hallway',
    checklist: ['Смять коробки от онлайн-заказов (Ozon/WB)', 'Собрать пластиковые бутылки и упаковки', 'Вынести вторсырье к синему баку'],
    dayOfCycle: 6,
    status: 'available',
  });

  // День 7 (Вс, Воскресенье Недели 1): Санузел глубокий + Стирка текстиля
  if (config.bathType === 'shower') {
    tasks.push({
      id: 'day7-task-shower-cabin',
      title: 'Душевая кабина: стеклянные перегородки и поддон (F1)',
      description: 'Удалить мыльный и известковый налёт со стёкол душевой кабины, водосгоном протереть насухо',
      category: 'biweekly',
      estimatedMinutes: 20,
      disgustFactor: 2.0,
      zone: 'bathroom',
      checklist: ['Нанести антиналёт на стекло', 'Очистить поддон и решётку слива', 'Пройтись водосгоном и микрофиброй'],
      dayOfCycle: 7,
      status: 'available',
    });
  } else {
    tasks.push({
      id: 'day7-task-bath-tile',
      title: 'Ванна и настенная плитка (F1)',
      description: 'Вымыть чашу ванны средством от налёта, протереть плитку в зоне душа',
      category: 'biweekly',
      estimatedMinutes: 20,
      disgustFactor: 2.0,
      zone: 'bathroom',
      checklist: ['Нанести чистящий крем/спрей на ванну', 'Очистить сливное отверстие от волос', 'Смыть горячим душем и протереть бортики'],
      dayOfCycle: 7,
      status: 'available',
    });
  }

  tasks.push({
    id: 'day7-task-laundry-weekend',
    title: 'Прачечная: стирка полотенец и текстиля + развесить',
    description: 'Собрать банные и кухонные полотенца, запустить стирку на 60°C, по завершении сразу развесить на сушилку',
    category: 'weekly',
    estimatedMinutes: 12,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: [
      'Собрать банные и кухонные полотенца по квартире',
      'Запустить стирку на 60°C с порошком',
      'После окончания цикла достать и аккуратно развесить на сушилку',
    ],
    dayOfCycle: 7,
    status: 'available',
  });

  // --- НЕДЕЛЯ 2 ---
  // День 8 (Пн): Робот/Пылесос + Разобрать сушилку полотенец
  if (config.hasRobotVacuum) {
    tasks.push({
      id: 'day8-task-robot',
      title: 'Робот-пылесос: влажная уборка всей квартиры',
      description: 'Смочить микрофибру робота, залить чистую воду в бак и запустить по комнатам',
      category: 'robot',
      estimatedMinutes: 5,
      disgustFactor: 1.0,
      zone: 'living',
      checklist: ['Залить воду в бак робота', 'Установить чистую влажную тряпку', 'Запустить влажный цикл'],
      dayOfCycle: 8,
      status: 'available',
    });
  } else {
    tasks.push({
      id: 'day8-task-vacuum-bedrooms',
      title: 'Пылесос: спальни и плинтуса вручную',
      description: 'Пройтись узкой насадкой пылесоса вдоль кроватей, шкафов и плинтусов',
      category: 'weekly',
      estimatedMinutes: 15,
      disgustFactor: 1.0,
      zone: 'bedroom',
      checklist: ['Пропылесосить под кроватью', 'Пройтись по углам спальни', 'Очистить фильтр пылесоса'],
      dayOfCycle: 8,
      status: 'available',
    });
  }

  tasks.push({
    id: 'day8-task-laundry-fold',
    title: 'Прачечная: снять сухие полотенца и освободить сушилку',
    description: 'Снять высохшие полотенца со вчерашнего дня, аккуратно сложить стопкой в шкаф санузла, убрать сушилку',
    category: 'weekly',
    estimatedMinutes: 8,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: ['Снять высохшие полотенца с сушилки', 'Сложить ровными стопками в шкаф санузла', 'Сложить сушилку и убрать'],
    dayOfCycle: 8,
    status: 'available',
  });

  // День 9 (Вт): Зеркала и стеклянные поверхности
  tasks.push({
    id: 'day9-task-mirrors',
    title: 'Зеркала в шкафах, коридоре и спальне',
    description: 'Спрей для стёкол + сухая микрофибра: убрать отпечатки пальцев со всех зеркал',
    category: 'weekly',
    estimatedMinutes: 10,
    disgustFactor: 1.0,
    zone: 'hallway',
    checklist: ['Большое зеркало в прихожей', 'Зеркала шкафов-купе', 'Зеркальные элементы в комнатах'],
    dayOfCycle: 9,
    status: 'available',
  });

  // День 10 (Ср): Посудомойка / Губки / Слив + Прачечная
  if (config.hasDishwasher) {
    tasks.push({
      id: 'day10-task-dishwasher-filter',
      title: 'Посудомоечная машина: фильтр и форсунки (F2)',
      description: 'Выкрутить нижний сетчатый фильтр, промыть теплой водой со щеткой, протереть резинку уплотнителя',
      category: 'biweekly',
      estimatedMinutes: 10,
      disgustFactor: 1.5,
      zone: 'kitchen',
      checklist: ['Выкрутить фильтр со дна машины', 'Промыть сетку от жира со щеткой', 'Протереть резинку дверцы'],
      dayOfCycle: 10,
      status: 'available',
    });
  } else {
    tasks.push({
      id: 'day10-task-sink-deep',
      title: 'Кухонная раковина: глубокая дезинфекция и сифон',
      description: 'Залить в слив средство для прочистки труб, очистить от налёта сушилку для посуды',
      category: 'biweekly',
      estimatedMinutes: 10,
      disgustFactor: 1.5,
      zone: 'kitchen',
      checklist: ['Залить гель в слив раковины', 'Очистить известковый налёт со смесителя', 'Сменить кухонную губку и тряпку'],
      dayOfCycle: 10,
      status: 'available',
    });
  }

  tasks.push({
    id: 'day10-task-laundry-wash',
    title: 'Прачечная: стирка одежды и развесить на сушилку',
    description: 'Рассортировать вещи по цветам, запустить стирку, а после завершения цикла сразу развесить на сушилку',
    category: 'weekly',
    estimatedMinutes: 12,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: [
      'Рассортировать вещи по цвету и типу ткани',
      'Загрузить барабан, добавить гель и запустить программу стирки',
      'По окончании стирки достать бельё, встряхнуть от складок и аккуратно развесить на сушилку',
    ],
    dayOfCycle: 10,
    status: 'available',
  });

  // День 11 (Чт): Питомцы глубокий уход или обувница + Разбор высохшей сушилки
  if (config.petType === 'cat' || config.petType === 'both') {
    tasks.push({
      id: 'day11-cat-deep',
      title: 'Глубокая мойка кошачьего лотка (F2)',
      description: 'Полная замена наполнителя, дезинфекция лотка горячей водой и чистящим средством',
      category: 'biweekly',
      estimatedMinutes: 12,
      disgustFactor: 2.0,
      zone: 'pet',
      checklist: ['Утилизировать старый наполнитель', 'Вымыть лоток в ванной с мылом/хлорным спреем', 'Насухо вытереть и насыпать свежий наполнитель'],
      dayOfCycle: 11,
      status: 'available',
    });
  }
  if (config.petType === 'dog' || config.petType === 'both') {
    tasks.push({
      id: 'day11-dog-deep',
      title: 'Стирка подстилки собаки и мойка мисок (F2)',
      description: 'Загрузить съёмный чехол лежанки в стирку, продезинфицировать миски и поддон',
      category: 'biweekly',
      estimatedMinutes: 12,
      disgustFactor: 1.5,
      zone: 'pet',
      checklist: ['Чехол лежанки в стиральную машину', 'Тщательно вымыть силиконовый поддон под миски', 'Протереть поводок и ошейник'],
      dayOfCycle: 11,
      status: 'available',
    });
  }
  if (config.petType === 'none') {
    tasks.push({
      id: 'day11-shoerack',
      title: 'Обувница и коврик прихожей (F2)',
      description: 'Протереть полки обувницы, вымыть поддоны для уличной обуви, пропылесосить под ковриком',
      category: 'biweekly',
      estimatedMinutes: 10,
      disgustFactor: 1.5,
      zone: 'hallway',
      checklist: ['Вымыть пластиковые поддоны для обуви', 'Протереть полки обувницы', 'Вымыть пол под грязезащитным ковриком'],
      dayOfCycle: 11,
      status: 'available',
    });
  }

  tasks.push({
    id: 'day11-task-laundry-fold',
    title: 'Прачечная: разобрать сушилку и разложить по полкам',
    description: 'Снять высохшее со вчерашнего дня бельё, сложить аккуратными стопками по шкафам, сложить и убрать сушилку',
    category: 'weekly',
    estimatedMinutes: 10,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: ['Снять сухое бельё с сушилки', 'Сложить вещи стопками и разложить по полкам', 'Сложить сушилку и убрать с прохода'],
    dayOfCycle: 11,
    status: 'available',
  });

  // День 12 (Чт / Чт2): Робот обслуживание / Классический пылесос + санузел
  if (config.hasRobotVacuum) {
    tasks.push({
      id: 'day12-task-robot',
      title: 'Робот-пылесос: контейнер и щётки',
      description: 'Вытряхнуть пылесборник, срезать намотанные волосы с центральной турбощётки',
      category: 'robot',
      estimatedMinutes: 5,
      disgustFactor: 1.0,
      zone: 'living',
      checklist: ['Очистить пылесборник', 'Проверить боковую щётку', 'Срезать волосы с турбощётки'],
      dayOfCycle: 12,
      status: 'available',
    });
  } else {
    tasks.push({
      id: 'day12-task-sweeping',
      title: 'Подмести / протереть труднодоступные зоны пола',
      description: 'Влажная уборка за дверями, вокруг ножек мебели и под батареями',
      category: 'weekly',
      estimatedMinutes: 10,
      disgustFactor: 1.0,
      zone: 'living',
      checklist: ['Убрать пыль за межкомнатными дверями', 'Пройтись под радиаторами отопления', 'Протереть ножки стульев и стола'],
      dayOfCycle: 12,
      status: 'available',
    });
  }

  tasks.push({
    id: 'day12-task-vacuum-manual',
    title: 'Обычный пылесос: диван и коврик от шерсти',
    description: 'Пройтись мебельной насадкой пылесоса по дивану и коврикам от шерсти',
    category: 'weekly',
    estimatedMinutes: 10,
    disgustFactor: 1.5,
    zone: 'living',
    checklist: ['Снять подушки с дивана', 'Пройтись насадкой по стыкам', 'Пропылесосить коврик у входа'],
    dayOfCycle: 12,
    status: 'available',
  });

  tasks.push({
    id: 'day12-task-bathroom',
    title: 'Санузел: базовый блеск',
    description: 'Раковина, смеситель, зеркало от брызг и сиденье унитаза (10 мин)',
    category: 'weekly',
    estimatedMinutes: 10,
    disgustFactor: 2.0,
    zone: 'bathroom',
    checklist: ['Протереть зеркало микрофиброй', 'Нанести спрей на смеситель и смыть', 'Продезинфицировать сиденье'],
    dayOfCycle: 12,
    status: 'available',
  });

  // День 13 (Пт): Полы ручные
  tasks.push({
    id: 'day13-task-floor',
    title: 'Полы вручную: углы и плинтуса',
    description: 'Влажная швабра по углам, вдоль плинтусов и под радиаторами, куда не достаёт робот',
    category: 'weekly',
    estimatedMinutes: 15,
    disgustFactor: 1.5,
    zone: 'hallway',
    checklist: ['Плинтуса в коридоре', 'Углы в кухне-гостиной', 'Зона вокруг мисок и лотка'],
    dayOfCycle: 13,
    status: 'available',
  });

  // День 14 (Сб, Суббота Недели 2): Бельё (стирка + развешивание) и фасады кухни
  tasks.push({
    id: 'day14-task-bedding',
    title: 'Смена постельного белья + стирка и развесить (F2)',
    description: 'Снять старое бельё, заправить свежее, запустить стирку снятого комплекта и по окончании развесить на сушилку',
    category: 'biweekly',
    estimatedMinutes: 15,
    disgustFactor: 1.0,
    zone: 'bedroom',
    checklist: [
      'Снять старое постельное бельё и заправить свежий комплект',
      'Загрузить снятое бельё в стирку на 60°C и запустить',
      'По окончании цикла аккуратно и ровно развесить на сушилку',
    ],
    dayOfCycle: 14,
    status: 'available',
  });

  tasks.push({
    id: 'day14-task-facades',
    title: 'Фасады кухни и фартук (F2)',
    description: 'Обезжирить ручки, фасады нижних и верхних шкафов кухни',
    category: 'biweekly',
    estimatedMinutes: 15,
    disgustFactor: 1.5,
    zone: 'kitchen',
    checklist: ['Удалить пятна с нижних фасадов', 'Протереть зону около ручек', 'Насухо пройтись фиброй'],
    dayOfCycle: 14,
    status: 'available',
  });

  // --- НЕДЕЛЯ 3 ---
  // День 15 (Вс): Духовка (M) + Снять сухое постельное бельё
  tasks.push({
    id: 'day15-task-oven',
    title: 'Духовка и противни (M)',
    description: 'Нанести активную пену на стенки и стекло духовки, смыть нагар',
    category: 'monthly',
    estimatedMinutes: 20,
    disgustFactor: 2.0,
    zone: 'kitchen',
    checklist: ['Нанести антижир', 'Выдержать 5 минут', 'Тщательно смыть влажной губкой', 'Протереть стекло изнутри'],
    dayOfCycle: 15,
    status: 'available',
  });

  tasks.push({
    id: 'day15-task-bedding-fold',
    title: 'Прачечная: снять высохшее постельное бельё и убрать сушилку',
    description: 'Снять высохший со вчерашнего дня комплект постельного белья, сложить в бельевой шкаф, освободить место',
    category: 'biweekly',
    estimatedMinutes: 8,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: ['Снять сухое постельное бельё с сушилки', 'Аккуратно сложить пододеяльник и простыню', 'Убрать комплект в шкаф и сложить сушилку'],
    dayOfCycle: 15,
    status: 'available',
  });

  // День 16 (Пн): Глубокая очистка стиральной машины (M)
  tasks.push({
    id: 'day16-task-washer-deep',
    title: 'Глубокая очистка стиральной машины: кювета, резинка люка и фильтр слива (M)',
    description: 'Вымыть лоток от налёта порошка, очистить складку резиновой манжеты от слизи, выкрутить и промыть фильтр насоса',
    category: 'monthly',
    estimatedMinutes: 15,
    disgustFactor: 2.0,
    zone: 'laundry',
    checklist: [
      'Вынуть кювету для порошка и вымыть теплой водой со щёткой от плесени',
      'Протереть влажной салфеткой складку резиновой манжеты люка от мыльной слизи',
      'Открыть нижний лючок и выкрутить сливной фильтр насоса от мусора',
      'Протереть пространство за стиральной машиной и полку с бытовой химией',
    ],
    dayOfCycle: 16,
    status: 'available',
  });

  // День 17 (Вт): Подоконники и радиаторы + Запуск стирки
  tasks.push({
    id: 'day17-task-windowsills',
    title: 'Подоконники во всех комнатах и верх радиаторов (F3)',
    description: 'Стереть пыль с подоконников, протереть горшки с цветами и верхние решётки радиаторов',
    category: 'biweekly',
    estimatedMinutes: 10,
    disgustFactor: 1.0,
    zone: 'living',
    checklist: ['Подоконник в спальне', 'Подоконник в гостиной/кухне', 'Смахнуть пыль с решеток батарей'],
    dayOfCycle: 17,
    status: 'available',
  });

  tasks.push({
    id: 'day17-task-laundry-wash',
    title: 'Прачечная: запуск стирки и развесить на сушилку',
    description: 'Сортировка накопившихся вещей, запуск стирки, по завершении цикла сразу развесить на сушилку',
    category: 'weekly',
    estimatedMinutes: 12,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: [
      'Рассортировать вещи по цветам и типу ткани',
      'Загрузить барабан, залить гель и запустить программу',
      'После окончания цикла выгрузить и ровно развесить на сушилку',
    ],
    dayOfCycle: 17,
    status: 'available',
  });

  // День 18 (Ср): Балкон (если есть) или прихожая глубокая + Сушилка
  if (config.hasBalcony) {
    tasks.push({
      id: 'day18-task-balcony',
      title: 'Балкон / Лоджия: пол и полки (M)',
      description: 'Подмести или пропылесосить пол балкона, протереть пыль со складных стульев и подоконника лоджии',
      category: 'monthly',
      estimatedMinutes: 15,
      disgustFactor: 1.5,
      zone: 'living',
      checklist: ['Подмести пол на балконе', 'Протереть перила/подоконники', 'Сложить коробки/вещи аккуратно'],
      dayOfCycle: 18,
      status: 'available',
    });
  } else {
    tasks.push({
      id: 'day18-task-hallway-closet',
      title: 'Гардеробная / шкаф в прихожей: порядок (M)',
      description: 'Расставить сезонную обувь, повесить разбросанные куртки на плечики, протереть нижнюю полку',
      category: 'monthly',
      estimatedMinutes: 15,
      disgustFactor: 1.0,
      zone: 'hallway',
      checklist: ['Убрать обувь не по сезону', 'Поправить плечики с верхней одеждой', 'Протереть полку для шапок и шарфов'],
      dayOfCycle: 18,
      status: 'available',
    });
  }

  tasks.push({
    id: 'day18-task-laundry-fold',
    title: 'Прачечная: разобрать сушилку и разложить по полкам',
    description: 'Снять высохшее со вчерашнего дня бельё, сложить аккуратными стопками по шкафам, сложить и убрать сушилку',
    category: 'weekly',
    estimatedMinutes: 10,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: ['Снять сухое бельё с сушилки', 'Сложить вещи стопками и разложить по местам', 'Сложить и убрать сушилку с прохода'],
    dayOfCycle: 18,
    status: 'available',
  });

  // День 19 (Чт): Санузел налёт
  tasks.push({
    id: 'day19-task-faucets-scale',
    title: 'Смесители и удаление известкового налёта (F3)',
    description: 'Нанести средство от водного камня на все хромированные краны и душевую лейку',
    category: 'biweekly',
    estimatedMinutes: 10,
    disgustFactor: 1.5,
    zone: 'bathroom',
    checklist: ['Нанести гель от известкового налёта', 'Очистить сеточки аэраторов', 'Насухо отполировать микрофиброй'],
    dayOfCycle: 19,
    status: 'available',
  });

  // День 20 (Пт): Кофемашина / Чайник
  tasks.push({
    id: 'day20-task-coffeemachine',
    title: 'Декальцинация кофемашины / очистка чайника (Q)',
    description: 'Запустить цикл очистки от накипи раствором, промыть блок заваривания или прокипятить чайник с лимонной кислотой',
    category: 'rare',
    estimatedMinutes: 15,
    disgustFactor: 1.0,
    zone: 'kitchen',
    checklist: ['Залить средство от накипи', 'Запустить автоматическую программу или кипячение', 'Промыть резервуар чистой водой'],
    dayOfCycle: 20,
    status: 'available',
  });

  // День 21 (Сб, Суббота Недели 3): Полотенца и коврики санузла F3 (стирка + развешивание)
  tasks.push({
    id: 'day21-task-bedding2',
    title: 'Смена полотенец и ковриков в санузле + развесить (F3)',
    description: 'Собрать банные полотенца и коврик из ванной в стирку на 60°C, повесить свежие, а постиранные сразу развесить на сушилку',
    category: 'biweekly',
    estimatedMinutes: 12,
    disgustFactor: 1.0,
    zone: 'bathroom',
    checklist: [
      'Собрать банные полотенца и коврик в стирку',
      'Повесить чистый комплект полотенец',
      'Запустить цикл стирки на 60°C, а по завершении развесить на сушилку',
    ],
    dayOfCycle: 21,
    status: 'available',
  });

  // --- НЕДЕЛЯ 4 ---
  // День 22 (Вс): Вытяжка и фильтры + Разбор сушилки полотенец
  tasks.push({
    id: 'day22-task-hood',
    title: 'Вытяжка и жировые фильтры (M)',
    description: 'Снять решётки вытяжки, замочить в горячей воде с жирорастворителем или в посудомойке',
    category: 'monthly',
    estimatedMinutes: 15,
    disgustFactor: 2.0,
    zone: 'kitchen',
    checklist: ['Снять металлические сетки', 'Запустить в посудомойке или замочить в раковине', 'Протереть корпус вытяжки'],
    dayOfCycle: 22,
    status: 'available',
  });

  tasks.push({
    id: 'day22-task-towels-fold',
    title: 'Прачечная: снять сухие полотенца и коврики с сушилки',
    description: 'Снять высохшие со вчерашнего дня банные полотенца и коврики, разложить в санузле, убрать сушилку',
    category: 'biweekly',
    estimatedMinutes: 8,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: ['Снять сухое бельё и коврики с сушилки', 'Разложить стопками в ванной', 'Сложить сушилку и убрать'],
    dayOfCycle: 22,
    status: 'available',
  });

  // День 23 (Пн): Робот или пылесос
  if (config.hasRobotVacuum) {
    tasks.push({
      id: 'day23-task-robot-deep',
      title: 'Робот-пылесос: мойка датчиков и док-станции (M)',
      description: 'Сухой салфеткой протереть оптические датчики от пыли, вымыть поддон зарядной станции',
      category: 'robot',
      estimatedMinutes: 7,
      disgustFactor: 1.0,
      zone: 'living',
      checklist: ['Протереть датчики перепада высоты снизу', 'Очистить контакты зарядки', 'Протереть поддон док-станции'],
      dayOfCycle: 23,
      status: 'available',
    });
  } else {
    tasks.push({
      id: 'day23-task-vacuum-under-sofa',
      title: 'Пылесос: под диваном и за шкафами (M)',
      description: 'Отодвинуть лёгкую мебель или насадкой достать пылевые скопления под диваном',
      category: 'monthly',
      estimatedMinutes: 15,
      disgustFactor: 1.5,
      zone: 'living',
      checklist: ['Пылесос под диваном в гостиной', 'Убрать пыль под кроватью', 'Вытряхнуть пылесборник'],
      dayOfCycle: 23,
      status: 'available',
    });
  }

  // День 24 (Вт): Выключатели и ручки дверей + Стирка спорт/тёмное
  tasks.push({
    id: 'day24-task-switches',
    title: 'Дезинфекция выключателей и дверных ручек (M)',
    description: 'Салфеткой с антисептиком пройтись по всем выключателям света и дверным ручкам квартиры',
    category: 'monthly',
    estimatedMinutes: 8,
    disgustFactor: 1.0,
    zone: 'hallway',
    checklist: ['Выключатели в комнатах и санузле', 'Ручки входной и межкомнатных дверей', 'Ручка холодильника и чайника'],
    dayOfCycle: 24,
    status: 'available',
  });

  tasks.push({
    id: 'day24-task-laundry-wash',
    title: 'Прачечная: стирка тёмных/спорт вещей и развесить на сушилку',
    description: 'Собрать спортивную форму и тёмные вещи, запустить деликатный режим, после стирки сразу развесить на сушилку',
    category: 'weekly',
    estimatedMinutes: 12,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: [
      'Собрать спортивную одежду и тёмные вещи',
      'Залить гель для стирки и запустить цикл',
      'После окончания стирки аккуратно развесить вещи на сушилку',
    ],
    dayOfCycle: 24,
    status: 'available',
  });

  // День 25 (Ср): Глубокий санузел + Разбор сушилки
  if (config.bathType === 'shower') {
    tasks.push({
      id: 'day25-task-deepshower',
      title: 'Глубокая чистка душевой лейки и трапа (M)',
      description: 'Разобрать и очистить волосоуловитель в трапе душа, замочить лейку в уксусном растворе от накипи',
      category: 'monthly',
      estimatedMinutes: 15,
      disgustFactor: 2.5,
      zone: 'bathroom',
      checklist: ['Снять решетку трапа и очистить гидрозатвор', 'Удалить налёт с форсунок лейки', 'Промыть горячей водой со сливом'],
      dayOfCycle: 25,
      status: 'available',
    });
  } else {
    tasks.push({
      id: 'day25-task-deepbath',
      title: 'Глубокая ванна и швы плитки (F4)',
      description: 'Обработать ванну средством, пройтись щёткой по межплиточным швам у смесителя',
      category: 'biweekly',
      estimatedMinutes: 20,
      disgustFactor: 2.0,
      zone: 'bathroom',
      checklist: ['Нанести гель на ванну', 'Щёткой очистить швы плитки', 'Ополоснуть душем и протереть насухо'],
      dayOfCycle: 25,
      status: 'available',
    });
  }

  tasks.push({
    id: 'day25-task-laundry-fold',
    title: 'Прачечная: разбор сушилки и гардероб',
    description: 'Снять высохшие вещи, разложить по плечикам и ящикам, освободить сушилку',
    category: 'weekly',
    estimatedMinutes: 10,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: ['Снять сухое бельё с сушилки', 'Развесить рубашки и футболки на вешалки', 'Сложить и убрать напольную сушилку'],
    dayOfCycle: 25,
    status: 'available',
  });

  // День 26 (Чт): Мытьё мусорного ведра, стиралка 90°C и ревизия расходников
  tasks.push({
    id: 'day26-task-trashcan-deep',
    title: 'Мусор: мытьё мусорного ведра и зоны под раковиной (M)',
    description: 'Вымыть пластиковое ведро с дезинфицирующим мылом, протереть поддон и шкаф под мойкой',
    category: 'monthly',
    estimatedMinutes: 10,
    disgustFactor: 2.0,
    zone: 'kitchen',
    checklist: ['Вымыть мусорное ведро в ванной со щёткой', 'Продезинфицировать дно и стенки ведра', 'Протереть зону под раковиной и постелить чистую салфетку'],
    dayOfCycle: 26,
    status: 'available',
  });

  tasks.push({
    id: 'day26-task-washer-cycle',
    title: 'Профилактика стиралки: прогон 90°C со средством от накипи (M)',
    description: 'Засыпать средство для очистки барабана или лимонную кислоту, запустить пустой цикл кипячения',
    category: 'monthly',
    estimatedMinutes: 8,
    disgustFactor: 1.0,
    zone: 'laundry',
    checklist: ['Засыпать очиститель стиральных машин в барабан', 'Выбрать режим хлопок 90°C без отжима (холостой пуск)', 'После завершения протереть манжету и оставить дверцу приоткрытой'],
    dayOfCycle: 26,
    status: 'available',
  });

  tasks.push({
    id: 'day26-task-supplies',
    title: 'Ревизия бытовой химии, мусорных пакетов и губок',
    description: 'Проверить остатки таблеток для ПММ/порошка, составить список покупок расходников на новый цикл',
    category: 'monthly',
    estimatedMinutes: 5,
    disgustFactor: 1.0,
    zone: 'kitchen',
    checklist: ['Проверить запас моющих средств и губок', 'Проверить запас мусорных пакетов', 'Записать нужное в список покупок'],
    dayOfCycle: 26,
    status: 'available',
  });

  // День 27 (Пт): Итоговые полы цикла
  tasks.push({
    id: 'day27-task-cycle-floor',
    title: 'Финальные чистые полы цикла со свежим ароматом',
    description: 'Мытьё полов с добавлением ароматного кондиционера для пола по всей квартире перед завершением 28 дней',
    category: 'monthly',
    estimatedMinutes: 15,
    disgustFactor: 1.0,
    zone: 'living',
    checklist: ['Влажная швабра по спальне и гостиной', 'Мытье пола в прихожей и санузле', 'Проветрить квартиру свежим воздухом'],
    dayOfCycle: 27,
    status: 'available',
  });

  // День 28 (Сб): Празднование и сброс цикла
  tasks.push({
    id: 'day28-task-cycle-reset',
    title: 'Подведение итогов 28 дней и разблокировка награды! 🏆',
    description: 'Поздравить друг друга, сверить честный баланс очков и насладиться чистотой дома!',
    category: 'monthly',
    estimatedMinutes: 5,
    disgustFactor: 1.0,
    zone: 'living',
    checklist: ['Проверить выполнение семейной кооп-цели', 'Наградить друг друга заслуженным отдыхом/ужином', 'Запустить новый цикл'],
    dayOfCycle: 28,
    status: 'available',
  });

  return tasks;
}

/**
 * Generates badges adapted to the apartment configuration
 */
export function generateBadgesForConfig(config: ApartmentConfig, isNewApartment = false): Badge[] {
  const badges: Badge[] = [
    {
      id: 'first_step',
      title: 'Первый шаг',
      description: 'Выполнить первую задачу цикла уборки',
      icon: 'Sparkles',
      progress: isNewApartment ? 0 : 1,
      maxProgress: 1,
      isUnlocked: !isNewApartment,
      unlockedAt: isNewApartment ? undefined : '2026-09-02',
    },
    {
      id: 'streak_week',
      title: 'Идеальная неделя',
      description: '7 дней подряд закрывать все плановые задачи',
      icon: 'Flame',
      progress: isNewApartment ? 0 : 7,
      maxProgress: 7,
      isUnlocked: !isNewApartment,
      unlockedAt: isNewApartment ? undefined : '2026-09-08',
    },
    {
      id: 'sanitary',
      title: 'Санитар',
      description: 'Вымыть санузел 10 раз',
      icon: 'ShieldCheck',
      progress: isNewApartment ? 0 : 6,
      maxProgress: 10,
      isUnlocked: false,
    },
    {
      id: 'fat_fighter',
      title: 'Жироборец',
      description: 'Очистить духовку и вытяжку в один день',
      icon: 'FlameKindling',
      progress: 0,
      maxProgress: 1,
      isUnlocked: false,
    },
  ];

  // Specific badges for pets
  if (config.petType === 'cat' || config.petType === 'both') {
    badges.push({
      id: 'cat_god',
      title: 'Кошачий бог',
      description: 'Закрыть 30 задач по уходу за кошкой, лотком и шерстью',
      icon: 'Cat',
      progress: isNewApartment ? 0 : 19,
      maxProgress: 30,
      isUnlocked: false,
    });
  }

  if (config.petType === 'dog' || config.petType === 'both') {
    badges.push({
      id: 'dog_champion',
      title: 'Друг хвостатых',
      description: 'Закрыть 20 задач по мытью лап, лежанки и уходу за собакой',
      icon: 'Dog',
      progress: isNewApartment ? 0 : 5,
      maxProgress: 20,
      isUnlocked: false,
    });
  }

  badges.push({
    id: 'dark_knight',
    title: 'Тёмный рыцарь',
    description: 'Победить мёртвые зоны (за стиралкой, под диваном) 3 раза',
    icon: 'Ghost',
    progress: isNewApartment ? 0 : 2,
    maxProgress: 3,
    isUnlocked: false,
  });

  badges.push({
    id: 'early_bird',
    title: 'Ранняя пташка',
    description: 'Выполнить плановую задачу до 9:00 утра',
    icon: 'Sunrise',
    progress: isNewApartment ? 0 : 1,
    maxProgress: 1,
    isUnlocked: !isNewApartment,
    unlockedAt: isNewApartment ? undefined : '2026-09-11',
  });

  return badges;
}
