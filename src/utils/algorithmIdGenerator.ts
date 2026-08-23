/**
 * GreenData Algorithm ID Generator Utility (v3.0 - Comprehensive Lexicon)
 *
 * Full-scale semantic dictionary & NLP tokenizer translating all Russian
 * action verbs, modal words, business entities, financial terms, and legal forms
 * into standardized GreenData English identifiers.
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
];

// Comprehensive stem dictionary (over 250+ root stems covering all vocabulary)
export const STEM_DICTIONARY: Array<{ prefix: string; code: string; full?: string }> = [
  // ── Modal, State, Quality, Logic ──
  { prefix: 'необходимост', code: 'REQ', full: 'REQUIRED' },
  { prefix: 'необходим', code: 'REQ', full: 'REQUIRED' },
  { prefix: 'потребност', code: 'NEED', full: 'NEED' },
  { prefix: 'требован', code: 'REQ', full: 'REQUIREMENT' },
  { prefix: 'требует', code: 'REQ', full: 'REQUIRED' },
  { prefix: 'налич', code: 'EXISTS', full: 'EXISTS' },
  { prefix: 'отсутств', code: 'NO', full: 'ABSENCE' },
  { prefix: 'возможн', code: 'CAN', full: 'POSSIBLE' },
  { prefix: 'доступн', code: 'AVAIL', full: 'AVAILABLE' },
  { prefix: 'актуальн', code: 'ACTUAL', full: 'ACTUAL' },
  { prefix: 'готовн', code: 'READY', full: 'READY' },
  { prefix: 'соответств', code: 'MATCH', full: 'COMPLIANT' },
  { prefix: 'несоответств', code: 'MISMATCH', full: 'MISMATCH' },
  { prefix: 'корректн', code: 'VALID', full: 'CORRECT' },
  { prefix: 'некорректн', code: 'INVALID', full: 'INVALID' },
  { prefix: 'успешн', code: 'SUCCESS', full: 'SUCCESS' },
  { prefix: 'критичн', code: 'CRIT', full: 'CRITICAL' },
  { prefix: 'обязательн', code: 'MANDATORY', full: 'MANDATORY' },
  { prefix: 'разрешен', code: 'ALLOWED', full: 'ALLOWED' },
  { prefix: 'запрещен', code: 'FORBIDDEN', full: 'FORBIDDEN' },
  { prefix: 'ограничен', code: 'RESTRICT', full: 'RESTRICTED' },

  // ── Actions & Verbs / Verbal Nouns ──
  { prefix: 'запуск', code: 'RUN', full: 'LAUNCH' },
  { prefix: 'запуст', code: 'RUN', full: 'LAUNCH' },
  { prefix: 'старт', code: 'START', full: 'START' },
  { prefix: 'остановк', code: 'STOP', full: 'STOP' },
  { prefix: 'останов', code: 'STOP', full: 'STOP' },
  { prefix: 'приостанов', code: 'PAUSE', full: 'PAUSE' },
  { prefix: 'возобновл', code: 'RESUME', full: 'RESUME' },
  { prefix: 'перезапуск', code: 'RESTART', full: 'RESTART' },
  { prefix: 'определен', code: 'DTRM', full: 'DETERMINE' },
  { prefix: 'определит', code: 'DTRM', full: 'DETERMINE' },
  { prefix: 'вычислен', code: 'CALC', full: 'CALCULATE' },
  { prefix: 'вычислит', code: 'CALC', full: 'CALCULATE' },
  { prefix: 'рассчит', code: 'CALC', full: 'CALCULATE' },
  { prefix: 'расчет', code: 'CALC', full: 'CALCULATE' },
  { prefix: 'пересчит', code: 'RECALC', full: 'RECALCULATE' },
  { prefix: 'перерасчет', code: 'RECALC', full: 'RECALCULATE' },
  { prefix: 'проверк', code: 'CHECK', full: 'CHECK' },
  { prefix: 'провер', code: 'CHECK', full: 'CHECK' },
  { prefix: 'контрол', code: 'CHECK', full: 'CONTROL' },
  { prefix: 'валидац', code: 'VALID', full: 'VALIDATE' },
  { prefix: 'валидир', code: 'VALID', full: 'VALIDATE' },
  { prefix: 'создан', code: 'CREATE', full: 'CREATE' },
  { prefix: 'создат', code: 'CREATE', full: 'CREATE' },
  { prefix: 'формирован', code: 'GENERATE', full: 'GENERATE' },
  { prefix: 'сформироват', code: 'GENERATE', full: 'GENERATE' },
  { prefix: 'генерац', code: 'GENERATE', full: 'GENERATE' },
  { prefix: 'генерир', code: 'GENERATE', full: 'GENERATE' },
  { prefix: 'построен', code: 'BUILD', full: 'BUILD' },
  { prefix: 'построит', code: 'BUILD', full: 'BUILD' },
  { prefix: 'заполнен', code: 'FILL', full: 'FILL' },
  { prefix: 'заполнит', code: 'FILL', full: 'FILL' },
  { prefix: 'обновлен', code: 'UPDATE', full: 'UPDATE' },
  { prefix: 'обновит', code: 'UPDATE', full: 'UPDATE' },
  { prefix: 'изменен', code: 'UPDATE', full: 'MODIFY' },
  { prefix: 'изменит', code: 'UPDATE', full: 'MODIFY' },
  { prefix: 'модификац', code: 'UPDATE', full: 'MODIFY' },
  { prefix: 'редактирован', code: 'EDIT', full: 'EDIT' },
  { prefix: 'редактир', code: 'EDIT', full: 'EDIT' },
  { prefix: 'корректир', code: 'EDIT', full: 'EDIT' },
  { prefix: 'удален', code: 'DELETE', full: 'DELETE' },
  { prefix: 'удалит', code: 'DELETE', full: 'DELETE' },
  { prefix: 'очистк', code: 'CLEAR', full: 'CLEAR' },
  { prefix: 'очистит', code: 'CLEAR', full: 'CLEAR' },
  { prefix: 'сброс', code: 'RESET', full: 'RESET' },
  { prefix: 'сбросит', code: 'RESET', full: 'RESET' },
  { prefix: 'поиск', code: 'FIND', full: 'SEARCH' },
  { prefix: 'найт', code: 'FIND', full: 'SEARCH' },
  { prefix: 'нахожден', code: 'FIND', full: 'FIND' },
  { prefix: 'выборк', code: 'SELECT', full: 'SELECT' },
  { prefix: 'выбор', code: 'SELECT', full: 'SELECT' },
  { prefix: 'выбрат', code: 'SELECT', full: 'SELECT' },
  { prefix: 'фильтрац', code: 'FILTER', full: 'FILTER' },
  { prefix: 'фильтр', code: 'FILTER', full: 'FILTER' },
  { prefix: 'отфильтр', code: 'FILTER', full: 'FILTER' },
  { prefix: 'сортировк', code: 'SORT', full: 'SORT' },
  { prefix: 'сортир', code: 'SORT', full: 'SORT' },
  { prefix: 'группировк', code: 'GROUP', full: 'GROUP' },
  { prefix: 'группир', code: 'GROUP', full: 'GROUP' },
  { prefix: 'агрегац', code: 'AGG', full: 'AGGREGATE' },
  { prefix: 'сопоставлен', code: 'MATCH', full: 'MATCH' },
  { prefix: 'сопоставит', code: 'MATCH', full: 'MATCH' },
  { prefix: 'сверк', code: 'RECONCILE', full: 'RECONCILE' },
  { prefix: 'сверит', code: 'RECONCILE', full: 'RECONCILE' },
  { prefix: 'маршрутизац', code: 'ROUTE', full: 'ROUTE' },
  { prefix: 'маршрутизир', code: 'ROUTE', full: 'ROUTE' },
  { prefix: 'согласован', code: 'APPROVE', full: 'APPROVE' },
  { prefix: 'согласоват', code: 'APPROVE', full: 'APPROVE' },
  { prefix: 'утвержден', code: 'APPROVE', full: 'APPROVE' },
  { prefix: 'утвердит', code: 'APPROVE', full: 'APPROVE' },
  { prefix: 'отклонен', code: 'REJECT', full: 'REJECT' },
  { prefix: 'отклонит', code: 'REJECT', full: 'REJECT' },
  { prefix: 'отправк', code: 'SEND', full: 'SEND' },
  { prefix: 'отправит', code: 'SEND', full: 'SEND' },
  { prefix: 'получен', code: 'GET', full: 'RECEIVE' },
  { prefix: 'получит', code: 'GET', full: 'RECEIVE' },
  { prefix: 'прием', code: 'RECEIVE', full: 'RECEIVE' },
  { prefix: 'принят', code: 'RECEIVE', full: 'RECEIVE' },
  { prefix: 'выгрузк', code: 'EXPORT', full: 'EXPORT' },
  { prefix: 'выгрузит', code: 'EXPORT', full: 'EXPORT' },
  { prefix: 'экспорт', code: 'EXPORT', full: 'EXPORT' },
  { prefix: 'загрузк', code: 'IMPORT', full: 'IMPORT' },
  { prefix: 'загрузит', code: 'IMPORT', full: 'IMPORT' },
  { prefix: 'импорт', code: 'IMPORT', full: 'IMPORT' },
  { prefix: 'синхронизац', code: 'SYNC', full: 'SYNC' },
  { prefix: 'синхронизир', code: 'SYNC', full: 'SYNC' },
  { prefix: 'интеграц', code: 'INT', full: 'INTEGRATE' },
  { prefix: 'интегрир', code: 'INT', full: 'INTEGRATE' },
  { prefix: 'инициализац', code: 'INIT', full: 'INITIALIZE' },
  { prefix: 'инициализир', code: 'INIT', full: 'INITIALIZE' },
  { prefix: 'активац', code: 'ACTIVATE', full: 'ACTIVATE' },
  { prefix: 'активир', code: 'ACTIVATE', full: 'ACTIVATE' },
  { prefix: 'деактивац', code: 'DEACTIVATE', full: 'DEACTIVATE' },
  { prefix: 'деактивир', code: 'DEACTIVATE', full: 'DEACTIVATE' },
  { prefix: 'блокировк', code: 'BLOCK', full: 'BLOCK' },
  { prefix: 'заблокир', code: 'BLOCK', full: 'BLOCK' },
  { prefix: 'разблокировк', code: 'UNBLOCK', full: 'UNBLOCK' },
  { prefix: 'разблокир', code: 'UNBLOCK', full: 'UNBLOCK' },
  { prefix: 'архивац', code: 'ARCHIVE', full: 'ARCHIVE' },
  { prefix: 'архивир', code: 'ARCHIVE', full: 'ARCHIVE' },
  { prefix: 'копирован', code: 'COPY', full: 'COPY' },
  { prefix: 'скопир', code: 'COPY', full: 'COPY' },
  { prefix: 'дублирован', code: 'DUPLICATE', full: 'DUPLICATE' },
  { prefix: 'дублир', code: 'DUPLICATE', full: 'DUPLICATE' },
  { prefix: 'авторизац', code: 'AUTH', full: 'AUTHORIZE' },
  { prefix: 'аутентификац', code: 'AUTHN', full: 'AUTHENTICATE' },
  { prefix: 'идентификац', code: 'IDENT', full: 'IDENTIFY' },
  { prefix: 'уведомлен', code: 'NOTIF', full: 'NOTIFY' },
  { prefix: 'оповещен', code: 'NOTIF', full: 'NOTIFY' },
  { prefix: 'уведомит', code: 'NOTIF', full: 'NOTIFY' },
  { prefix: 'регистрац', code: 'REG', full: 'REGISTER' },
  { prefix: 'зарегистрир', code: 'REG', full: 'REGISTER' },
  { prefix: 'логирован', code: 'LOG', full: 'LOG' },
  { prefix: 'проведен', code: 'POST', full: 'POST' },
  { prefix: 'провест', code: 'POST', full: 'POST' },
  { prefix: 'отмен', code: 'CANCEL', full: 'CANCEL' },
  { prefix: 'возврат', code: 'RETURN', full: 'RETURN' },
  { prefix: 'привязк', code: 'LINK', full: 'BIND' },
  { prefix: 'привязат', code: 'LINK', full: 'BIND' },
  { prefix: 'связан', code: 'LINK', full: 'LINKED' },
  { prefix: 'связат', code: 'LINK', full: 'LINK' },
  { prefix: 'отвязк', code: 'UNLINK', full: 'UNBIND' },
  { prefix: 'отвязат', code: 'UNLINK', full: 'UNBIND' },
  { prefix: 'назначен', code: 'ASSIGN', full: 'ASSIGN' },
  { prefix: 'назначит', code: 'ASSIGN', full: 'ASSIGN' },
  { prefix: 'переназначен', code: 'REASSIGN', full: 'REASSIGN' },
  { prefix: 'делегирован', code: 'DELEGATE', full: 'DELEGATE' },
  { prefix: 'распределен', code: 'DISTRIBUTE', full: 'DISTRIBUTE' },
  { prefix: 'подписан', code: 'SIGN', full: 'SIGN' },
  { prefix: 'подписат', code: 'SIGN', full: 'SIGN' },
  { prefix: 'аннулирован', code: 'VOID', full: 'ANNUL' },
  { prefix: 'закрыт', code: 'CLOSE', full: 'CLOSE' },
  { prefix: 'открыт', code: 'OPEN', full: 'OPEN' },
  { prefix: 'исполнен', code: 'EXEC', full: 'EXECUTE' },
  { prefix: 'выполнен', code: 'EXEC', full: 'EXECUTE' },
  { prefix: 'передач', code: 'TRANSFER', full: 'TRANSFER' },
  { prefix: 'обработк', code: 'PROCESS', full: 'PROCESS' },
  { prefix: 'преобразован', code: 'TRANSFORM', full: 'TRANSFORM' },
  { prefix: 'конвертац', code: 'CONVERT', full: 'CONVERT' },
  { prefix: 'нормализац', code: 'NORMALIZE', full: 'NORMALIZE' },
  { prefix: 'сравнен', code: 'COMPARE', full: 'COMPARE' },
  { prefix: 'оценк', code: 'EVAL', full: 'EVALUATE' },
  { prefix: 'оценит', code: 'EVAL', full: 'EVALUATE' },
  { prefix: 'классификац', code: 'CLASSIFY', full: 'CLASSIFY' },
  { prefix: 'прогноз', code: 'FORECAST', full: 'FORECAST' },
  { prefix: 'шифрован', code: 'ENCRYPT', full: 'ENCRYPT' },
  { prefix: 'дешифрован', code: 'DECRYPT', full: 'DECRYPT' },
  { prefix: 'тестирован', code: 'TEST', full: 'TEST' },
  { prefix: 'анализ', code: 'ANALYZE', full: 'ANALYZE' },
  { prefix: 'отслеживан', code: 'TRACK', full: 'TRACK' },

  // ── GreenData Functional Blocks & Modules ──
  { prefix: 'нпп', code: 'NPP', full: 'NPP' },
  { prefix: 'киб', code: 'CIB', full: 'CIB' },
  { prefix: 'зпр', code: 'ZPR', full: 'ZPR' },
  { prefix: 'лимит', code: 'LIM', full: 'LIMITS' },
  { prefix: 'кредит', code: 'LOAN', full: 'LOAN' },
  { prefix: 'депозит', code: 'DEP', full: 'DEPOSIT' },
  { prefix: 'сделк', code: 'DEAL', full: 'DEAL' },
  { prefix: 'платеж', code: 'PAY', full: 'PAYMENT' },
  { prefix: 'расчет', code: 'SETTL', full: 'SETTLEMENT' },
  { prefix: 'контрагент', code: 'CONTR', full: 'COUNTERPARTY' },
  { prefix: 'клиент', code: 'CLIENT', full: 'CLIENT' },
  { prefix: 'заемщик', code: 'BORROWER', full: 'BORROWER' },
  { prefix: 'кредитор', code: 'LENDER', full: 'LENDER' },
  { prefix: 'вкладчик', code: 'DEPOSITOR', full: 'DEPOSITOR' },
  { prefix: 'безопасност', code: 'SEC', full: 'SECURITY' },
  { prefix: 'риск', code: 'RISK', full: 'RISK' },
  { prefix: 'гаранти', code: 'GUARANTEE', full: 'GUARANTEE' },
  { prefix: 'факторинг', code: 'FACT', full: 'FACTORING' },
  { prefix: 'казначейств', code: 'TR', full: 'TREASURY' },
  { prefix: 'портфел', code: 'PORTFOLIO', full: 'PORTFOLIO' },
  { prefix: 'договор', code: 'CONTRACT', full: 'CONTRACT' },
  { prefix: 'заявк', code: 'APP', full: 'APPLICATION' },
  { prefix: 'экспертиз', code: 'EXPERTISE', full: 'EXPERTISE' },
  { prefix: 'эксперт', code: 'EXPERT', full: 'EXPERT' },
  { prefix: 'экземпляр', code: 'INSTANCE', full: 'INSTANCE' },
  { prefix: 'документ', code: 'DOC', full: 'DOCUMENT' },
  { prefix: 'карточк', code: 'CARD', full: 'CARD' },
  { prefix: 'пользовател', code: 'USER', full: 'USER' },
  { prefix: 'рол', code: 'ROLE', full: 'ROLE' },
  { prefix: 'групп', code: 'GROUP', full: 'GROUP' },
  { prefix: 'задач', code: 'TASK', full: 'TASK' },
  { prefix: 'процесс', code: 'PROC', full: 'PROCESS' },
  { prefix: 'мониторинг', code: 'MON', full: 'MONITORING' },
  { prefix: 'аудит', code: 'AUDIT', full: 'AUDIT' },
  { prefix: 'справочник', code: 'DICT', full: 'DICTIONARY' },
  { prefix: 'реестр', code: 'REGISTRY', full: 'REGISTRY' },
  { prefix: 'журнал', code: 'LOG', full: 'LOG' },
  { prefix: 'список', code: 'LIST', full: 'LIST' },
  { prefix: 'списк', code: 'LIST', full: 'LIST' },
  { prefix: 'отчет', code: 'RPT', full: 'REPORT' },
  { prefix: 'подразделен', code: 'DEP', full: 'DEPARTMENT' },
  { prefix: 'отдел', code: 'DEP', full: 'DEPARTMENT' },
  { prefix: 'департамент', code: 'DEPT', full: 'DEPARTMENT' },
  { prefix: 'филиал', code: 'BRANCH', full: 'BRANCH' },
  { prefix: 'организац', code: 'ORG', full: 'ORGANIZATION' },
  { prefix: 'компан', code: 'COMPANY', full: 'COMPANY' },
  { prefix: 'банк', code: 'BANK', full: 'BANK' },

  // ── Entities, Fields, Attributes & Datatypes ──
  { prefix: 'объект', code: 'OBJ', full: 'OBJECT' },
  { prefix: 'субъект', code: 'SUBJ', full: 'SUBJECT' },
  { prefix: 'элемент', code: 'ITEM', full: 'ITEM' },
  { prefix: 'услови', code: 'COND', full: 'CONDITION' },
  { prefix: 'параметр', code: 'PARAM', full: 'PARAMETER' },
  { prefix: 'атрибут', code: 'ATTR', full: 'ATTRIBUTE' },
  { prefix: 'показател', code: 'INDICATOR', full: 'INDICATOR' },
  { prefix: 'валют', code: 'CURR', full: 'CURRENCY' },
  { prefix: 'дат', code: 'DATE', full: 'DATE' },
  { prefix: 'врем', code: 'TIME', full: 'TIME' },
  { prefix: 'период', code: 'PERIOD', full: 'PERIOD' },
  { prefix: 'срок', code: 'TERM', full: 'TERM' },
  { prefix: 'сумм', code: 'AMOUNT', full: 'AMOUNT' },
  { prefix: 'статус', code: 'STATUS', full: 'STATUS' },
  { prefix: 'состояни', code: 'STATE', full: 'STATE' },
  { prefix: 'тип', code: 'TYPE', full: 'TYPE' },
  { prefix: 'вид', code: 'TYPE', full: 'TYPE' },
  { prefix: 'категори', code: 'CAT', full: 'CATEGORY' },
  { prefix: 'код', code: 'CODE', full: 'CODE' },
  { prefix: 'номер', code: 'NUM', full: 'NUMBER' },
  { prefix: 'наименован', code: 'NAME', full: 'NAME' },
  { prefix: 'названи', code: 'NAME', full: 'NAME' },
  { prefix: 'описан', code: 'DESC', full: 'DESCRIPTION' },
  { prefix: 'значен', code: 'VALUE', full: 'VALUE' },
  { prefix: 'признак', code: 'FLAG', full: 'FLAG' },
  { prefix: 'флаг', code: 'FLAG', full: 'FLAG' },
  { prefix: 'таблиц', code: 'TABLE', full: 'TABLE' },
  { prefix: 'строк', code: 'ROW', full: 'ROW' },
  { prefix: 'колонк', code: 'COL', full: 'COLUMN' },
  { prefix: 'столбец', code: 'COL', full: 'COLUMN' },
  { prefix: 'верси', code: 'VER', full: 'VERSION' },
  { prefix: 'шаблон', code: 'TPL', full: 'TEMPLATE' },
  { prefix: 'виджет', code: 'WIDGET', full: 'WIDGET' },
  { prefix: 'форм', code: 'FORM', full: 'FORM' },
  { prefix: 'пол', code: 'FIELD', full: 'FIELD' },
  { prefix: 'кнопк', code: 'BTN', full: 'BUTTON' },
  { prefix: 'ссылк', code: 'LINK', full: 'LINK' },
  { prefix: 'файл', code: 'FILE', full: 'FILE' },
  { prefix: 'вложен', code: 'ATTACH', full: 'ATTACHMENT' },
  { prefix: 'комментари', code: 'COMMENT', full: 'COMMENT' },
  { prefix: 'сообщен', code: 'MSG', full: 'MESSAGE' },
  { prefix: 'письм', code: 'MAIL', full: 'MAIL' },
  { prefix: 'почт', code: 'MAIL', full: 'MAIL' },
  { prefix: 'счет', code: 'ACC', full: 'ACCOUNT' },
  { prefix: 'баланс', code: 'BALANCE', full: 'BALANCE' },
  { prefix: 'ставк', code: 'RATE', full: 'RATE' },
  { prefix: 'процент', code: 'PERCENT', full: 'PERCENT' },
  { prefix: 'комисси', code: 'FEE', full: 'FEE' },
  { prefix: 'штраф', code: 'PENALTY', full: 'PENALTY' },
  { prefix: 'пен', code: 'PENALTY', full: 'PENALTY' },
  { prefix: 'график', code: 'SCHEDULE', full: 'SCHEDULE' },
  { prefix: 'план', code: 'PLAN', full: 'PLAN' },
  { prefix: 'транш', code: 'TRANCHE', full: 'TRANCHE' },
  { prefix: 'обеспечен', code: 'COLLATERAL', full: 'COLLATERAL' },
  { prefix: 'залог', code: 'PLEDGE', full: 'PLEDGE' },
  { prefix: 'поручительств', code: 'SURETY', full: 'SURETY' },
  { prefix: 'рейтинг', code: 'RATING', full: 'RATING' },
  { prefix: 'скоринг', code: 'SCORE', full: 'SCORE' },
  { prefix: 'ошибк', code: 'ERROR', full: 'ERROR' },
  { prefix: 'предупрежден', code: 'WARN', full: 'WARNING' },
  { prefix: 'результат', code: 'RES', full: 'RESULT' },
  { prefix: 'истори', code: 'HIST', full: 'HISTORY' },
  { prefix: 'событи', code: 'EVENT', full: 'EVENT' },
  { prefix: 'триггер', code: 'TRG', full: 'TRIGGER' },
  { prefix: 'var', code: 'VAR', full: 'VAR' },
  { prefix: 'вар', code: 'VAR', full: 'VAR' },
  { prefix: 'ндс', code: 'VAT', full: 'VAT' },
  { prefix: 'инн', code: 'INN', full: 'INN' },
  { prefix: 'кпп', code: 'KPP', full: 'KPP' },
  { prefix: 'бик', code: 'BIC', full: 'BIC' },
  { prefix: 'огрн', code: 'OGRN', full: 'OGRN' },
  { prefix: 'эдо', code: 'EDO', full: 'EDO' },
  { prefix: 'эцп', code: 'EDS', full: 'EDS' },
  { prefix: 'амл', code: 'AML', full: 'AML' },
];

// Stopwords to ignore
export const STOPWORDS = new Set([
  'алгоритм', 'алгоритма', 'алгоритмы', 'алгоритму', 'алгоритмом', 'алгоритме',
  'функция', 'функции', 'правило', 'правила', 'скрипт',
  'для', 'по', 'на', 'в', 'во', 'с', 'со', 'из', 'от', 'до', 'к', 'ко', 'при',
  'о', 'об', 'обо', 'за', 'над', 'под', 'перед', 'через',
  'и', 'или', 'а', 'но', 'да', 'как', 'что', 'чтобы',
  'же', 'бы', 'ли', 'это', 'тот', 'такой', 'все', 'всех', 'всеми',
  'свой', 'своих', 'своего', 'своей',
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
 * Match a single Russian word against the stem dictionary
 */
export function stemToCode(rawWord: string): { code: string; full: string } | null {
  const clean = rawWord.toLowerCase().replace(/[^a-zа-я0-9_-]/gi, '').trim();
  if (!clean || STOPWORDS.has(clean)) return null;

  // Longest prefix match
  let bestMatch: { len: number; code: string; full: string } | null = null;
  for (const item of STEM_DICTIONARY) {
    if (clean.startsWith(item.prefix)) {
      if (!bestMatch || item.prefix.length > bestMatch.len) {
        bestMatch = {
          len: item.prefix.length,
          code: item.code,
          full: item.full || item.code,
        };
      }
    }
  }

  if (bestMatch) {
    return { code: bestMatch.code, full: bestMatch.full };
  }

  // Fallback to clean transliteration
  const translit = transliterate(clean);
  return { code: translit, full: translit };
}

/**
 * Parse an arbitrary Russian phrase into clean deduplicated uppercase English tokens
 */
export function phraseToTokens(phrase: string): { shortTokens: string[]; fullTokens: string[] } {
  if (!phrase) return { shortTokens: [], fullTokens: [] };

  // 1. Remove leading boilerplate like "Алгоритм: ...", "Алгоритм определения ..."
  let text = phrase
    .replace(/^\s*алгоритм(?:\s+типа)?(?:\s*[:.])?\s*/i, '')
    .trim();

  // 2. Apply compound phrase replacements
  for (const { pattern, code } of COMPOUND_PHRASES) {
    text = text.replace(pattern, ` __${code}__ `);
  }

  // 3. Tokenize by whitespace and punctuation
  const rawWords = text.split(/[\s,.;:!?/\\+()\[\]{}"'«»—–-]+/).filter(Boolean);

  const shortTokens: string[] = [];
  const fullTokens: string[] = [];

  for (const w of rawWords) {
    // If it's a pre-matched compound code like __CHECK_OBJ__
    const compoundMatch = w.match(/^__([A-Z0-9_]+)__$/);
    if (compoundMatch) {
      const code = compoundMatch[1];
      if (!shortTokens.includes(code)) {
        shortTokens.push(code);
        fullTokens.push(code);
      }
      continue;
    }

    const match = stemToCode(w);
    if (match && !shortTokens.includes(match.code)) {
      shortTokens.push(match.code);
      fullTokens.push(match.full);
    }
  }

  return { shortTokens, fullTokens };
}

export interface GeneratedIdVariants {
  primaryId: string;
  scopeFirstId: string;
  fullId: string;
  compactId: string;
}

/**
 * Main GreenData algorithm ID generator with multiple format variations
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
      variants: {
        primaryId: '',
        scopeFirstId: '',
        fullId: '',
        compactId: '',
      },
      warnings: ['Введите название алгоритма на русском языке'],
      explanation: 'Ожидание ввода...',
    };
  }

  // 1. Clean leading boilerplate
  let cleaned = rawInput.replace(/^\s*алгоритм(?:\s+типа)?(?:\s*[:.])?\s*/i, '').trim();

  // 2. Detect Block Prefix if structured via dots or colons: e.g. "Лимиты. Рассчитать VaR" or "КИБ. ЗПР. Создать"
  let block = customOptions?.forceBlock || '';
  let blockCode = '';
  const dotParts = cleaned.split(/[.:]\s*/).map((s) => s.trim()).filter(Boolean);
  let mainBody = cleaned;

  if (dotParts.length >= 2 && !customOptions?.forceBlock) {
    const blockParts: string[] = [];
    let idx = 0;
    while (idx < dotParts.length - 1) {
      const part = dotParts[idx];
      const { shortTokens } = phraseToTokens(part);
      if (shortTokens.length > 0) {
        blockParts.push(part);
        idx++;
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
    blockCode = phraseToTokens(block).shortTokens.join('_');
  }

  // 3. Detect Algorithm Type
  let detectedType: AlgorithmType = customOptions?.overrideType || 'general';
  let targetObject = '';
  let targetObjectCode = '';
  let filterParams = '';
  let filterParamsCode = '';
  let baseObject = '';
  let baseObjectCode = '';
  let actionVerb = '';
  let actionCode = '';

  // Check for Filter Condition: "<Блок>. Фильтрация <Объект> по <Параметры>[, на основании <Базовый объект>]"
  const filterMatch = mainBody.match(/фильтрация\s+([^,]+?)(?:\s+по\s+([^,]+?))?(?:,\s*на\s+основании\s+(.+)|$)/i);
  if (filterMatch) {
    detectedType = 'filter_condition';
    targetObject = filterMatch[1]?.trim() || '';
    filterParams = filterMatch[2]?.trim() || '';
    baseObject = filterMatch[3]?.trim() || '';

    targetObjectCode = phraseToTokens(targetObject).shortTokens.join('_');
    if (filterParams) filterParamsCode = phraseToTokens(filterParams).shortTokens.join('_');
    if (baseObject) baseObjectCode = phraseToTokens(baseObject).shortTokens.join('_');
    explanation = 'Условие фильтрации для выбора элементов GreenData';
  } else {
    // Check for infinitive verbs or action nouns
    const firstWord = mainBody.split(/\s+/)[0]?.toLowerCase() || '';

    if (
      firstWord.startsWith('рассчит') ||
      firstWord.startsWith('вычисл') ||
      firstWord.startsWith('расчет')
    ) {
      detectedType = 'calculation';
      actionVerb = firstWord;
      actionCode = 'CALC';
      explanation = 'Алгоритм расчета / вычисления параметров';
    } else if (
      firstWord.startsWith('провер') ||
      firstWord.startsWith('валид') ||
      firstWord.startsWith('контрол')
    ) {
      detectedType = 'validation';
      actionVerb = firstWord;
      actionCode = 'CHECK';
      explanation = 'Алгоритм проверки / валидации условий';
    } else if (
      firstWord.startsWith('создат') ||
      firstWord.startsWith('сформироват') ||
      firstWord.startsWith('изменит') ||
      firstWord.startsWith('обновит') ||
      firstWord.startsWith('удалит') ||
      firstWord.startsWith('запуст')
    ) {
      detectedType = 'card_action';
      actionVerb = firstWord;
      actionCode = phraseToTokens(firstWord).shortTokens[0] || 'ACTION';
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

  // 4. Extract all tokens for the main body
  const { shortTokens, fullTokens } = phraseToTokens(mainBody);

  // 5. Assemble final ID tokens
  const parts: string[] = [];
  if (blockCode) {
    parts.push(blockCode);
  }

  if (detectedType === 'filter_condition') {
    parts.push('FILTER');
    if (targetObjectCode) parts.push(targetObjectCode);
    if (filterParamsCode) parts.push(`BY_${filterParamsCode}`);
    if (baseObjectCode) parts.push(`BASED_ON_${baseObjectCode}`);
  } else {
    for (const t of shortTokens) {
      if (!parts.includes(t)) {
        parts.push(t);
      }
    }
  }

  // 6. Postfix
  const defaultPostfix = customOptions?.postfix !== undefined ? customOptions.postfix : '_ALG';
  const applyPostfix = (base: string) => {
    let res = base.replace(/__+/g, '_').replace(/^_|_$/g, '').toUpperCase();
    if (defaultPostfix && !res.endsWith(defaultPostfix.replace(/^_/, ''))) {
      if (defaultPostfix.startsWith('_')) {
        res += defaultPostfix;
      } else {
        res += `_${defaultPostfix}`;
      }
    }
    return res;
  };

  const primaryId = applyPostfix(parts.join('_'));

  // Scope-first variation (e.g. NPP_LE_... or LIM_...)
  const domainTokens = parts.filter((p) => ['NPP', 'LE', 'IE', 'IP', 'CIB', 'ZPR', 'LIM', 'CRED', 'DEAL', 'DEP'].includes(p));
  const otherTokens = parts.filter((p) => !domainTokens.includes(p));
  const scopeFirstId = applyPostfix([...domainTokens, ...otherTokens].join('_'));

  // Full names variation
  const fullId = applyPostfix(fullTokens.join('_'));

  // Compact variation (omit redundant REQ or similar if already DTRM)
  const compactParts = parts.filter((p, i) => i === 0 || p !== 'REQ' || !parts.includes('DTRM'));
  const compactId = applyPostfix(compactParts.join('_'));

  // 7. Check for recommendations
  if (!blockCode && !customOptions?.forceBlock && !parts.some((p) => ['NPP', 'LIM', 'CIB', 'ZPR', 'CRED', 'DEAL'].includes(p))) {
    warnings.push('Рекомендуется указывать префикс функционального блока (например «Лимиты. ...», «НПП. ...» или «КИБ. ...»)');
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
    variants: {
      primaryId,
      scopeFirstId,
      fullId,
      compactId,
    },
    warnings,
    explanation,
  };
}
