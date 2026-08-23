/**
 * GreenData Algorithm ID Generator Utility (v2.0)
 * Intelligent semantic parser and English code generator for GreenData algorithms.
 *
 * Rules:
 * - Meaningful English UPPER_SNAKE_CASE identifier
 * - Removes boilerplate words (e.g. "Алгоритм", "Функция")
 * - Expands Russian abbreviations: (юл) -> LE, (фл) -> IE, (ип) -> IP, НПП -> NPP, КИБ -> CIB, ЗПР -> ZPR
 * - Translates action nouns and infinitive verbs: "определения" -> DTRM, "проверки" -> CHECK
 * - Deduplicates repeated semantic tokens (e.g. "объектов проверки для проверки" -> CHECK_OBJ)
 * - Recognizes GreenData blocks and naming patterns
 */

import { AlgorithmParseResult, AlgorithmType } from '../types';

// Multi-word exact and regex replacements (checked first)
const COMPOUND_PHRASES: Array<{ pattern: RegExp; code: string }> = [
  // Legal forms and entities
  { pattern: /\((?:юл|юр\.?\s*лицо|юрлицо|юридическое\s+лицо|юридических\s+лиц)\)/gi, code: 'LE' },
  { pattern: /\((?:фл|физ\.?\s*лицо|физлицо|физическое\s+лицо|физических\s+лиц)\)/gi, code: 'IE' },
  { pattern: /\((?:ип|индивидуальный\s+предприниматель)\)/gi, code: 'IP' },
  { pattern: /\b(?:юл|юр\.?\s*лицо|юрлицо|юридическое\s+лицо|юридических\s+лиц|юридическим\s+лицам)\b/gi, code: 'LE' },
  { pattern: /\b(?:фл|физ\.?\s*лицо|физлицо|физическое\s+лицо|физических\s+лиц|физическим\s+лицам)\b/gi, code: 'IE' },
  { pattern: /\b(?:ип|индивидуальный\s+предприниматель|индивидуальных\s+предпринимателей)\b/gi, code: 'IP' },

  // GreenData standard patterns & phrases
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

// Stem-based dictionary for Russian words
// Matches prefixes / root forms
export const STEM_DICTIONARY: Array<{ prefix: string; code: string }> = [
  // Actions & Verbs
  { prefix: 'определен', code: 'DTRM' },
  { prefix: 'определит', code: 'DTRM' },
  { prefix: 'вычислен', code: 'CALC' },
  { prefix: 'вычислит', code: 'CALC' },
  { prefix: 'рассчит', code: 'CALC' },
  { prefix: 'расчет', code: 'CALC' },
  { prefix: 'пересчит', code: 'RECALC' },
  { prefix: 'перерасчет', code: 'RECALC' },
  { prefix: 'проверк', code: 'CHECK' },
  { prefix: 'провер', code: 'CHECK' },
  { prefix: 'валидац', code: 'VALID' },
  { prefix: 'валидир', code: 'VALID' },
  { prefix: 'создан', code: 'CREATE' },
  { prefix: 'создат', code: 'CREATE' },
  { prefix: 'формирован', code: 'GENERATE' },
  { prefix: 'сформироват', code: 'GENERATE' },
  { prefix: 'генерац', code: 'GENERATE' },
  { prefix: 'генерир', code: 'GENERATE' },
  { prefix: 'построен', code: 'BUILD' },
  { prefix: 'построит', code: 'BUILD' },
  { prefix: 'заполнен', code: 'FILL' },
  { prefix: 'заполнит', code: 'FILL' },
  { prefix: 'обновлен', code: 'UPDATE' },
  { prefix: 'обновит', code: 'UPDATE' },
  { prefix: 'изменен', code: 'UPDATE' },
  { prefix: 'изменит', code: 'UPDATE' },
  { prefix: 'редактирован', code: 'EDIT' },
  { prefix: 'редактир', code: 'EDIT' },
  { prefix: 'корректир', code: 'EDIT' },
  { prefix: 'удален', code: 'DELETE' },
  { prefix: 'удалит', code: 'DELETE' },
  { prefix: 'очистк', code: 'CLEAR' },
  { prefix: 'очистит', code: 'CLEAR' },
  { prefix: 'сброс', code: 'RESET' },
  { prefix: 'сбросит', code: 'RESET' },
  { prefix: 'поиск', code: 'FIND' },
  { prefix: 'найт', code: 'FIND' },
  { prefix: 'выборк', code: 'SELECT' },
  { prefix: 'выбор', code: 'SELECT' },
  { prefix: 'выбрат', code: 'SELECT' },
  { prefix: 'фильтрац', code: 'FILTER' },
  { prefix: 'фильтр', code: 'FILTER' },
  { prefix: 'сортировк', code: 'SORT' },
  { prefix: 'сортир', code: 'SORT' },
  { prefix: 'группировк', code: 'GROUP' },
  { prefix: 'группир', code: 'GROUP' },
  { prefix: 'агрегац', code: 'AGG' },
  { prefix: 'сопоставлен', code: 'MATCH' },
  { prefix: 'сопоставит', code: 'MATCH' },
  { prefix: 'сверк', code: 'RECONCILE' },
  { prefix: 'сверит', code: 'RECONCILE' },
  { prefix: 'маршрутизац', code: 'ROUTE' },
  { prefix: 'согласован', code: 'APPROVE' },
  { prefix: 'согласоват', code: 'APPROVE' },
  { prefix: 'утвержден', code: 'APPROVE' },
  { prefix: 'утвердит', code: 'APPROVE' },
  { prefix: 'отклонен', code: 'REJECT' },
  { prefix: 'отклонит', code: 'REJECT' },
  { prefix: 'отправк', code: 'SEND' },
  { prefix: 'отправит', code: 'SEND' },
  { prefix: 'получен', code: 'GET' },
  { prefix: 'получит', code: 'GET' },
  { prefix: 'прием', code: 'RECEIVE' },
  { prefix: 'принят', code: 'RECEIVE' },
  { prefix: 'выгрузк', code: 'EXPORT' },
  { prefix: 'выгрузит', code: 'EXPORT' },
  { prefix: 'экспорт', code: 'EXPORT' },
  { prefix: 'загрузк', code: 'IMPORT' },
  { prefix: 'загрузит', code: 'IMPORT' },
  { prefix: 'импорт', code: 'IMPORT' },
  { prefix: 'синхронизац', code: 'SYNC' },
  { prefix: 'синхронизир', code: 'SYNC' },
  { prefix: 'интеграц', code: 'INT' },
  { prefix: 'интегрир', code: 'INT' },
  { prefix: 'инициализац', code: 'INIT' },
  { prefix: 'инициализир', code: 'INIT' },
  { prefix: 'активац', code: 'ACTIVATE' },
  { prefix: 'активир', code: 'ACTIVATE' },
  { prefix: 'деактивац', code: 'DEACTIVATE' },
  { prefix: 'деактивир', code: 'DEACTIVATE' },
  { prefix: 'блокировк', code: 'BLOCK' },
  { prefix: 'заблокир', code: 'BLOCK' },
  { prefix: 'разблокировк', code: 'UNBLOCK' },
  { prefix: 'разблокир', code: 'UNBLOCK' },
  { prefix: 'архивац', code: 'ARCHIVE' },
  { prefix: 'архивир', code: 'ARCHIVE' },
  { prefix: 'копирован', code: 'COPY' },
  { prefix: 'скопир', code: 'COPY' },
  { prefix: 'дублирован', code: 'DUPLICATE' },
  { prefix: 'дублир', code: 'DUPLICATE' },
  { prefix: 'авторизац', code: 'AUTH' },
  { prefix: 'идентификац', code: 'IDENT' },
  { prefix: 'уведомлен', code: 'NOTIF' },
  { prefix: 'оповещен', code: 'NOTIF' },
  { prefix: 'уведомит', code: 'NOTIF' },
  { prefix: 'регистрац', code: 'REG' },
  { prefix: 'зарегистрир', code: 'REG' },
  { prefix: 'логирован', code: 'LOG' },
  { prefix: 'проведен', code: 'POST' },
  { prefix: 'провест', code: 'POST' },
  { prefix: 'отмен', code: 'CANCEL' },
  { prefix: 'возврат', code: 'RETURN' },
  { prefix: 'привязк', code: 'LINK' },
  { prefix: 'привязат', code: 'LINK' },
  { prefix: 'отвязк', code: 'UNLINK' },
  { prefix: 'отвязат', code: 'UNLINK' },
  { prefix: 'закрыт', code: 'CLOSE' },
  { prefix: 'открыт', code: 'OPEN' },
  { prefix: 'исполнен', code: 'EXEC' },
  { prefix: 'выполнен', code: 'EXEC' },

  // GreenData Blocks & Domains
  { prefix: 'нпп', code: 'NPP' },
  { prefix: 'киб', code: 'CIB' },
  { prefix: 'зпр', code: 'ZPR' },
  { prefix: 'лимит', code: 'LIM' },
  { prefix: 'кредит', code: 'LOAN' },
  { prefix: 'депозит', code: 'DEP' },
  { prefix: 'сделк', code: 'DEAL' },
  { prefix: 'платеж', code: 'PAY' },
  { prefix: 'расчет', code: 'SETTL' },
  { prefix: 'контрагент', code: 'CONTR' },
  { prefix: 'клиент', code: 'CLIENT' },
  { prefix: 'заемщик', code: 'BORROWER' },
  { prefix: 'кредитор', code: 'LENDER' },
  { prefix: 'вкладчик', code: 'DEPOSITOR' },
  { prefix: 'безопасност', code: 'SEC' },
  { prefix: 'риск', code: 'RISK' },
  { prefix: 'гаранти', code: 'GUARANTEE' },
  { prefix: 'факторинг', code: 'FACT' },
  { prefix: 'казначейств', code: 'TR' },
  { prefix: 'портфел', code: 'PORTFOLIO' },
  { prefix: 'договор', code: 'CONTRACT' },
  { prefix: 'заявк', code: 'APP' },
  { prefix: 'экспертиз', code: 'EXPERTISE' },
  { prefix: 'эксперт', code: 'EXPERT' },
  { prefix: 'экземпляр', code: 'INSTANCE' },
  { prefix: 'документ', code: 'DOC' },
  { prefix: 'карточк', code: 'CARD' },
  { prefix: 'пользовател', code: 'USER' },
  { prefix: 'рол', code: 'ROLE' },
  { prefix: 'групп', code: 'GROUP' },
  { prefix: 'задач', code: 'TASK' },
  { prefix: 'процесс', code: 'PROC' },
  { prefix: 'мониторинг', code: 'MON' },
  { prefix: 'аудит', code: 'AUDIT' },
  { prefix: 'справочник', code: 'DICT' },
  { prefix: 'реестр', code: 'REGISTRY' },
  { prefix: 'журнал', code: 'LOG' },
  { prefix: 'список', code: 'LIST' },
  { prefix: 'списк', code: 'LIST' },
  { prefix: 'отчет', code: 'RPT' },

  // Entities & Attributes
  { prefix: 'объект', code: 'OBJ' },
  { prefix: 'субъект', code: 'SUBJ' },
  { prefix: 'элемент', code: 'ITEM' },
  { prefix: 'услови', code: 'COND' },
  { prefix: 'параметр', code: 'PARAM' },
  { prefix: 'атрибут', code: 'ATTR' },
  { prefix: 'показател', code: 'INDICATOR' },
  { prefix: 'валют', code: 'CURR' },
  { prefix: 'дат', code: 'DATE' },
  { prefix: 'врем', code: 'TIME' },
  { prefix: 'период', code: 'PERIOD' },
  { prefix: 'срок', code: 'TERM' },
  { prefix: 'сумм', code: 'AMOUNT' },
  { prefix: 'статус', code: 'STATUS' },
  { prefix: 'состояни', code: 'STATE' },
  { prefix: 'тип', code: 'TYPE' },
  { prefix: 'вид', code: 'TYPE' },
  { prefix: 'категори', code: 'CAT' },
  { prefix: 'код', code: 'CODE' },
  { prefix: 'номер', code: 'NUM' },
  { prefix: 'наименован', code: 'NAME' },
  { prefix: 'названи', code: 'NAME' },
  { prefix: 'описан', code: 'DESC' },
  { prefix: 'значен', code: 'VALUE' },
  { prefix: 'признак', code: 'FLAG' },
  { prefix: 'флаг', code: 'FLAG' },
  { prefix: 'таблиц', code: 'TABLE' },
  { prefix: 'строк', code: 'ROW' },
  { prefix: 'колонк', code: 'COL' },
  { prefix: 'столбец', code: 'COL' },
  { prefix: 'верси', code: 'VER' },
  { prefix: 'шаблон', code: 'TPL' },
  { prefix: 'виджет', code: 'WIDGET' },
  { prefix: 'форм', code: 'FORM' },
  { prefix: 'пол', code: 'FIELD' },
  { prefix: 'кнопк', code: 'BTN' },
  { prefix: 'ссылк', code: 'LINK' },
  { prefix: 'файл', code: 'FILE' },
  { prefix: 'вложен', code: 'ATTACH' },
  { prefix: 'комментари', code: 'COMMENT' },
  { prefix: 'сообщен', code: 'MSG' },
  { prefix: 'счет', code: 'ACC' },
  { prefix: 'баланс', code: 'BALANCE' },
  { prefix: 'ставк', code: 'RATE' },
  { prefix: 'процент', code: 'PERCENT' },
  { prefix: 'комисси', code: 'FEE' },
  { prefix: 'штраф', code: 'PENALTY' },
  { prefix: 'график', code: 'SCHEDULE' },
  { prefix: 'транш', code: 'TRANCHE' },
  { prefix: 'обеспечен', code: 'COLLATERAL' },
  { prefix: 'залог', code: 'PLEDGE' },
  { prefix: 'поручительств', code: 'SURETY' },
  { prefix: 'рейтинг', code: 'RATING' },
  { prefix: 'ошибк', code: 'ERROR' },
  { prefix: 'предупрежден', code: 'WARN' },
  { prefix: 'результат', code: 'RES' },
  { prefix: 'истори', code: 'HIST' },
  { prefix: 'событи', code: 'EVENT' },
  { prefix: 'триггер', code: 'TRG' },
  { prefix: 'var', code: 'VAR' },
  { prefix: 'вар', code: 'VAR' },
];

// Stopwords to ignore in name construction
const STOPWORDS = new Set([
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
export function stemToCode(rawWord: string): string | null {
  const clean = rawWord.toLowerCase().replace(/[^a-zа-я0-9_-]/gi, '').trim();
  if (!clean || STOPWORDS.has(clean)) return null;

  // Exact stem lookup (longest prefix match first)
  let bestMatch: { len: number; code: string } | null = null;
  for (const item of STEM_DICTIONARY) {
    if (clean.startsWith(item.prefix)) {
      if (!bestMatch || item.prefix.length > bestMatch.len) {
        bestMatch = { len: item.prefix.length, code: item.code };
      }
    }
  }

  if (bestMatch) {
    return bestMatch.code;
  }

  // Fallback to clean transliteration
  return transliterate(clean);
}

/**
 * Parse an arbitrary Russian phrase into clean deduplicated uppercase English tokens
 */
export function phraseToTokens(phrase: string): string[] {
  if (!phrase) return [];

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

  const tokens: string[] = [];
  for (const w of rawWords) {
    // If it's a pre-matched compound code like __CHECK_OBJ__
    const compoundMatch = w.match(/^__([A-Z0-9_]+)__$/);
    if (compoundMatch) {
      const code = compoundMatch[1];
      if (!tokens.includes(code)) {
        tokens.push(code);
      }
      continue;
    }

    const code = stemToCode(w);
    if (code && !tokens.includes(code)) {
      tokens.push(code);
    }
  }

  return tokens;
}

/**
 * Main GreenData algorithm ID generator
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
      const tokens = phraseToTokens(part);
      if (tokens.length > 0) {
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
    blockCode = phraseToTokens(block).join('_');
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

    targetObjectCode = phraseToTokens(targetObject).join('_');
    if (filterParams) filterParamsCode = phraseToTokens(filterParams).join('_');
    if (baseObject) baseObjectCode = phraseToTokens(baseObject).join('_');
    explanation = 'Условие фильтрации для выбора элементов GreenData';
  } else {
    // Check for infinitive verbs or action nouns
    const firstWord = mainBody.split(/\s+/)[0]?.toLowerCase() || '';
    const firstTokens = phraseToTokens(firstWord);

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
      firstWord.startsWith('валид')
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
      firstWord.startsWith('удалит')
    ) {
      detectedType = 'card_action';
      actionVerb = firstWord;
      actionCode = firstTokens[0] || 'ACTION';
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
  const bodyTokens = phraseToTokens(mainBody);

  // 5. Assemble final ID tokens with intelligent ordering
  const parts: string[] = [];

  // Block prefix
  if (blockCode) {
    parts.push(blockCode);
  }

  if (detectedType === 'filter_condition') {
    parts.push('FILTER');
    if (targetObjectCode) parts.push(targetObjectCode);
    if (filterParamsCode) parts.push(`BY_${filterParamsCode}`);
    if (baseObjectCode) parts.push(`BASED_ON_${baseObjectCode}`);
  } else {
    // Merge body tokens (avoiding blockCode duplication)
    for (const t of bodyTokens) {
      if (!parts.includes(t)) {
        parts.push(t);
      }
    }
  }

  // 6. Postfix
  const defaultPostfix = customOptions?.postfix !== undefined ? customOptions.postfix : '_ALG';
  let generatedId = parts.filter(Boolean).join('_').replace(/__+/g, '_').toUpperCase();

  if (defaultPostfix && !generatedId.endsWith(defaultPostfix.replace(/^_/, ''))) {
    if (defaultPostfix.startsWith('_')) {
      generatedId += defaultPostfix;
    } else {
      generatedId += `_${defaultPostfix}`;
    }
  }

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
    generatedId,
    warnings,
    explanation,
  };
}
