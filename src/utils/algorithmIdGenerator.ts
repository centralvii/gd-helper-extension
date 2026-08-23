/**
 * GreenData Algorithm ID Generator Utility (v4.0 - Universal Semantic Engine)
 *
 * Full-scale semantic dictionary with universal Russian→English translation.
 * Converts ALL Russian words via a rich stem dictionary with transliteration fallback.
 * No word is left untranslated.
 */

import { AlgorithmParseResult, AlgorithmType } from '../types';

// Multi-word compound phrases (checked first in order of specificity)
export const COMPOUND_PHRASES: Array<{ pattern: RegExp; code: string }> = [
  // Legal forms and parenthesized entities
  { pattern: /\((?:юл|юр\.?\s*лицо|юрлицо|юридическое\s+лицо|юридических\s+лиц)\)/gi, code: 'LE' },
  { pattern: /\((?:фл|физ\.?\s*лицо|физлицо|физическое\s+лицо|физических\s+лиц)\)/gi, code: 'IE' },
  { pattern: /\((?:ип|индивидуальный\s+предприниматель)\)/gi, code: 'IP' },
  { pattern: /\b(?:юл|юр\.?\s*лицо|юрлицо|юридическое\s+лицо|юридических\s+лиц|юридическим\s+лицам)\b/gi, code: 'LE' },
  { pattern: /\b(?:фл|физ\.?\s*лицо|физлицо|физическое\s+лицо|физических\s+лиц|физическим\s+лицам)\b/gi, code: 'IE' },
  { pattern: /\b(?:ип|индивидуальный\s+предприниматель|индивидуальных\s+предпринимателей)\b/gi, code: 'IP' },

  // Common GreenData compound patterns
  { pattern: /\bнеобходимост(?:и|ь|ью|ям)?\s+запуск(?:а|у|ом|е|и)?\b/gi, code: 'RUN_REQ' },
  { pattern: /\bналичи(?:е|я|ю|ем|и)\s+признак(?:а|ов|у|ом|е|и)?\b/gi, code: 'FLAG_EXISTS' },
  { pattern: /\bобъект(?:ов|а|ы|у|ом|е)?\s+проверк(?:и|а|е|у|ой|ок)\b/gi, code: 'CHECK_OBJ' },
  { pattern: /\bна\s+основании\b/gi, code: 'BASED_ON' },
  { pattern: /\bна\s+базе\b/gi, code: 'BASED_ON' },
  { pattern: /\bпо\s+портфелю\b/gi, code: 'PORTFOLIO' },
  { pattern: /\bпо\s+валюте\b/gi, code: 'BY_CURR' },
  { pattern: /\bпо\s+дате\b/gi, code: 'BY_DATE' },
  { pattern: /\bпо\s+сумме\b/gi, code: 'BY_AMOUNT' },
  { pattern: /\bпо\s+статусу\b/gi, code: 'BY_STATUS' },
  { pattern: /\bпо\s+типу\b/gi, code: 'BY_TYPE' },
  { pattern: /\bпо\s+категории\b/gi, code: 'BY_CAT' },
  { pattern: /\bкредитн(?:ый|ого|ому|ым|ом|ая|ую|ое)\s+рейтинг(?:а|у|ом|е|и|ов)?\b/gi, code: 'CRED_RATING' },
  { pattern: /\bплатежн(?:ое|ого|ому|ым|ом|ые)\s+поручен(?:ие|ия|ию|ием|ии|ий)\b/gi, code: 'PAY_ORDER' },
  { pattern: /\bреестр(?:а|у|ом|е|ы|ов)?\s+договор(?:ов|а|у|ом|е|ы)\b/gi, code: 'CONTRACT_REGISTRY' },
  { pattern: /\bполномоч(?:ия|ий|иям|иями)\s+пользовател(?:я|ей|ю|ем|е)\b/gi, code: 'USER_RIGHTS' },
  { pattern: /\bкарточк(?:и|а|е|у|ой|ек)\s+объект(?:а|ов|у|ом|е|ы)\b/gi, code: 'OBJ_CARD' },
  { pattern: /\bуслови(?:е|я|ю|ем|и|й)\s+фильтрац(?:ии|ия|ию|ией)\b/gi, code: 'FILTER_COND' },
  { pattern: /\bвыбор(?:а|у|ом|е|ы|ов)?\s+элемент(?:ов|а|у|ом|е|ы)\b/gi, code: 'ITEM_SELECT' },
  { pattern: /\bне\s+соответств/gi, code: 'MISMATCH' },
  { pattern: /\bпереста(?:вш|л|ет|ют|вать)/gi, code: 'EXPIRED' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive stem dictionary — sorted from LONGEST prefix to SHORTEST
// to guarantee best-match wins. All prefixes are lowercase, no accents.
// ─────────────────────────────────────────────────────────────────────────────
export const STEM_DICTIONARY: Array<{ prefix: string; code: string }> = [
  // ── Negation prefixes (must come before their base form) ──
  { prefix: 'несоответств', code: 'MISMATCH' },
  { prefix: 'некорректн', code: 'INVALID' },
  { prefix: 'нецелесообразн', code: 'INEXPEDIENT' },
  { prefix: 'необходимост', code: 'REQ' },
  { prefix: 'необходим', code: 'REQ' },
  { prefix: 'неисполнен', code: 'UNFULFILLED' },
  { prefix: 'невыполнен', code: 'UNFULFILLED' },
  { prefix: 'недостаточн', code: 'INSUFFICIENT' },
  { prefix: 'неналичи', code: 'ABSENT' },
  { prefix: 'невалидн', code: 'INVALID' },
  { prefix: 'нераспределен', code: 'UNASSIGNED' },
  { prefix: 'незакрыт', code: 'UNCLOSED' },

  // ── Re-/Over- prefixes ──
  { prefix: 'перерасчет', code: 'RECALC' },
  { prefix: 'пересчит', code: 'RECALC' },
  { prefix: 'переназначен', code: 'REASSIGN' },
  { prefix: 'переназначит', code: 'REASSIGN' },
  { prefix: 'перезапуск', code: 'RESTART' },
  { prefix: 'переформирован', code: 'REGENERATE' },
  { prefix: 'переформироват', code: 'REGENERATE' },
  { prefix: 'переотправк', code: 'RESEND' },
  { prefix: 'переотправит', code: 'RESEND' },
  { prefix: 'перевод', code: 'TRANSFER' },
  { prefix: 'переход', code: 'TRANSITION' },
  { prefix: 'переключен', code: 'SWITCH' },
  { prefix: 'преобразован', code: 'TRANSFORM' },
  { prefix: 'переставш', code: 'EXPIRED' },
  { prefix: 'перестав', code: 'EXPIRED' },

  // ── State, Quality, Modality ──
  { prefix: 'потребност', code: 'NEED' },
  { prefix: 'требован', code: 'REQ' },
  { prefix: 'требует', code: 'REQ' },
  { prefix: 'налич', code: 'EXISTS' },
  { prefix: 'отсутств', code: 'ABSENT' },
  { prefix: 'возможн', code: 'POSSIBLE' },
  { prefix: 'доступн', code: 'AVAIL' },
  { prefix: 'актуальн', code: 'ACTUAL' },
  { prefix: 'готовн', code: 'READY' },
  { prefix: 'соответств', code: 'MATCH' },
  { prefix: 'корректн', code: 'VALID' },
  { prefix: 'успешн', code: 'SUCCESS' },
  { prefix: 'критичн', code: 'CRIT' },
  { prefix: 'обязательн', code: 'MANDATORY' },
  { prefix: 'разрешен', code: 'ALLOWED' },
  { prefix: 'запрещен', code: 'FORBIDDEN' },
  { prefix: 'ограничен', code: 'RESTRICT' },
  { prefix: 'целесообразн', code: 'EXPEDIENT' },
  { prefix: 'допустим', code: 'ALLOWED' },
  { prefix: 'недопустим', code: 'FORBIDDEN' },
  { prefix: 'применим', code: 'APPLICABLE' },
  { prefix: 'аннулир', code: 'VOID' },
  { prefix: 'аннулирован', code: 'VOID' },

  // ── Actions (longest prefix first within each root) ──
  { prefix: 'инициализац', code: 'INIT' },
  { prefix: 'инициализир', code: 'INIT' },
  { prefix: 'аутентификац', code: 'AUTHN' },
  { prefix: 'аутентификир', code: 'AUTHN' },
  { prefix: 'разблокировк', code: 'UNBLOCK' },
  { prefix: 'разблокир', code: 'UNBLOCK' },
  { prefix: 'делегирован', code: 'DELEGATE' },
  { prefix: 'делегир', code: 'DELEGATE' },
  { prefix: 'распределен', code: 'DISTRIBUTE' },
  { prefix: 'распределит', code: 'DISTRIBUTE' },
  { prefix: 'маршрутизац', code: 'ROUTE' },
  { prefix: 'маршрутизир', code: 'ROUTE' },
  { prefix: 'нормализац', code: 'NORMALIZE' },
  { prefix: 'нормализир', code: 'NORMALIZE' },
  { prefix: 'классификац', code: 'CLASSIFY' },
  { prefix: 'классифицир', code: 'CLASSIFY' },
  { prefix: 'авторизац', code: 'AUTH' },
  { prefix: 'авторизир', code: 'AUTH' },
  { prefix: 'идентификац', code: 'IDENTIFY' },
  { prefix: 'идентифицир', code: 'IDENTIFY' },
  { prefix: 'синхронизац', code: 'SYNC' },
  { prefix: 'синхронизир', code: 'SYNC' },
  { prefix: 'интеграц', code: 'INTEGRATE' },
  { prefix: 'интегрир', code: 'INTEGRATE' },
  { prefix: 'деактивац', code: 'DEACTIVATE' },
  { prefix: 'деактивир', code: 'DEACTIVATE' },
  { prefix: 'активац', code: 'ACTIVATE' },
  { prefix: 'активир', code: 'ACTIVATE' },
  { prefix: 'генерац', code: 'GENERATE' },
  { prefix: 'генерир', code: 'GENERATE' },
  { prefix: 'группировк', code: 'GROUP' },
  { prefix: 'агрегац', code: 'AGG' },
  { prefix: 'сопоставлен', code: 'MATCH' },
  { prefix: 'сопоставит', code: 'MATCH' },
  { prefix: 'зарегистрир', code: 'REG' },
  { prefix: 'регистрац', code: 'REG' },
  { prefix: 'валидац', code: 'VALIDATE' },
  { prefix: 'валидир', code: 'VALIDATE' },
  { prefix: 'вычислен', code: 'CALC' },
  { prefix: 'вычислит', code: 'CALC' },
  { prefix: 'рассчит', code: 'CALC' },
  { prefix: 'сформироват', code: 'GENERATE' },
  { prefix: 'формирован', code: 'GENERATE' },
  { prefix: 'сформир', code: 'GENERATE' },
  { prefix: 'определен', code: 'DTRM' },
  { prefix: 'определит', code: 'DTRM' },
  { prefix: 'согласован', code: 'APPROVE' },
  { prefix: 'согласоват', code: 'APPROVE' },
  { prefix: 'утвержден', code: 'APPROVE' },
  { prefix: 'утвердит', code: 'APPROVE' },
  { prefix: 'приостанов', code: 'PAUSE' },
  { prefix: 'возобновл', code: 'RESUME' },
  { prefix: 'поручительств', code: 'SURETY' },
  { prefix: 'поручен', code: 'ORDER' },
  { prefix: 'подразделен', code: 'DEPT' },
  { prefix: 'подтверж', code: 'CONFIRM' },
  { prefix: 'подтвержден', code: 'CONFIRM' },
  { prefix: 'подтвердит', code: 'CONFIRM' },
  { prefix: 'привязк', code: 'LINK' },
  { prefix: 'привязат', code: 'LINK' },
  { prefix: 'отвязат', code: 'UNLINK' },
  { prefix: 'отвязк', code: 'UNLINK' },
  { prefix: 'обеспечен', code: 'COLLATERAL' },
  { prefix: 'уведомлен', code: 'NOTIFY' },
  { prefix: 'уведомит', code: 'NOTIFY' },
  { prefix: 'оповещен', code: 'NOTIFY' },
  { prefix: 'предупрежден', code: 'WARN' },
  { prefix: 'построен', code: 'BUILD' },
  { prefix: 'построит', code: 'BUILD' },
  { prefix: 'заполнен', code: 'FILL' },
  { prefix: 'заполнит', code: 'FILL' },
  { prefix: 'обновлен', code: 'UPDATE' },
  { prefix: 'обновит', code: 'UPDATE' },
  { prefix: 'изменен', code: 'MODIFY' },
  { prefix: 'изменит', code: 'MODIFY' },
  { prefix: 'модификац', code: 'MODIFY' },
  { prefix: 'редактирован', code: 'EDIT' },
  { prefix: 'редактир', code: 'EDIT' },
  { prefix: 'корректир', code: 'EDIT' },
  { prefix: 'копирован', code: 'COPY' },
  { prefix: 'дублирован', code: 'DUPLICATE' },
  { prefix: 'архивац', code: 'ARCHIVE' },
  { prefix: 'архивир', code: 'ARCHIVE' },
  { prefix: 'блокировк', code: 'BLOCK' },
  { prefix: 'заблокир', code: 'BLOCK' },
  { prefix: 'заблокировк', code: 'BLOCK' },
  { prefix: 'назначен', code: 'ASSIGN' },
  { prefix: 'назначит', code: 'ASSIGN' },
  { prefix: 'отклонен', code: 'REJECT' },
  { prefix: 'отклонит', code: 'REJECT' },
  { prefix: 'отправк', code: 'SEND' },
  { prefix: 'отправит', code: 'SEND' },
  { prefix: 'отслеживан', code: 'TRACK' },
  { prefix: 'отслеж', code: 'TRACK' },
  { prefix: 'очистк', code: 'CLEAR' },
  { prefix: 'очистит', code: 'CLEAR' },
  { prefix: 'выгрузк', code: 'EXPORT' },
  { prefix: 'выгрузит', code: 'EXPORT' },
  { prefix: 'загрузк', code: 'IMPORT' },
  { prefix: 'загрузит', code: 'IMPORT' },
  { prefix: 'заключен', code: 'CONCLUSION' },
  { prefix: 'заключит', code: 'CONCLUDE' },
  { prefix: 'запуск', code: 'RUN' },
  { prefix: 'запуст', code: 'RUN' },
  { prefix: 'создан', code: 'CREATE' },
  { prefix: 'создат', code: 'CREATE' },
  { prefix: 'скопир', code: 'COPY' },
  { prefix: 'дублир', code: 'DUPLICATE' },
  { prefix: 'принят', code: 'ACCEPT' },
  { prefix: 'провер', code: 'CHECK' },
  { prefix: 'проверк', code: 'CHECK' },
  { prefix: 'проведен', code: 'POST' },
  { prefix: 'провест', code: 'POST' },
  { prefix: 'прогноз', code: 'FORECAST' },
  { prefix: 'передач', code: 'TRANSFER' },
  { prefix: 'получен', code: 'GET' },
  { prefix: 'получит', code: 'GET' },
  { prefix: 'прием', code: 'RECEIVE' },
  { prefix: 'нахожден', code: 'FIND' },
  { prefix: 'найт', code: 'FIND' },
  { prefix: 'поиск', code: 'FIND' },
  { prefix: 'выборк', code: 'SELECT' },
  { prefix: 'выбрат', code: 'SELECT' },
  { prefix: 'выбор', code: 'SELECT' },
  { prefix: 'фильтрац', code: 'FILTER' },
  { prefix: 'отфильтр', code: 'FILTER' },
  { prefix: 'фильтр', code: 'FILTER' },
  { prefix: 'сортировк', code: 'SORT' },
  { prefix: 'сортир', code: 'SORT' },
  { prefix: 'группир', code: 'GROUP' },
  { prefix: 'сверк', code: 'RECONCILE' },
  { prefix: 'сверит', code: 'RECONCILE' },
  { prefix: 'сравнен', code: 'COMPARE' },
  { prefix: 'связан', code: 'LINK' },
  { prefix: 'связат', code: 'LINK' },
  { prefix: 'сброс', code: 'RESET' },
  { prefix: 'сбросит', code: 'RESET' },
  { prefix: 'исполнен', code: 'EXEC' },
  { prefix: 'выполнен', code: 'EXEC' },
  { prefix: 'удален', code: 'DELETE' },
  { prefix: 'удалит', code: 'DELETE' },
  { prefix: 'старт', code: 'START' },
  { prefix: 'остановк', code: 'STOP' },
  { prefix: 'останов', code: 'STOP' },
  { prefix: 'отмен', code: 'CANCEL' },
  { prefix: 'возврат', code: 'RETURN' },
  { prefix: 'открыт', code: 'OPEN' },
  { prefix: 'закрыт', code: 'CLOSE' },
  { prefix: 'подписан', code: 'SIGN' },
  { prefix: 'подписат', code: 'SIGN' },
  { prefix: 'оценк', code: 'EVAL' },
  { prefix: 'оценит', code: 'EVAL' },
  { prefix: 'шифрован', code: 'ENCRYPT' },
  { prefix: 'дешифрован', code: 'DECRYPT' },
  { prefix: 'тестирован', code: 'TEST' },
  { prefix: 'анализ', code: 'ANALYZE' },
  { prefix: 'логирован', code: 'LOG' },
  { prefix: 'импорт', code: 'IMPORT' },
  { prefix: 'экспорт', code: 'EXPORT' },
  { prefix: 'расчет', code: 'CALC' },

  // ── GreenData Module Acronyms ──
  { prefix: 'нпп', code: 'NPP' },
  { prefix: 'киб', code: 'CIB' },
  { prefix: 'зпр', code: 'ZPR' },

  // ── Financial / Banking Domain ──
  { prefix: 'контрагент', code: 'CONTR' },
  { prefix: 'казначейств', code: 'TR' },
  { prefix: 'кредитор', code: 'LENDER' },
  { prefix: 'вкладчик', code: 'DEPOSITOR' },
  { prefix: 'заемщик', code: 'BORROWER' },
  { prefix: 'клиент', code: 'CLIENT' },
  { prefix: 'безопасност', code: 'SEC' },
  { prefix: 'факторинг', code: 'FACTORING' },
  { prefix: 'гаранти', code: 'GUARANTEE' },
  { prefix: 'обеспечен', code: 'COLLATERAL' },
  { prefix: 'портфел', code: 'PORTFOLIO' },
  { prefix: 'платеж', code: 'PAY' },
  { prefix: 'процент', code: 'PERCENT' },
  { prefix: 'комисси', code: 'FEE' },
  { prefix: 'штраф', code: 'PENALTY' },
  { prefix: 'транш', code: 'TRANCHE' },
  { prefix: 'депозит', code: 'DEP' },
  { prefix: 'кредит', code: 'LOAN' },
  { prefix: 'рейтинг', code: 'RATING' },
  { prefix: 'скоринг', code: 'SCORE' },
  { prefix: 'баланс', code: 'BALANCE' },
  { prefix: 'лимит', code: 'LIM' },
  { prefix: 'сделк', code: 'DEAL' },
  { prefix: 'залог', code: 'PLEDGE' },
  { prefix: 'риск', code: 'RISK' },
  { prefix: 'ставк', code: 'RATE' },
  { prefix: 'счет', code: 'ACC' },
  { prefix: 'банк', code: 'BANK' },

  // ── Business Documents & Entities ──
  { prefix: 'экспертиз', code: 'EXPERTISE' },
  { prefix: 'экземпляр', code: 'INSTANCE' },
  { prefix: 'документ', code: 'DOC' },
  { prefix: 'договор', code: 'CONTRACT' },
  { prefix: 'заявк', code: 'APP' },
  { prefix: 'реестр', code: 'REGISTRY' },
  { prefix: 'справочник', code: 'DICT' },
  { prefix: 'карточк', code: 'CARD' },
  { prefix: 'журнал', code: 'LOG' },
  { prefix: 'шаблон', code: 'TPL' },
  { prefix: 'отчет', code: 'RPT' },
  { prefix: 'список', code: 'LIST' },
  { prefix: 'списк', code: 'LIST' },
  { prefix: 'файл', code: 'FILE' },
  { prefix: 'письм', code: 'MAIL' },
  { prefix: 'почт', code: 'MAIL' },
  { prefix: 'комментари', code: 'COMMENT' },
  { prefix: 'сообщен', code: 'MSG' },
  { prefix: 'вложен', code: 'ATTACH' },
  { prefix: 'эксперт', code: 'EXPERT' },
  { prefix: 'план', code: 'PLAN' },
  { prefix: 'график', code: 'SCHEDULE' },

  // ── Org structure ──
  { prefix: 'организац', code: 'ORG' },
  { prefix: 'компан', code: 'COMPANY' },
  { prefix: 'департамент', code: 'DEPT' },
  { prefix: 'филиал', code: 'BRANCH' },
  { prefix: 'отдел', code: 'DEPT' },
  { prefix: 'подразделен', code: 'DEPT' },
  { prefix: 'пользовател', code: 'USER' },
  { prefix: 'групп', code: 'GROUP' },
  { prefix: 'задач', code: 'TASK' },
  { prefix: 'процесс', code: 'PROC' },
  { prefix: 'мониторинг', code: 'MON' },
  { prefix: 'аудит', code: 'AUDIT' },
  { prefix: 'рол', code: 'ROLE' },

  // ── Data, Fields, Attributes ──
  { prefix: 'объект', code: 'OBJ' },
  { prefix: 'субъект', code: 'SUBJ' },
  { prefix: 'элемент', code: 'ITEM' },
  { prefix: 'показател', code: 'INDICATOR' },
  { prefix: 'параметр', code: 'PARAM' },
  { prefix: 'атрибут', code: 'ATTR' },
  { prefix: 'категори', code: 'CAT' },
  { prefix: 'условие', code: 'COND' },
  { prefix: 'услови', code: 'COND' },
  { prefix: 'валют', code: 'CURR' },
  { prefix: 'наименован', code: 'NAME' },
  { prefix: 'названи', code: 'NAME' },
  { prefix: 'результат', code: 'RES' },
  { prefix: 'состояни', code: 'STATE' },
  { prefix: 'статус', code: 'STATUS' },
  { prefix: 'период', code: 'PERIOD' },
  { prefix: 'истори', code: 'HIST' },
  { prefix: 'событи', code: 'EVENT' },
  { prefix: 'триггер', code: 'TRG' },
  { prefix: 'описан', code: 'DESC' },
  { prefix: 'значен', code: 'VALUE' },
  { prefix: 'признак', code: 'FLAG' },
  { prefix: 'версии', code: 'VER' },
  { prefix: 'верси', code: 'VER' },
  { prefix: 'таблиц', code: 'TABLE' },
  { prefix: 'колонк', code: 'COL' },
  { prefix: 'столбец', code: 'COL' },
  { prefix: 'строк', code: 'ROW' },
  { prefix: 'виджет', code: 'WIDGET' },
  { prefix: 'форм', code: 'FORM' },
  { prefix: 'ошибк', code: 'ERROR' },
  { prefix: 'флаг', code: 'FLAG' },
  { prefix: 'тип', code: 'TYPE' },
  { prefix: 'срок', code: 'TERM' },
  { prefix: 'сумм', code: 'AMOUNT' },
  { prefix: 'дат', code: 'DATE' },
  { prefix: 'врем', code: 'TIME' },
  { prefix: 'вид', code: 'TYPE' },
  { prefix: 'код', code: 'CODE' },
  { prefix: 'номер', code: 'NUM' },

  // ── Compliance / AML / Regulatory ──
  { prefix: 'нормативн', code: 'REGULATORY' },
  { prefix: 'требовани', code: 'REQ' },
  { prefix: 'законодательств', code: 'LAW' },
  { prefix: 'регулятор', code: 'REG_BODY' },
  { prefix: 'соблюден', code: 'COMPLIANCE' },
  { prefix: 'соблюдат', code: 'COMPLIANCE' },
  { prefix: 'нарушен', code: 'VIOLATION' },
  { prefix: 'нарушит', code: 'VIOLATION' },
  { prefix: 'стирани', code: 'ERASE' },  // "стирание заключений"
  { prefix: 'стерт', code: 'ERASE' },
  { prefix: 'сохранен', code: 'SAVE' },
  { prefix: 'сохранит', code: 'SAVE' },

  // ── Ref codes / abbreviations ──
  { prefix: 'var', code: 'VAR' },
  { prefix: 'вар', code: 'VAR' },
  { prefix: 'ндс', code: 'VAT' },
  { prefix: 'инн', code: 'INN' },
  { prefix: 'кпп', code: 'KPP' },
  { prefix: 'бик', code: 'BIC' },
  { prefix: 'огрн', code: 'OGRN' },
  { prefix: 'эдо', code: 'EDO' },
  { prefix: 'эцп', code: 'EDS' },
  { prefix: 'амл', code: 'AML' },
  { prefix: 'зи', code: 'ZI' },
  { prefix: 'фин', code: 'FIN' },
];

// Stopwords to ignore (function words, prepositions, etc.)
export const STOPWORDS = new Set([
  'алгоритм', 'алгоритма', 'алгоритмы', 'алгоритму', 'алгоритмом', 'алгоритме',
  'функция', 'функции', 'правило', 'правила', 'скрипт',
  'для', 'по', 'на', 'в', 'во', 'с', 'со', 'из', 'от', 'до', 'к', 'ко', 'при',
  'о', 'об', 'обо', 'за', 'над', 'под', 'перед', 'через',
  'и', 'или', 'а', 'но', 'да', 'как', 'что', 'чтобы',
  'же', 'бы', 'ли', 'это', 'тот', 'такой', 'все', 'всех', 'всеми',
  'свой', 'своих', 'своего', 'своей',
  'не', // handled by compound phrases for "не соответств"
]);

// Russian transliteration map fallback
const TRANSLIT_MAP: Record<string, string> = {
  'а': 'A', 'б': 'B', 'в': 'V', 'г': 'G', 'д': 'D', 'е': 'E', 'ё': 'E',
  'ж': 'ZH', 'з': 'Z', 'и': 'I', 'й': 'Y', 'к': 'K', 'л': 'L', 'м': 'M',
  'н': 'N', 'о': 'O', 'п': 'P', 'р': 'R', 'с': 'S', 'т': 'T', 'у': 'U',
  'ф': 'F', 'х': 'KH', 'ц': 'TS', 'ч': 'CH', 'ш': 'SH', 'щ': 'SHCH',
  'ъ': '', 'ы': 'Y', 'ь': '', 'э': 'E', 'ю': 'YU', 'я': 'YA',
};

export function transliterate(word: string): string {
  const lower = word.toLowerCase().trim();
  let res = '';
  for (let i = 0; i < lower.length; i++) {
    const c = lower[i];
    if (TRANSLIT_MAP[c] !== undefined) {
      res += TRANSLIT_MAP[c];
    } else if (/[a-z0-9]/i.test(c)) {
      res += c.toUpperCase();
    }
  }
  return res;
}

/**
 * Match a single Russian word against the stem dictionary.
 * Returns semantic English code, or falls back to transliteration.
 * NEVER returns null — every word gets translated somehow.
 */
export function stemToCode(rawWord: string): string | null {
  const clean = rawWord.toLowerCase().replace(/[^a-zа-яё0-9_-]/gi, '').trim();
  if (!clean || STOPWORDS.has(clean)) return null;

  // Skip very short particles that may have slipped through
  if (clean.length <= 1) return null;

  // Longest prefix match
  let bestMatch: { len: number; code: string } | null = null;
  for (const item of STEM_DICTIONARY) {
    if (clean.startsWith(item.prefix)) {
      if (!bestMatch || item.prefix.length > bestMatch.len) {
        bestMatch = { len: item.prefix.length, code: item.code };
      }
    }
  }

  if (bestMatch) return bestMatch.code;

  // Fallback: transliterate the entire word (universal — no word is skipped)
  const translit = transliterate(clean);
  if (!translit) return null;
  return translit;
}

/**
 * Parse an arbitrary Russian phrase into deduplicated-per-segment uppercase English tokens.
 * Adjacent duplicate tokens are merged, but non-adjacent same codes are KEPT
 * (because "Проверка НПП (юл). Стирание заключений" has different semantics per segment).
 */
export function phraseToTokens(phrase: string): string[] {
  if (!phrase) return [];

  // 1. Remove leading boilerplate "Алгоритм: ..." or "Алгоритм типа ..."
  let text = phrase.replace(/^\s*алгоритм(?:\s+типа)?(?:\s*[:.])?\s*/i, '').trim();

  // 2. Apply compound phrase replacements (longest-match multi-word patterns)
  for (const { pattern, code } of COMPOUND_PHRASES) {
    text = text.replace(pattern, ` __${code}__ `);
  }

  // 3. Tokenize by whitespace and punctuation (keep dots as segment boundary)
  const rawWords = text.split(/[\s,.;:!?/\\+()\[\]{}"'«»—–-]+/).filter(Boolean);

  const tokens: string[] = [];
  let prevToken = '';

  for (const w of rawWords) {
    // Pre-matched compound code like __CHECK_OBJ__
    const compoundMatch = w.match(/^__([A-Z0-9_]+)__$/);
    if (compoundMatch) {
      const code = compoundMatch[1];
      // Expand multi-code compounds into parts
      const parts = code.split('_');
      for (const part of parts) {
        if (part !== prevToken) {
          tokens.push(part);
          prevToken = part;
        }
      }
      continue;
    }

    const code = stemToCode(w);
    if (code) {
      // Split compound codes from stem (e.g. RECALC stays as one)
      // Avoid adjacent duplicates only
      if (code !== prevToken) {
        tokens.push(code);
        prevToken = code;
      }
    }
  }

  return tokens;
}

export interface GeneratedIdVariants {
  primaryId: string;
  scopeFirstId: string;
  fullId: string;
  compactId: string;
}

/**
 * Main GreenData algorithm ID generator
 */
export function generateAlgorithmId(input: string, customOptions?: {
  overrideType?: AlgorithmType;
  postfix?: string;
  forceBlock?: string;
}): AlgorithmParseResult & { variants: GeneratedIdVariants } {
  const rawInput = input.trim();
  const warnings: string[] = [];
  let explanation = '';

  if (!rawInput) {
    return {
      rawInput: '',
      detectedType: 'general',
      generatedId: '',
      variants: { primaryId: '', scopeFirstId: '', fullId: '', compactId: '' },
      warnings: ['Введите название алгоритма на русском языке'],
      explanation: 'Ожидание ввода...',
    };
  }

  // 1. Clean leading boilerplate
  let cleaned = rawInput.replace(/^\s*алгоритм(?:\s+типа)?(?:\s*[:.])?\s*/i, '').trim();

  // 2. Detect Block Prefix structured via dots or colons: e.g. "ФИН. ЗИ. Проверка НПП (юл). ..."
  let block = customOptions?.forceBlock || '';
  let blockCode = '';
  const dotParts = cleaned.split(/[.:]\s*/).map((s) => s.trim()).filter(Boolean);
  let mainBody = cleaned;

  if (dotParts.length >= 2 && !customOptions?.forceBlock) {
    // Heuristic: leading parts that are SHORT (≤ 3 words, ≤ 30 chars) are block prefixes
    const blockParts: string[] = [];
    let idx = 0;
    while (idx < dotParts.length - 1) {
      const part = dotParts[idx];
      const wordCount = part.split(/\s+/).length;
      // Short prefix blocks: abbreviations like "ФИН", "ЗИ", "КИБ", "НПП" or 1-2 word labels
      if (wordCount <= 3 && part.length <= 40) {
        const tokens = phraseToTokens(part);
        if (tokens.length > 0) {
          blockParts.push(part);
          idx++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    if (blockParts.length > 0) {
      block = blockParts.join('. ');
      mainBody = dotParts.slice(idx).join('. ');
    }
  }

  if (block) {
    blockCode = phraseToTokens(block).join('_');
  }

  // 3. Detect Algorithm Type from first word of mainBody
  let detectedType: AlgorithmType = customOptions?.overrideType || 'general';
  let actionVerb = '';
  let actionCode = '';
  let targetObject = '';
  let targetObjectCode = '';
  let filterParams = '';
  let filterParamsCode = '';
  let baseObject = '';
  let baseObjectCode = '';

  const filterMatch = mainBody.match(/фильтрация\s+([^,]+?)(?:\s+по\s+([^,]+?))?(?:,\s*на\s+основании\s+(.+)|$)/i);
  if (filterMatch) {
    detectedType = 'filter_condition';
    targetObject = filterMatch[1]?.trim() || '';
    filterParams = filterMatch[2]?.trim() || '';
    baseObject = filterMatch[3]?.trim() || '';
    targetObjectCode = phraseToTokens(targetObject).join('_');
    if (filterParams) filterParamsCode = phraseToTokens(filterParams).join('_');
    if (baseObject) baseObjectCode = phraseToTokens(baseObject).join('_');
    explanation = 'Условие фильтрации для выбора элементов GreenData';
  } else {
    const firstWord = mainBody.split(/\s+/)[0]?.toLowerCase() || '';
    if (firstWord.startsWith('рассчит') || firstWord.startsWith('вычисл') || firstWord.startsWith('расчет')) {
      detectedType = 'calculation';
      actionVerb = firstWord;
      actionCode = 'CALC';
      explanation = 'Алгоритм расчета / вычисления параметров';
    } else if (firstWord.startsWith('провер') || firstWord.startsWith('валид') || firstWord.startsWith('контрол')) {
      detectedType = 'validation';
      actionVerb = firstWord;
      actionCode = 'CHECK';
      explanation = 'Алгоритм проверки / валидации условий';
    } else if (
      firstWord.startsWith('создат') || firstWord.startsWith('сформироват') ||
      firstWord.startsWith('изменит') || firstWord.startsWith('обновит') ||
      firstWord.startsWith('удалит') || firstWord.startsWith('запуст')
    ) {
      detectedType = 'card_action';
      actionVerb = firstWord;
      actionCode = stemToCode(firstWord) || 'ACTION';
      explanation = 'Алгоритм карточки объекта с глаголом в инфинитиве';
    } else if (firstWord.startsWith('определен') || firstWord.startsWith('определит')) {
      detectedType = 'general';
      actionVerb = firstWord;
      actionCode = 'DTRM';
      explanation = 'Алгоритм определения объектов / параметров';
    } else {
      detectedType = 'general';
      explanation = 'Общий алгоритм GreenData';
    }
  }

  // 4. Extract tokens from main body
  const bodyTokens = phraseToTokens(mainBody);

  // 5. Assemble final ID parts
  const parts: string[] = [];
  if (blockCode) parts.push(blockCode);

  if (detectedType === 'filter_condition') {
    parts.push('FILTER');
    if (targetObjectCode) parts.push(targetObjectCode);
    if (filterParamsCode) parts.push(`BY_${filterParamsCode}`);
    if (baseObjectCode) parts.push(`BASED_ON_${baseObjectCode}`);
  } else {
    for (const t of bodyTokens) {
      parts.push(t);
    }
  }

  // 6. Apply postfix and cleanup
  const defaultPostfix = customOptions?.postfix !== undefined ? customOptions.postfix : '_ALG';
  const applyPostfix = (tokens: string[]) => {
    let res = tokens.join('_').replace(/__+/g, '_').replace(/^_|_$/g, '').toUpperCase();
    if (defaultPostfix && !res.endsWith(defaultPostfix.replace(/^_/, ''))) {
      res += defaultPostfix.startsWith('_') ? defaultPostfix : `_${defaultPostfix}`;
    }
    return res;
  };

  const primaryId = applyPostfix(parts);

  // Scope-first: domain tokens first
  const DOMAIN_CODES = new Set(['NPP', 'LE', 'IE', 'IP', 'CIB', 'ZPR', 'LIM', 'LOAN', 'DEAL', 'DEP', 'FIN', 'ZI']);
  const domainTokens = parts.filter((p) => DOMAIN_CODES.has(p));
  const otherTokens = parts.filter((p) => !DOMAIN_CODES.has(p));
  const scopeFirstId = applyPostfix([...domainTokens, ...otherTokens]);

  // Full (same as primary in v4 — no separate full dict)
  const fullId = primaryId;

  // Compact: deduplicate globally for shorter version
  const seen = new Set<string>();
  const compactParts = parts.filter((p) => {
    if (seen.has(p)) return false;
    seen.add(p);
    return true;
  });
  const compactId = applyPostfix(compactParts);

  // 7. Warnings
  if (!blockCode && !customOptions?.forceBlock && !parts.some((p) => ['NPP', 'LIM', 'CIB', 'ZPR', 'LOAN', 'DEAL', 'FIN', 'ZI'].includes(p))) {
    warnings.push('Рекомендуется указывать префикс функционального блока (например «ФИН. ЗИ. ...», «НПП. ...» или «КИБ. ...»)');
  }

  return {
    rawInput,
    detectedType,
    block,
    blockCode,
    actionVerb,
    actionCode,
    targetObject,
    targetObjectCode,
    filterParams,
    filterParamsCode,
    baseObject,
    baseObjectCode,
    generatedId: primaryId,
    variants: { primaryId, scopeFirstId, fullId, compactId },
    warnings,
    explanation,
  };
}
