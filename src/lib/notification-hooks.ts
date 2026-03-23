import type { NotificationConfig } from "@/lib/notification-manager";
import { getNotificationManager } from "@/lib/notification-manager";
import { useEffect, useRef } from "react";

/**
 * Hook para notificar mudanças de estado
 * Compara estado anterior com novo estado e dispara notificação se houver mudança
 */
export function useNotifyOnChange<T>(
  data: T,
  config: {
    onSuccess?: (currentData: T, previousData?: T) => NotificationConfig;
    onError?: (currentData: T, previousData?: T) => NotificationConfig;
    compare?: (curr: T, prev: T) => boolean; // retorna true se houve mudança
  },
) {
  const previousDataRef = useRef<T | undefined>(undefined);
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    const previous = previousDataRef.current;
    const hasChanged =
      config.compare?.(data, previous as T) ??
      JSON.stringify(data) !== JSON.stringify(previous);

    if (hasChanged && !hasNotifiedRef.current) {
      if (config.onSuccess) {
        const notifConfig = config.onSuccess(data, previous);
        getNotificationManager().notify(notifConfig);
        hasNotifiedRef.current = true;
      }

      previousDataRef.current = data;
    }
  }, [data, config]);

  const resetNotification = () => {
    hasNotifiedRef.current = false;
  };

  return { resetNotification };
}

/**
 * Hook para notificar erros de mutação
 * Evita exibir o mesmo erro múltiplas vezes
 */
export function useNotifyMutationError(
  error: Error | null | undefined,
  config?: Partial<NotificationConfig>,
) {
  const previousErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (error && error.message !== previousErrorRef.current) {
      previousErrorRef.current = error.message;

      getNotificationManager().error(
        config?.message || "Ocorreu um erro ao salvar",
        {
          id: config?.id || `error_${Date.now()}`,
          description: error.message,
          deduplicateFor: 10000, // 10s
          ...config,
        },
      );
    }
  }, [error, config]);
}

/**
 * Hook para notificar sucesso de mutação
 * Dispara notificação apenas uma vez por mutação
 */
export function useNotifyMutationSuccess(
  isSuccess: boolean,
  config?: Partial<NotificationConfig>,
) {
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (isSuccess && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;

      getNotificationManager().success(
        config?.message || "Operação realizada com sucesso!",
        {
          id: config?.id || `success_${Date.now()}`,
          deduplicateFor: 5000, // 5s
          ...config,
        },
      );
    }
  }, [isSuccess, config]);

  const resetNotification = () => {
    hasNotifiedRef.current = false;
  };

  return { resetNotification };
}

/**
 * Hook para comparar dados e disparar notificação customizada
 * Mais flexível para casos complexos
 */
export function useStateComparison<T extends Record<string, unknown>>(
  currentState: T,
  config: {
    getNotification: (
      changes: Partial<T>,
    ) => NotificationConfig | null | undefined;
  },
) {
  const previousStateRef = useRef<T>(currentState);

  useEffect(() => {
    const previous = previousStateRef.current;

    // Identifica mudanças
    const changes: Partial<T> = {};
    let hasChanges = false;

    for (const key in currentState) {
      if (
        currentState[key] !== previous[key] &&
        Object.prototype.hasOwnProperty.call(previous, key)
      ) {
        changes[key] = currentState[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      const notifConfig = config.getNotification(changes);
      if (notifConfig) {
        getNotificationManager().notify(notifConfig);
      }
    }

    previousStateRef.current = currentState;
  }, [currentState, config]);
}
