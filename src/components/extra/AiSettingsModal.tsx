import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Key,
  Server,
  Cpu,
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
import { DEFAULT_AI_SETTINGS } from '../../hooks/useAiSettings';
import { getErrorMessage } from '../../utils/errorUtils';

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
  onTestConnection,
}) => {
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [authType, setAuthType] = useState<AiAuthType>(settings.authType || 'bearer');
  const [model, setModel] = useState(settings.model);
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
      setCustomHeadersJson(settings.customHeadersJson || '');
      setShowAdvancedHeaders(Boolean(settings.customHeadersJson));
      setTestResult(null);
    }
  }, [isOpen, settings]);

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection({
        baseUrl,
        apiKey,
        authType,
        model,
        customHeadersJson,
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({ ok: false, message: getErrorMessage(err, 'Не удалось проверить соединение') });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSave({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      authType,
      model: model.trim(),
      customHeadersJson: customHeadersJson.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Подключение ИИ для генерации ID"
      maxWidth="md"
      onSubmit={handleSave}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="secondary"
            size="sm"
            // Сбрасывает только поля формы: настройки (и ключ API) меняются лишь после «Сохранить»
            onClick={() => {
              setBaseUrl(DEFAULT_AI_SETTINGS.baseUrl);
              setApiKey('');
              setAuthType('bearer');
              setModel(DEFAULT_AI_SETTINGS.model);
              setCustomHeadersJson('');
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Сбросить
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

        {/* Base URL */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-accent-600" />
            <span>Base URL сервера или шлюза</span>
          </label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://ai-server:8000/v1 или https://api.openai.com/v1"
            required
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Адрес OpenAI-совместимого сервера (эндпоинт <code>/chat/completions</code> подставится автоматически)
          </span>
        </div>

        {/* Auth Type & API Key */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-accent-600" />
                <span>Тип авторизации</span>
              </label>
              <Select
                value={authType}
                onChange={(val) => setAuthType(val as AiAuthType)}
                options={[
                  { value: 'bearer', label: 'Bearer-токен (Authorization)' },
                  { value: 'api-key', label: 'api-key (Azure OpenAI / шлюзы)' },
                  { value: 'x-api-key', label: 'Заголовок X-API-Key' },
                  { value: 'none', label: 'Без заголовка (по IP / VPN)' },
                ]}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-accent-600" />
                <span>API-ключ или токен</span>
              </label>
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={authType === 'none' ? 'Не требуется' : 'sk-… или токен'}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title={showApiKey ? 'Скрыть ключ' : 'Показать ключ'}
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                }
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-normal">
            💡 Если вы в подсети GreenData и сервер авторизует без ключа — выберите тип авторизации «Без заголовка» и оставьте ключ пустым.
          </p>
        </div>

        {/* Model Name */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-accent-600" />
              <span>ID модели</span>
            </label>
            <span className="text-[10px] text-slate-400">Например: deepseek-coder, gpt-4o-mini</span>
          </div>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="deepseek-coder"
            required
          />
        </div>

        {/* Advanced: Custom Headers (JSON) */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvancedHeaders(!showAdvancedHeaders)}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
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
                className="w-full px-2.5 py-1.5 font-mono text-[11px] bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
              <span className="text-[10px] text-slate-400 block">
                Произвольные заголовки в формате JSON для внутренних корпоративных шлюзов
              </span>
            </div>
          )}
        </div>

        {/* Test Connection Bar */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRunTest}
              disabled={isTesting}
              leftIcon={<Activity className={`w-3.5 h-3.5 text-sky-600 ${isTesting ? 'animate-spin' : ''}`} />}
            >
              {isTesting ? 'Проверка соединения…' : 'Проверить соединение'}
            </Button>

            <span className="text-[10px] text-slate-400">
              Тестовый запрос к серверу
            </span>
          </div>

          {testResult && (
            <div
              className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 animate-fade-in whitespace-pre-line ${
                testResult.ok
                  ? 'bg-accent-50 border-accent-200 text-accent-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.ok ? (
                <Check className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
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
