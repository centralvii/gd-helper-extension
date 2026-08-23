/**
 * GreenData Algorithm ID Generator Utility
 * Implements GreenData naming standards:
 * - Meaningful English UPPER_SNAKE_CASE identifier
 * - Block prefix (e.g. "Лимиты" -> "LIM_")
 * - Object Card algorithm must contain infinitive verb (e.g. "Создать", "Рассчитать")
 * - Filter Condition algorithm standard: "<Блок>. Фильтрация <Объект> по <Параметры>[, на основании <Базовый объект>]"
 * - Postfix: "_ALG" (or custom)
 */

import { AlgorithmParseResult, AlgorithmType } from '../types';

// GreenData Block abbreviations dictionary
export const BLOCK_DICTIONARY: Record<string, string> = {
  'лимиты': 'LIM',
  'лимит': 'LIM',
  'киб': 'CIB',
  'зпр': 'ZPR',
  'кредиты': 'CRED',
  'кредитование': 'LOAN',
  'кредит': 'LOAN',
  'депозиты': 'DEP',
  'депозит': 'DEP',
  'сделки': 'DEAL',
  'сделка': 'DEAL',
  'платежи': 'PAY',
  'платеж': 'PAY',
  'расчеты': 'SETTL',
  'контрагенты': 'CONTR',
  'контрагент': 'CONTR',
  'клиенты': 'CLIENT',
  'клиент': 'CLIENT',
  'безопасность': 'SEC',
  'иб': 'SEC',
  'отчеты': 'RPT',
  'отчетность': 'RPT',
  'отчет': 'RPT',
  'интеграция': 'INT',
  'уведомления': 'NOTIF',
  'уведомление': 'NOTIF',
  'справочники': 'DICT',
  'справочник': 'DICT',
  'администрирование': 'ADM',
  'админ': 'ADM',
  'заявки': 'APP',
  'заявка': 'APP',
  'риски': 'RISK',
  'риск': 'RISK',
  'гарантии': 'BG',
  'гарантия': 'GUARANTEE',
  'факторинг': 'FACT',
  'казначейство': 'TR',
  'договоры': 'CONTRACT',
  'договора': 'CONTRACT',
  'договор': 'CONTRACT',
  'документы': 'DOC',
  'документ': 'DOC',
  'пользователи': 'USER',
  'пользователь': 'USER',
  'роли': 'ROLE',
  'роль': 'ROLE',
  'задачи': 'TASK',
  'задача': 'TASK',
  'процессы': 'PROC',
  'процесс': 'PROC',
  'мониторинг': 'MON',
  'аудит': 'AUDIT',
  'карточки': 'CARD',
  'карточка': 'CARD',
};

// Infinitive verbs and actions
export const ACTION_VERBS_DICTIONARY: Record<string, string> = {
  'рассчитать': 'CALC',
  'расчет': 'CALC',
  'вычислить': 'CALC',
  'пересчитать': 'RECALC',
  'создать': 'CREATE',
  'создание': 'CREATE',
  'сформировать': 'GENERATE',
  'формирование': 'GENERATE',
  'генерация': 'GENERATE',
  'генерировать': 'GENERATE',
  'изменить': 'UPDATE',
  'обновить': 'UPDATE',
  'редактировать': 'EDIT',
  'корректировать': 'EDIT',
  'удалить': 'DELETE',
  'удаление': 'DELETE',
  'проверить': 'CHECK',
  'проверка': 'CHECK',
  'валидировать': 'VALID',
  'валидация': 'VALID',
  'контроль': 'CHECK',
  'согласовать': 'APPROVE',
  'согласование': 'APPROVAL',
  'утвердить': 'APPROVE',
  'отклонить': 'REJECT',
  'отклонение': 'REJECT',
  'отправить': 'SEND',
  'отправка': 'SEND',
  'получить': 'GET',
  'получение': 'GET',
  'синхронизировать': 'SYNC',
  'синхронизация': 'SYNC',
  'загрузить': 'LOAD',
  'загрузка': 'LOAD',
  'выгрузить': 'UNLOAD',
  'выгрузка': 'UNLOAD',
  'импортировать': 'IMPORT',
  'импорт': 'IMPORT',
  'экспортировать': 'EXPORT',
  'экспорт': 'EXPORT',
  'инициализировать': 'INIT',
  'инициализация': 'INIT',
  'выполнить': 'EXEC',
  'исполнить': 'EXEC',
  'закрыть': 'CLOSE',
  'закрытие': 'CLOSE',
  'открыть': 'OPEN',
  'открытие': 'OPEN',
  'архивировать': 'ARCHIVE',
  'архивация': 'ARCHIVE',
  'активировать': 'ACTIVATE',
  'активация': 'ACTIVATE',
  'деактивировать': 'DEACTIVATE',
  'блокировать': 'BLOCK',
  'разблокировать': 'UNBLOCK',
  'поиск': 'FIND',
  'найти': 'FIND',
  'очистить': 'CLEAR',
  'очистка': 'CLEAR',
  'сбросить': 'RESET',
  'сброс': 'RESET',
  'скопировать': 'COPY',
  'дублировать': 'DUPLICATE',
  'сопоставить': 'MATCH',
  'сопоставление': 'MATCH',
  'фильтрация': 'FILTER',
  'фильтровать': 'FILTER',
  'отфильтровать': 'FILTER',
  'выбрать': 'SELECT',
  'выбор': 'SELECT',
};

// Common terms and domain entities
export const TERMS_DICTIONARY: Record<string, string> = {
  'var': 'VAR',
  'вар': 'VAR',
  'портфель': 'PORTFOLIO',
  'портфелю': 'PORTFOLIO',
  'портфеля': 'PORTFOLIO',
  'экземпляр': 'INSTANCE',
  'экземпляра': 'INSTANCE',
  'экспертиза': 'EXPERTISE',
  'экспертизы': 'EXPERTISE',
  'экспертизу': 'EXPERTISE',
  'эксперт': 'EXPERT',
  'условие': 'COND',
  'условия': 'COND',
  'элемент': 'ITEM',
  'элемента': 'ITEM',
  'элементы': 'ITEMS',
  'элементов': 'ITEMS',
  'объект': 'OBJECT',
  'объекта': 'OBJECT',
  'объекты': 'OBJECTS',
  'объектов': 'OBJECTS',
  'параметр': 'PARAM',
  'параметры': 'PARAMS',
  'параметров': 'PARAMS',
  'валюта': 'CURR',
  'валюте': 'CURR',
  'валюты': 'CURR',
  'дата': 'DATE',
  'дате': 'DATE',
  'даты': 'DATE',
  'период': 'PERIOD',
  'периоду': 'PERIOD',
  'сумма': 'AMOUNT',
  'сумме': 'AMOUNT',
  'суммы': 'AMOUNT',
  'статус': 'STATUS',
  'статусу': 'STATUS',
  'статуса': 'STATUS',
  'тип': 'TYPE',
  'типу': 'TYPE',
  'типа': 'TYPE',
  'код': 'CODE',
  'номер': 'NUM',
  'номер_договора': 'CONTRACT_NUM',
  'наименование': 'NAME',
  'название': 'NAME',
  'описание': 'DESC',
  'значение': 'VALUE',
  'значению': 'VALUE',
  'значения': 'VALUES',
  'основание': 'BASED_ON',
  'основании': 'BASED_ON',
  'признак': 'FLAG',
  'флаг': 'FLAG',
  'список': 'LIST',
  'реестр': 'REGISTRY',
  'журнал': 'LOG',
  'история': 'HIST',
  'таблица': 'TABLE',
  'строка': 'ROW',
  'колонка': 'COL',
  'столбец': 'COL',
  'пользователь': 'USER',
  'пользователя': 'USER',
  'автор': 'AUTHOR',
  'роль': 'ROLE',
  'права': 'RIGHTS',
  'доступ': 'ACCESS',
  'группа': 'GROUP',
  'организация': 'ORG',
  'компания': 'COMPANY',
  'филиал': 'BRANCH',
  'подразделение': 'DEP',
  'департамент': 'DEPT',
  'проект': 'PROJECT',
  'версия': 'VER',
  'шаблон': 'TEMPLATE',
  'виджет': 'WIDGET',
  'форма': 'FORM',
  'поля': 'FIELDS',
  'поле': 'FIELD',
  'кнопка': 'BUTTON',
  'ссылка': 'LINK',
  'файл': 'FILE',
  'вложение': 'ATTACHMENT',
  'комментарий': 'COMMENT',
  'сообщение': 'MSG',
  'счет': 'ACC',
  'счета': 'ACCOUNTS',
  'баланс': 'BALANCE',
  'ставка': 'RATE',
  'процент': 'PERCENT',
  'комиссия': 'FEE',
  'график': 'SCHEDULE',
  'транш': 'TRANCHE',
  'обеспечение': 'COLLATERAL',
  'залог': 'PLEDGE',
  'поручительство': 'SURETY',
  'заемщик': 'BORROWER',
  'кредитор': 'LENDER',
  'вкладчик': 'DEPOSITOR',
  'рейтинг': 'RATING',
  'категория': 'CATEGORY',
};

// Russian transliteration map (GOST / ISO standard)
const TRANSLIT_MAP: Record<string, string> = {
  'а': 'A', 'б': 'B', 'в': 'V', 'г': 'G', 'д': 'D', 'е': 'E', 'ё': 'E',
  'ж': 'ZH', 'з': 'Z', 'и': 'I', 'й': 'Y', 'к': 'K', 'л': 'L', 'м': 'M',
  'н': 'N', 'о': 'O', 'п': 'P', 'р': 'R', 'с': 'S', 'т': 'T', 'у': 'U',
  'ф': 'F', 'х': 'KH', 'ц': 'TS', 'ч': 'CH', 'ш': 'SH', 'щ': 'SHCH',
  'ъ': '', 'ы': 'Y', 'ь': '', 'э': 'E', 'ю': 'YU', 'я': 'YA'
};

/**
 * Transliterate Russian word to English upper snake tokens
 */
export function transliterateRussian(word: string): string {
  const lower = word.toLowerCase().trim();
  let res = '';
  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    if (TRANSLIT_MAP[char] !== undefined) {
      res += TRANSLIT_MAP[char];
    } else if (/[a-z0-9]/i.test(char)) {
      res += char.toUpperCase();
    }
  }
  return res;
}

/**
 * Translate a single Russian token or phrase to English code abbreviation
 */
export function translateToken(token: string): string {
  const clean = token.toLowerCase().replace(/[^a-zа-я0-9_-]/gi, '').trim();
  if (!clean) return '';

  // Check direct dictionaries
  if (ACTION_VERBS_DICTIONARY[clean]) return ACTION_VERBS_DICTIONARY[clean];
  if (BLOCK_DICTIONARY[clean]) return BLOCK_DICTIONARY[clean];
  if (TERMS_DICTIONARY[clean]) return TERMS_DICTIONARY[clean];

  // Check stem matches (Russian inflections)
  for (const [dictWord, translation] of Object.entries(TERMS_DICTIONARY)) {
    if (dictWord.length >= 4 && clean.startsWith(dictWord.slice(0, 4))) {
      return translation;
    }
  }

  for (const [dictWord, translation] of Object.entries(ACTION_VERBS_DICTIONARY)) {
    if (dictWord.length >= 4 && clean.startsWith(dictWord.slice(0, 4))) {
      return translation;
    }
  }

  for (const [dictWord, translation] of Object.entries(BLOCK_DICTIONARY)) {
    if (dictWord.length >= 3 && clean.startsWith(dictWord.slice(0, 3))) {
      return translation;
    }
  }

  // Fallback to clean transliteration
  return transliterateRussian(clean);
}

/**
 * Translate arbitrary phrase to snake_case identifier tokens
 */
export function phraseToCode(phrase: string): string {
  if (!phrase) return '';

  // Handle special compound phrases first
  let text = phrase
    .replace(/на\s+основании/gi, 'BASED_ON')
    .replace(/на\s+базе/gi, 'BASED_ON')
    .replace(/по\s+портфелю/gi, 'PORTFOLIO')
    .replace(/по\s+валюте/gi, 'BY_CURR')
    .replace(/по\s+дате/gi, 'BY_DATE')
    .replace(/по\s+сумме/gi, 'BY_AMOUNT')
    .replace(/по\s+статусу/gi, 'BY_STATUS');

  const words = text
    .split(/[\s,.;:!?/\\+()\[\]{}"'«»—–-]+/)
    .filter(Boolean);

  const tokens: string[] = [];
  const skipWords = new Set(['и', 'или', 'в', 'во', 'для', 'с', 'со', 'из', 'от', 'до', 'к', 'ко', 'при', 'на', 'по', 'за', 'над', 'под', 'же', 'бы', 'ли', 'это', 'тот', 'такой']);

  for (const w of words) {
    const lower = w.toLowerCase();
    if (w === 'BASED_ON' || w === 'BY_CURR' || w === 'BY_DATE' || w === 'BY_AMOUNT' || w === 'BY_STATUS') {
      tokens.push(w);
      continue;
    }

    if (skipWords.has(lower)) {
      continue;
    }

    const translated = translateToken(w);
    if (translated && !tokens.includes(translated)) {
      tokens.push(translated);
    }
  }

  return tokens.join('_');
}

/**
 * Main parser and generator function
 */
export function generateAlgorithmId(input: string, customOptions?: {
  overrideType?: AlgorithmType;
  postfix?: string;
  forceBlock?: string;
}): AlgorithmParseResult {
  const rawInput = input.trim();
  const warnings: string[] = [];
  let explanation = '';

  if (!rawInput) {
    return {
      rawInput: '',
      detectedType: 'general',
      generatedId: '',
      warnings: ['Введите название алгоритма на русском языке'],
      explanation: 'Ожидание ввода...',
    };
  }

  // 1. Detect algorithm type and extract blocks
  let detectedType: AlgorithmType = customOptions?.overrideType || 'general';
  let block = customOptions?.forceBlock || '';
  let blockCode = '';
  let actionVerb = '';
  let actionCode = '';
  let targetObject = '';
  let targetObjectCode = '';
  let filterParams = '';
  let filterParamsCode = '';
  let baseObject = '';
  let baseObjectCode = '';

  // Extract block prefix if specified via dots or colons: e.g. "Лимиты. Рассчитать VaR" or "КИБ. ЗПР. Создать"
  const dotParts = rawInput.split(/[.:]\s*/).map((s) => s.trim()).filter(Boolean);
  let mainBody = rawInput;

  if (dotParts.length >= 2 && !customOptions?.forceBlock) {
    // Check if initial parts match known blocks
    const blockParts: string[] = [];
    let idx = 0;
    while (idx < dotParts.length - 1) {
      const part = dotParts[idx];
      const code = phraseToCode(part);
      if (code) {
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
    blockCode = phraseToCode(block);
  }

  // Check for Filter Condition pattern:
  // "Фильтрация <Объект> по <Параметры>[, на основании <Базовый объект>]"
  const filterMatch = mainBody.match(/фильтрация\s+([^,]+?)(?:\s+по\s+([^,]+?))?(?:,\s*на\s+основании\s+(.+)|$)/i);
  if (filterMatch) {
    detectedType = 'filter_condition';
    targetObject = filterMatch[1]?.trim() || '';
    filterParams = filterMatch[2]?.trim() || '';
    baseObject = filterMatch[3]?.trim() || '';

    targetObjectCode = phraseToCode(targetObject);
    if (filterParams) {
      filterParamsCode = phraseToCode(filterParams);
    }
    if (baseObject) {
      baseObjectCode = phraseToCode(baseObject);
    }

    explanation = 'Распознано: Условие фильтрации для выбора элементов GreenData.';
  } else {
    // Check for Infinitive Verbs in Object Card algorithms
    const words = mainBody.split(/\s+/);
    const firstWord = words[0]?.toLowerCase() || '';

    // Check if begins with common infinitive verbs (создать, рассчитать, сформировать, etc.)
    const isInfinitive = Object.keys(ACTION_VERBS_DICTIONARY).some(
      (verb) => verb.endsWith('ть') || verb.endsWith('ти') || verb.endsWith('чь')
    );

    if (isInfinitive && ACTION_VERBS_DICTIONARY[firstWord]) {
      actionVerb = words[0];
      actionCode = ACTION_VERBS_DICTIONARY[firstWord];
      targetObject = words.slice(1).join(' ');
      targetObjectCode = phraseToCode(targetObject);

      if (firstWord.startsWith('рассчит') || firstWord.startsWith('вычисл')) {
        detectedType = 'calculation';
        explanation = 'Распознано: Алгоритм вычисления / расчета параметров.';
      } else if (firstWord.startsWith('провер') || firstWord.startsWith('валид')) {
        detectedType = 'validation';
        explanation = 'Распознано: Алгоритм проверки / валидации.';
      } else {
        detectedType = 'card_action';
        explanation = 'Распознано: Алгоритм карточки объекта с глаголом в инфинитиве.';
      }
    } else {
      // General algorithm
      detectedType = 'general';
      explanation = 'Распознано: Общий алгоритм GreenData.';
    }
  }

  // Construct Final ID
  const parts: string[] = [];

  // 1. Block prefix
  if (blockCode) {
    parts.push(blockCode);
  }

  // 2. Body based on type
  if (detectedType === 'filter_condition') {
    parts.push('FILTER');
    if (targetObjectCode) parts.push(targetObjectCode);
    if (filterParamsCode) {
      parts.push(`BY_${filterParamsCode}`);
    }
    if (baseObjectCode) {
      parts.push(`BASED_ON_${baseObjectCode}`);
    }
  } else if (detectedType === 'card_action' || detectedType === 'calculation' || detectedType === 'validation') {
    // For calculation or standard card action, put object/action in logical order
    if (targetObjectCode && actionCode) {
      // If VaR or specific metrics, e.g. LIM_VAR_CALC_ALG
      if (targetObjectCode.includes('VAR') || targetObjectCode.includes('RISK')) {
        parts.push(targetObjectCode);
        parts.push(actionCode);
      } else {
        parts.push(actionCode);
        parts.push(targetObjectCode);
      }
    } else if (actionCode) {
      parts.push(actionCode);
    } else {
      const code = phraseToCode(mainBody);
      if (code) parts.push(code);
    }
  } else {
    // General
    const code = phraseToCode(mainBody);
    if (code) parts.push(code);
  }

  // 3. Postfix
  const defaultPostfix = customOptions?.postfix !== undefined ? customOptions.postfix : '_ALG';
  let generatedId = parts.filter(Boolean).join('_').replace(/__+/g, '_').toUpperCase();

  if (defaultPostfix && !generatedId.endsWith(defaultPostfix.replace(/^_/, ''))) {
    if (defaultPostfix.startsWith('_')) {
      generatedId += defaultPostfix;
    } else {
      generatedId += `_${defaultPostfix}`;
    }
  }

  // Special checks / warnings
  if (!blockCode && !customOptions?.forceBlock) {
    warnings.push('Рекомендуется указывать префикс блока в начале названия (например «Лимиты. ...» или «КИБ. ...»)');
  }

  if (detectedType === 'card_action' && !actionVerb) {
    warnings.push('Название алгоритма карточки объектов должно содержать глагол в инфинитиве (например «Создать», «Рассчитать», «Сформировать»)');
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
    generatedId,
    warnings,
    explanation,
  };
}
