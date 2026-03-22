import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'qq' | 'ru';

const translations = {
  app_name: { qq: 'EDawis', ru: 'EDawis' },
  app_subtitle: { qq: 'Жасырын даўыс бериў системасы', ru: 'Система тайного голосования' },
  admin_panel: { qq: 'Хаткер панели', ru: 'Панель секретаря' },
  dashboard: { qq: 'Басты бет', ru: 'Главная' },
  members: { qq: 'Ағзалар', ru: 'Участники' },
  meetings: { qq: 'Мәжилислер', ru: 'Заседания' },
  active_votes: { qq: 'Актив даўыс бериў', ru: 'Активные голосования' },
  add_member: { qq: 'Ағза қосыў', ru: 'Добавить участника' },
  delete: { qq: 'Өшириў', ru: 'Удалить' },
  full_name: { qq: 'Аты-жөни', ru: 'ФИО' },
  pin_code: { qq: 'PIN код', ru: 'PIN код' },
  registered: { qq: 'Дизимнен өткен', ru: 'Зарегистрирован' },
  pending: { qq: 'Күтилмекте', ru: 'Ожидается' },
  new_meeting: { qq: 'Жаңа мәжилис', ru: 'Новое заседание' },
  date: { qq: 'Сәне', ru: 'Дата' },
  protocol_number: { qq: 'Протокол номери', ru: 'Номер протокола' },
  attendees: { qq: 'Қатнасыўшылар', ru: 'Присутствующие' },
  select_all: { qq: 'Бәрин белгилеў', ru: 'Выбрать всех' },
  questions: { qq: 'Даўысқа қойылған мәселе', ru: 'Вопросы на голосование' },
  add_question: { qq: 'Мәселе қосыў', ru: 'Добавить вопрос' },
  start_voting: { qq: 'Даўыс бериўди баслаў', ru: 'Начать голосование' },
  stop_voting: { qq: 'Тоқтатыў', ru: 'Остановить' },
  vote_for: { qq: '✅ Қосыламан', ru: '✅ За' },
  vote_against: { qq: '❌ Қарсыман', ru: '❌ Против' },
  vote_abstain: { qq: '⬜ Бийтәреп', ru: '⬜ Воздержался' },
  accepted: { qq: 'ҚАРАР ҚАБЫЛ ЕТИЛДИ', ru: 'РЕШЕНИЕ ПРИНЯТО' },
  rejected: { qq: 'ҚАРАР ҚАБЫЛ ЕТИЛМЕДИ', ru: 'РЕШЕНИЕ НЕ ПРИНЯТО' },
  tie: { qq: 'ДАЎЫСЛАР ТЕҢ', ru: 'ГОЛОСА РАВНЫ' },
  all_voted: { qq: 'Барлық мәселелерге даўыс бердиңиз. Рахмет!', ru: 'Вы проголосовали по всем вопросам. Спасибо!' },
  no_active_votes: { qq: 'Актив даўыс бериў жоқ', ru: 'Нет активных голосований' },
  already_voted: { qq: 'Сиз даўыс бергенсиз', ru: 'Вы уже проголосовали' },
  enter_pin: { qq: 'PIN кодыңызды киргизиң', ru: 'Введите ваш PIN код' },
  login: { qq: 'Кириў', ru: 'Войти' },
  logout: { qq: 'Шығыў', ru: 'Выйти' },
  register_admin: { qq: 'Админ аккаунтын жаратыў', ru: 'Создать аккаунт админа' },
  username: { qq: 'Логин', ru: 'Логин' },
  password: { qq: 'Пароль', ru: 'Пароль' },
  confirm_password: { qq: 'Паролди тастыйықлаң', ru: 'Подтвердите пароль' },
  change_password: { qq: 'Паролди өзгертиў', ru: 'Изменить пароль' },
  settings: { qq: 'Баптаўлар', ru: 'Настройки' },
  download_report: { qq: 'Есабат жүклеў', ru: 'Скачать отчёт' },
  download_template: { qq: 'Шаблон жүклеў', ru: 'Скачать шаблон' },
  upload_xlsx: { qq: 'xlsx жүклеў', ru: 'Загрузить xlsx' },
  status: { qq: 'Статус', ru: 'Статус' },
  back: { qq: 'Артқа', ru: 'Назад' },
  total: { qq: 'Жәми', ru: 'Итого' },
  chairman: { qq: 'Баслық', ru: 'Председатель' },
  secretary: { qq: 'Хаткер', ru: 'Секретарь' },
  report_title: { qq: 'ЖАСЫРЫН ДАЎЫС БЕРИЎ НӘТИЙЖЕЛЕРИ', ru: 'РЕЗУЛЬТАТЫ ТАЙНОГО ГОЛОСОВАНИЯ' },
  admin_exists: { qq: 'Админ аккаунты бар', ru: 'Аккаунт админа уже существует' },
  not_in_list: { qq: 'Сиз қатнасыўшылар дизиминде жоқсыз', ru: 'Вас нет в списке присутствующих' },
  pin_not_found: { qq: 'PIN табылмады', ru: 'PIN не найден' },
  pin_bound_other: { qq: 'Бул PIN басқа аккаунтқа байланған', ru: 'Этот PIN привязан к другому аккаунту' },
  loading: { qq: 'Жүкленбекте...', ru: 'Загрузка...' },
  voter: { qq: 'Кеңес ағзасы', ru: 'Член совета' },
  admin: { qq: 'Хаткер (Админ)', ru: 'Секретарь (Админ)' },
  admin_login: { qq: 'Админ кириси', ru: 'Вход для админа' },
  welcome: { qq: 'Хош келдиңиз', ru: 'Добро пожаловать' },
  error: { qq: 'Қәте', ru: 'Ошибка' },
  wrong_password: { qq: 'Қәте пароль', ru: 'Неверный пароль' },
  checking: { qq: 'Тексерилмекте...', ru: 'Проверка...' },
  create: { qq: 'Жаратыў', ru: 'Создать' },
  add: { qq: 'Қосыў', ru: 'Добавить' },
  question_added: { qq: 'Мәселе қосылды', ru: 'Вопрос добавлен' },
  meeting_created: { qq: 'Мәжилис жаратылды', ru: 'Заседание создано' },
  member_added: { qq: 'Ағза қосылды', ru: 'Участник добавлен' },
  pin_generated: { qq: 'PIN код жаратылды: {pin}', ru: 'Сгенерирован PIN код: {pin}' },
  deleted: { qq: 'Өширилди', ru: 'Удалено' },
  voting_started: { qq: 'Даўыс бериў басланды!', ru: 'Голосование началось!' },
  voting_stopped: { qq: 'Даўыс бериў тоқтатылды', ru: 'Голосование остановлено' },
  vote_accepted: { qq: 'Даўысыңыз қабыл етилди!', ru: 'Ваш голос принят!' },
  vote_not_possible: { qq: 'Даўыс бериў мүмкин емес', ru: 'Голосование невозможно' },
  select_attendees_first: { qq: 'Алдын ала қатнасыўшыларды белгилең', ru: 'Сначала отметьте присутствующих' },
  voted: { qq: 'даўыс берди', ru: 'проголосовали' },
  not_voted: { qq: 'даўыс бермеди', ru: 'не проголосовали' },
  no_questions: { qq: 'Мәселелер жоқ', ru: 'Вопросов нет' },
  no_meetings: { qq: 'Мәжилислер жоқ', ru: 'Заседаний нет' },
  no_members: { qq: 'Ағзалар жоқ', ru: 'Участников нет' },
  meeting_not_found: { qq: 'Мәжилис табылмады', ru: 'Заседание не найдено' },
  new_question_placeholder: { qq: 'Жаңа мәселе текстин киргизиң', ru: 'Введите текст нового вопроса' },
  date_placeholder: { qq: 'Сәне (мыс. 22.03.2026)', ru: 'Дата (напр. 22.03.2026)' },
  delete_member_confirm: { qq: 'ағзасын өширесиз бе?', ru: 'Удалить участника?' },
  delete_meeting_confirm: { qq: 'Мәжилисти өширесиз бе?', ru: 'Удалить заседание?' },
  delete_question_confirm: { qq: 'Мәселени өширесиз бе?', ru: 'Удалить вопрос?' },
  duplicate_pin: { qq: 'Бул PIN аллақашан бар', ru: 'Этот PIN уже существует' },
  import_result: { qq: 'Қосылды: {added}, Өткизилди (дубликат PIN): {skipped}', ru: 'Добавлено: {added}, Пропущено (дубликат PIN): {skipped}' },
  import_error: { qq: 'Импорт қәтеси', ru: 'Ошибка импорта' },
  report_downloaded: { qq: 'Есабат жүклеп алынды', ru: 'Отчёт скачан' },
  voted_check: { qq: 'Даўыс берилди ✓', ru: 'Проголосовано ✓' },
  meeting_label: { qq: 'Мәжилис', ru: 'Заседание' },
  question_label: { qq: 'мәселе', ru: 'вопрос' },
  closed_label: { qq: 'жабық', ru: 'закрыто' },
  passwords_mismatch: { qq: 'Парольлер сәйкес келмейди', ru: 'Пароли не совпадают' },
  password_changed: { qq: 'Пароль өзгертилди', ru: 'Пароль изменён' },
  current_password: { qq: 'Ағымдағы пароль', ru: 'Текущий пароль' },
  new_password: { qq: 'Жаңа пароль', ru: 'Новый пароль' },
  for_label: { qq: 'Қосыламан', ru: 'За' },
  against_label: { qq: 'Қарсыман', ru: 'Против' },
  abstain_label: { qq: 'Бийтәреп', ru: 'Воздержался' },
  result_label: { qq: 'Нәтийже', ru: 'Результат' },
  report_attendees_count: { qq: 'Қатнасыўшылар саны', ru: 'Количество присутствующих' },
  control_panel: { qq: 'Басқарыў панели', ru: 'Панель управления' },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'qq',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('edawis_lang') as Lang) || 'qq';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('edawis_lang', l);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = translations[key]?.[lang] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
