import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ToastOptions } from '../types';

export interface ActiveToast extends ToastOptions {
  id: number;
}

export interface ToastApi {
  /** Показать уведомление (заменяет предыдущее). Возвращает id */
  show: (options: ToastOptions) => number;
  /** Скрыть уведомление (без id — текущее) */
  dismiss: (id?: number) => void;
}

const NOOP_API: ToastApi = { show: () => 0, dismiss: () => {} };

export const ToastContext = createContext<ToastApi>(NOOP_API);

/**
 * Доступ к уведомлениям из любого компонента боковой панели.
 * Вне провайдера (например, на странице чеклиста) — безопасная заглушка.
 */
export const useToast = (): ToastApi => useContext(ToastContext);

const DEFAULT_DURATION_MS = 3500;
const ACTION_DURATION_MS = 6000;

/**
 * Состояние очереди уведомлений для корня приложения: одно активное уведомление,
 * автоскрытие по таймеру (пауза, пока курсор над уведомлением).
 */
export function useToastController() {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const dismiss = useCallback((id?: number) => {
    setToast((prev) => (prev && (id === undefined || prev.id === id) ? null : prev));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    idRef.current += 1;
    const id = idRef.current;
    setToast({ ...options, id });
    return id;
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (!toast) return;
    const duration = toast.duration ?? (toast.action ? ACTION_DURATION_MS : DEFAULT_DURATION_MS);
    const id = toast.id;
    timerRef.current = setTimeout(() => dismiss(id), duration);
  }, [toast, dismiss]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer]);

  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss]);

  return {
    toast,
    api,
    /** Пауза автоскрытия (наведение курсора / фокус) */
    pause: clearTimer,
    resume: startTimer,
  };
}
