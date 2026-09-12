import { AiSettings, AiAlgorithmIdResult, AlgorithmType } from '../types';
import { resolveApiEndpoint, buildRequestHeaders, DEFAULT_AI_SETTINGS } from '../hooks/useAiChat';

const AI_SETTINGS_STORAGE_KEY = 'gd_ai_settings';

/**
 * Retrieve current AI configuration from storage
 */
export function getStoredAiSettings(): AiSettings {
  try {
    const saved = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_AI_SETTINGS;
}

/**
 * Check if the AI service is configured with necessary credentials
 */
export function isAiConfigured(): boolean {
  const settings = getStoredAiSettings();
  if (!settings.baseUrl?.trim()) return false;
  const auth = settings.authType || 'bearer';
  if (auth !== 'none' && !settings.apiKey?.trim()) return false;
  return true;
}

const SYSTEM_PROMPT = `Ты — ведущий технический архитектор платформы GreenData и эксперт по корпоративным стандартам именования алгоритмов.

Твоя задача: по русскому названию алгоритма сформировать правильный системный идентификатор (ID) на английском языке строго в соответствии с регламентом GreenData.

РЕГЛАМЕНТ И СТРУКТУРА ID В GREENDATA:
1. Идентификатор всегда пишется на английском языке, в верхнем регистре через знак подчеркивания (UPPERCASE_SNAKE_CASE).
2. Каноническая формула идентификатора:
   [ПРЕФИКС_БЛОКА]_[СУБЪЕКТ/ОБЪЕКТ]_[ДЕЙСТВИЕ/ПАРАМЕТР]_[ПОСТФИКС]
3. Стандартные префиксы блоков (если они указаны в начале или следуют из контекста):
   - «Лимиты...» -> LIM
   - «КИБ...» -> CIB
   - «НПП...» -> NPP
   - «ЗПР...» -> ZPR
   - «ФИН. ЗИ...» -> FIN_ZI
   - «ЖЦ» / «Жизненный цикл...» -> LC
   - «Сделки» / «Договоры» -> DEAL / CONTRACT
   - «СППР...» -> SPPR
4. Специфика типов алгоритмов:
   - Проверка / Валидация условий: ключевой токен CHECK (постфикс _VALID_ALG или _ALG).
   - Расчет / Вычисление: ключевой токен CALC (постфикс _CALC_ALG или _ALG).
   - Карточка объекта (действие пользователя): глагол в инфинитиве (CREATE, UPDATE, DELETE, EXEC, SEND, APPROVE, RESTART) (постфикс _CARD_ALG или _ALG).
   - Условие фильтрации для выбора элементов: конструкция FILTER_<ОБЪЕКТ>_BY_<ПАРАМЕТР>[_BASED_ON_<БАЗА>] (постфикс _FILTER_ALG или _ALG).
   - События жизненного цикла: BEFORE_SAVE, AFTER_SAVE, BEFORE_DELETE, AFTER_DELETE, ON_CHANGE, ON_OPEN, ON_CLOSE (постфикс _ALG).
5. Общепринятые профессиональные сокращения и термины (НЕ транслитерировать! Всегда переводить смысл!):
   - Юридическое лицо / ЮЛ -> LE
   - Физическое лицо / ФЛ -> IE
   - Индивидуальный предприниматель / ИП -> IP
   - Заемщик / Клиент -> BORROWER / CLIENT
   - Контрагент -> COUNTERPARTY
   - Обеспечение / Залог -> COLLATERAL / PLEDGE
   - Поручитель / Гарант -> GUARANTOR / SURETY
   - Заявка -> APP / REQ
   - Портфель -> PORTFOLIO
   - Согласование -> APPROVAL
   - Экспертиза -> EXPERTISE / REVIEW
   - Риск -> RISK
   - Статус -> STATUS
   - Устойчивость -> STABILITY
   - Полномочия -> RIGHTS / PERMISSION

ФОРМАТ ОТВЕТА:
Верни СТРОГО валидный JSON-объект без пояснений до или после него следующего вида:
{
  "primaryId": "ГЛАВНЫЙ_РЕКОМЕНДОВАННЫЙ_ID",
  "detectedType": "calculation" | "validation" | "card_action" | "filter_condition" | "general",
  "explanation": "Краткое пояснение бизнес-смысла и перевода на русском языке (1-2 предложения)",
  "variants": [
    { "id": "ВАРИАНТ_1", "desc": "Канонический вариант" },
    { "id": "ВАРИАНТ_2", "desc": "Краткий/компактный вариант" },
    { "id": "ВАРИАНТ_3", "desc": "Альтернативный вариант с префиксом области" }
  ]
}`;

/**
 * Format and sanitize an ID ensuring correct single underscores and postfix
 */
function sanitizeId(id: string, postfix?: string): string {
  let clean = id
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (postfix !== undefined && postfix !== '') {
    const cleanPostfix = postfix.replace(/^_+/, '');
    if (!clean.endsWith(cleanPostfix)) {
      clean += `_${cleanPostfix}`;
    }
  }
  return clean;
}

/**
 * Call the configured AI model to generate a semantic GreenData algorithm ID
 */
export async function generateAlgorithmIdViaAi(
  inputText: string,
  options?: {
    postfix?: string;
  }
): Promise<AiAlgorithmIdResult> {
  const trimmed = inputText.trim();
  if (!trimmed) {
    throw new Error('Введите наименование алгоритма на русском языке');
  }

  const settings = getStoredAiSettings();
  if (!settings.baseUrl) {
    throw new Error('Не настроен адрес сервера AI (Base URL). Перейдите во вкладку «AI Чат» и укажите настройки.');
  }

  const auth = settings.authType || 'bearer';
  if (auth !== 'none' && !settings.apiKey?.trim()) {
    throw new Error('Не указан API-ключ для модели AI. Перейдите во вкладку «AI Чат» и укажите ключ.');
  }

  const endpoint = resolveApiEndpoint(settings.baseUrl);
  const headers = buildRequestHeaders(settings);

  const postfix = options?.postfix !== undefined ? options.postfix : '_ALG';

  const userPrompt = `Наименование алгоритма: "${trimmed}"
Требуемый постфикс: "${postfix}"
Сформируй канонический идентификатор по стандартам GreenData и верни JSON.`;

  const requestBody = {
    model: settings.model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 800,
    stream: false,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errMessage = `${response.status} ${response.statusText}`;
    try {
      const errText = await response.text();
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) {
        errMessage = errJson.error.message;
      } else if (errJson.message) {
        errMessage = errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(`Ошибка AI модели (${response.status}): ${errMessage}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Пустой ответ от модели AI');
  }

  // Extract JSON from potential code fences ```json ... ```
  let jsonString = rawContent.trim();
  const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonMatch) {
    jsonString = jsonMatch[1].trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    // If JSON parsing fails, attempt to extract object { ... }
    const objectMatch = jsonString.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        parsed = JSON.parse(objectMatch[0]);
      } catch (inner) {
        throw new Error('Не удалось разобрать JSON-ответ от модели');
      }
    } else {
      throw new Error('Модель вернула ответ не в формате JSON');
    }
  }

  const primaryId = sanitizeId(parsed.primaryId || parsed.id || '', postfix);
  if (!primaryId) {
    throw new Error('Модель не смогла сформировать идентификатор');
  }

  const validTypes: AlgorithmType[] = ['general', 'card_action', 'filter_condition', 'validation', 'calculation'];
  const detectedType: AlgorithmType = validTypes.includes(parsed.detectedType) ? parsed.detectedType : 'general';

  const rawVariants: Array<{ id: string; desc?: string }> = Array.isArray(parsed.variants) ? parsed.variants : [];
  const variants = rawVariants
    .map((v) => ({
      id: sanitizeId(v.id, postfix),
      desc: v.desc || 'Альтернативный вариант',
    }))
    .filter((v) => v.id && v.id !== primaryId);

  // Deduplicate variants
  const uniqueVariants: Array<{ id: string; desc: string }> = [];
  const seen = new Set<string>([primaryId]);
  for (const v of variants) {
    if (!seen.has(v.id)) {
      seen.add(v.id);
      uniqueVariants.push(v);
    }
  }

  return {
    primaryId,
    detectedType,
    explanation: parsed.explanation || 'Семантический идентификатор сформирован моделью AI по стандартам GreenData',
    variants: uniqueVariants,
    source: 'ai',
  };
}
