const goodMorningSrc = new URL(
  '../../pharases/Доброе утро_ Кий-Бий_ Я рад снова видеть всех вас в этом пре.mp3',
  import.meta.url,
).href;

const breakfastAssemblySrc = new URL(
  '../../pharases/Друзья_ Строимся на трапезу_ Кто опоздает - тот не ест_.mp3',
  import.meta.url,
).href;

const secondBreakfastSrc = new URL(
  '../../pharases/Кто хочет кушать_ Построение на веранде_ Второй завтрак.mp3',
  import.meta.url,
).href;

const lunchAssemblySrc = new URL(
  '../../pharases/Пора обедать_ Кстати_ кто опоздает на построение - тот отдае.mp3',
  import.meta.url,
).href;

const quietHourEndedSrc = new URL(
  '../../pharases/Ребята_ тихий час - окончен_ Наводим порядок в своих комната (1).mp3',
  import.meta.url,
).href;

const roomCheckSrc = new URL(
  '../../pharases/Строимся на проверку комнат_ Надеюсь_ вы хорошо убрались..mp3',
  import.meta.url,
).href;

const dinnerAssemblySrc = new URL(
  '../../pharases/Ужин не ждет тех кто любит прийти последним_ Строимся на рез.mp3',
  import.meta.url,
).href;

const verandaAssemblySrc = new URL(
  '../../pharases/Построение на веранде_ Сдаем телефоны_.mp3',
  import.meta.url,
).href;

const goodNightSrc = new URL(
  '../../pharases/Кий-Бий_Спокойной_Ночи.mp3',
  import.meta.url,
).href;

const readyForSleepSrc = new URL(
  '../../pharases/Готовимся ко сну_ ребята_ чистим зубки и надеваем пижамки_.mp3',
  import.meta.url,
).href;

const elasticAssemblySrc = new URL(
  '../../pharases/Ребята_ строимся на резинке_ Кто придет последний - круг поч.mp3',
  import.meta.url,
).href;

const afternoonSnackSrc = new URL(
  '../../pharases/Ребята_ если вы вдруг проголодались_ то сейчас вас ждет полд.mp3',
  import.meta.url,
).href;

export const DEFAULT_ANNOUNCEMENT_SETTINGS = {
  breakfastLeadMinutes: 7,
  mealLeadMinutes: 15,
  secondBreakfastLeadMinutes: 7,
};

export function createAnnouncementPlan(settings = DEFAULT_ANNOUNCEMENT_SETTINGS) {
  const breakfastLeadMinutes =
    Number.isFinite(settings.breakfastLeadMinutes) && settings.breakfastLeadMinutes >= 0
      ? settings.breakfastLeadMinutes
      : DEFAULT_ANNOUNCEMENT_SETTINGS.breakfastLeadMinutes;

  const mealLeadMinutes =
    Number.isFinite(settings.mealLeadMinutes) && settings.mealLeadMinutes >= 0
      ? settings.mealLeadMinutes
      : DEFAULT_ANNOUNCEMENT_SETTINGS.mealLeadMinutes;

  const secondBreakfastLeadMinutes =
    Number.isFinite(settings.secondBreakfastLeadMinutes) &&
    settings.secondBreakfastLeadMinutes >= 0
      ? settings.secondBreakfastLeadMinutes
      : DEFAULT_ANNOUNCEMENT_SETTINGS.secondBreakfastLeadMinutes;

  return [
    {
      id: 'good-morning',
      eventTitle: 'Подъем',
      triggerType: 'start',
      audioSrc: goodMorningSrc,
      orbTitle: 'Доброе утро',
      orbText: 'Начинаем новый день вместе.',
    },
    {
      id: 'breakfast-assembly',
      eventTitle: 'Завтрак',
      triggerType: 'before-start',
      leadMinutes: breakfastLeadMinutes,
      audioSrc: breakfastAssemblySrc,
      orbTitle: 'Строимся на завтрак',
      orbText: 'Сбор до начала трапезы.',
    },
    // {
    //   id: 'morning-room-check',
    //   eventTitle: 'Проверка уборки',
    //   triggerType: 'before-end',
    //   leadMinutes: 5,
    //   audioSrc: roomCheckSrc,
    //   orbTitle: 'Проверка уборки',
    //   orbText: 'Строимся на утреннюю проверку комнат.',
    // },
    {
      id: 'elastic-assembly',
      eventTitle: 'Баскетбольное поле и спортзал',
      triggerType: 'before-start',
      leadMinutes: 15,
      audioSrc: elasticAssemblySrc,
      orbTitle: 'Строимся на резинке',
      orbText: 'До начала спорта осталось пятнадцать минут.',
    },
    {
      id: 'second-breakfast-assembly',
      eventTitle: 'Второй завтрак',
      triggerType: 'before-start',
      leadMinutes: secondBreakfastLeadMinutes,
      audioSrc: secondBreakfastSrc,
      orbTitle: 'Построение на веранде',
      orbText: 'Второй завтрак скоро начнется.',
    },
    {
      id: 'lunch-assembly',
      eventTitle: 'Обед',
      triggerType: 'before-start',
      leadMinutes: mealLeadMinutes,
      audioSrc: lunchAssemblySrc,
      orbTitle: 'Строимся на обед',
      orbText: 'До обеда осталось совсем немного.',
    },
    {
      id: 'quiet-hour-ended',
      eventTitle: 'Тихий час',
      triggerType: 'end',
      audioSrc: quietHourEndedSrc,
      orbTitle: 'Тихий час окончен',
      orbText: 'Пора наводить порядок в комнатах.',
    },
    {
      id: 'room-check-assembly',
      eventTitle: 'Уборка',
      triggerType: 'end',
      audioSrc: roomCheckSrc,
      orbTitle: 'Строимся на проверку комнат',
      orbText: 'Уборка завершилась, готовимся к проверке.',
    },
    {
      id: 'afternoon-snack',
      eventTitle: 'Полдник',
      triggerType: 'before-start',
      leadMinutes: 7,
      audioSrc: afternoonSnackSrc,
      orbTitle: 'Полдник скоро начнется',
      orbText: 'Если проголодались, самое время собираться.',
    },
    {
      id: 'dinner-assembly',
      eventTitle: 'Ужин',
      triggerType: 'before-start',
      leadMinutes: mealLeadMinutes,
      audioSrc: dinnerAssemblySrc,
      orbTitle: 'Строимся на ужин',
      orbText: 'Ужин уже близко, собираемся заранее.',
    },
    {
      id: 'veranda-assembly',
      eventTitle: 'Телефоны, сладкий шкаф',
      triggerType: 'end',
      audioSrc: verandaAssemblySrc,
      orbTitle: 'Построение на веранде',
      orbText: 'Сдаем телефоны и собираемся вовремя.',
    },
    {
      id: 'ready-for-sleep',
      eventTitle: 'Готовимся ко сну',
      triggerType: 'start',
      audioSrc: readyForSleepSrc,
      orbTitle: 'Готовимся ко сну',
      orbText: 'Чистим зубы и надеваем пижамы.',
    },
    {
      id: 'good-night',
      eventTitle: 'Отбой',
      triggerType: 'start',
      audioSrc: goodNightSrc,
      orbTitle: 'Спокойной ночи',
      orbText: 'Отбой пробил, лагерь уходит отдыхать.',
    },
  ];
}
