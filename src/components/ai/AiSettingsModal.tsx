import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Sparkles,
  Check,
  RotateCcw,
  Key,
  Server,
  Cpu,
  Zap,
  HelpCircle,
  Activity,
  Shield,
  Code,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { AiSettings, AiAuthType } from '../../types';
import { AI_PROVIDER_PRESETS, DEFAULT_AI_SETTINGS } from '../../hooks/useAiChat';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AiSettings;
  onSave: (updates: Partial<AiSettings>) => void;
  onReset: () => void;
  onTestConnection: (settings: AiSettings) => Promise<{ ok: boolean; message: string; latencyMs: number }>;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onReset,
  onTestConnection,
}) => {
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [authType, setAuthType] = useState<AiAuthType>(settings.authType || 'bearer');
  const [model, setModel] = useState(settings.model);
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [stream, setStream] = useState(settings.stream);
  const [customHeadersJson, setCustomHeadersJson] = useState(settings.customHeadersJson || '');
  const [showAdvancedHeaders, setShowAdvancedHeaders] = useState(Boolean(settings.customHeadersJson));

  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBaseUrl(settings.baseUrl);
      setApiKey(settings.apiKey);
      setAuthType(settings.authType || (settings.apiKey ? 'bearer' : 'none'));
      setModel(settings.model);
      setSystemPrompt(settings.systemPrompt);
      setTemperature(settings.temperature);
      setStream(settings.stream);
      setCustomHeadersJson(settings.customHeadersJson || '');
      setShowAdvancedHeaders(Boolean(settings.customHeadersJson));
      setTestResult(null);
    }
  }, [isOpen, settings]);

  const handleSelectPreset = (preset: (typeof AI_PROVIDER_PRESETS)[0]) => {
    setBaseUrl(preset.baseUrl);
    setModel(preset.defaultModel);
    if ('authType' in preset && preset.authType) {
      setAuthType(preset.authType);
    }
    setTestResult(null);
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection({
        baseUrl,
        apiKey,
        authType,
        model,
        systemPrompt,
        temperature,
        stream,
        customHeadersJson,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Ошибка тестирования' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      authType,
      model: model.trim(),
      systemPrompt: systemPrompt.trim(),
      temperature,
      stream,
      customHeadersJson: customHeadersJson.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройки ИИ подключения (OpenAI Compatibility)"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onReset();
              setBaseUrl(DEFAULT_AI_SETTINGS.baseUrl);
              setApiKey('');
              setAuthType('bearer');
              setModel(DEFAULT_AI_SETTINGS.model);
              setSystemPrompt(DEFAULT_AI_SETTINGS.systemPrompt);
              setTemperature(DEFAULT_AI_SETTINGS.temperature);
              setStream(DEFAULT_AI_SETTINGS.stream);
              setCustomHeadersJson('');
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Сброс
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Отмена
            </Button>
            <Button variant="emerald" size="sm" onClick={handleSave} leftIcon={<Check className="w-3.5 h-3.5" />}>
              Сохранить
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-3.5 text-xs">
        {/* Quick Provider Selector Chips */}
        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Готовые пресеты провайдеров:</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AI_PROVIDER_PRESETS.map((p) => {
              const isActive = baseUrl === p.baseUrl;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            <span>Base URL сервера или шлюза</span>
          </label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://ai-server:8000/v1 или https://api.openai.com/v1"
            required
          />
          <span className="text-[10px] text-gray-400 mt-0.5 block">
            Адрес OpenAI-совместимого сервера (эндпоинт <code>/chat/completions</code> подставится автоматически)
          </span>
        </div>

        {/* Auth Type & API Key */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Тип авторизации</span>
              </label>
              <Select
                value={authType}
                onChange={(val) => setAuthType(val as AiAuthType)}
                options={[
                  { value: 'bearer', label: 'Bearer токен (Authorization: Bearer)' },
                  { value: 'api-key', label: 'api-key (Azure OpenAI / шлюзы)' },
                  { value: 'x-api-key', label: 'X-API-Key (Заголовок X-API-Key)' },
                  { value: 'none', label: 'Без заголовка (None — по IP / VPN)' },
                ]}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                <span>API-ключ / Токен</span>
              </label>
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={authType === 'none' ? 'Не требуется для сети' : 'sk-... или токен'}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title={showApiKey ? 'Скрыть ключ' : 'Показать ключ'}
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                }
              />
            </div>
          </div>

          <p className="text-[10px] text-gray-500 leading-normal">
            💡 Если вы в подсети GreenData и сервер авторизует без ключа — выберите «Без заголовка (None)» и оставьте поле ключа пустым.
          </p>
        </div>

        {/* Model Name */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>Название модели (Model ID)</span>
            </label>
            <span className="text-[10px] text-gray-400">Например: deepseek-coder, gpt-4o-mini</span>
          </div>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="deepseek-coder"
            required
          />
        </div>

        {/* System Prompt */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Системный промпт (Инструкция ассистента)</span>
            </label>
            <button
              type="button"
              onClick={() => setSystemPrompt(DEFAULT_AI_SETTINGS.systemPrompt)}
              className="text-[10px] text-emerald-600 hover:underline"
            >
              Восстановить GD промпт
            </button>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-xs resize-y"
          />
        </div>

        {/* Temperature & Streaming */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-gray-800 text-[11px] block">
                Температура генерации (Креативность)
              </span>
              <span className="text-[10px] text-gray-500 block">
                Меньше — строже и точнее, больше — разнообразнее
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-24 accent-emerald-600 cursor-pointer"
              />
              <span className="font-mono font-bold text-gray-800 text-xs w-7 text-right">
                {temperature.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="space-y-0.5">
              <span className="font-semibold text-gray-800 text-[11px] block">
                Потоковый вывод (Streaming SSE)
              </span>
              <span className="text-[10px] text-gray-500 block">
                Отображать текст ответа по мере генерации в реальном времени
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={stream}
                onChange={(e) => setStream(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Advanced: Custom Headers (JSON) */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvancedHeaders(!showAdvancedHeaders)}
            className="text-[11px] text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showAdvancedHeaders ? 'Скрыть доп. заголовки (JSON)' : '+ Дополнительные HTTP-заголовки (JSON)'}</span>
          </button>

          {showAdvancedHeaders && (
            <div className="mt-2 space-y-1 animate-slide-down">
              <textarea
                value={customHeadersJson}
                onChange={(e) => setCustomHeadersJson(e.target.value)}
                placeholder={'{\n  "X-Custom-Auth": "token",\n  "User-Agent": "MyClient"\n}'}
                rows={3}
                className="w-full px-2.5 py-1.5 font-mono text-[11px] bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-gray-400 block">
                Произвольные заголовки в формате JSON для внутренних корпоративных шлюзов
              </span>
            </div>
          )}
        </div>

        {/* Test Connection Bar */}
        <div className="space-y-2 pt-1 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRunTest}
              disabled={isTesting}
              leftIcon={<Activity className={`w-3.5 h-3.5 text-sky-600 ${isTesting ? 'animate-spin' : ''}`} />}
            >
              {isTesting ? 'Проверка соединения...' : 'Проверить соединение'}
            </Button>

            <span className="text-[10px] text-gray-400">
              Тестовый пинг к серверу
            </span>
          </div>

          {testResult && (
            <div
              className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 animate-fade-in whitespace-pre-line ${
                testResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.ok ? (
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <HelpCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed flex-1">{testResult.message}</span>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
