import { toast } from "sonner";

/**
 * Tipo de notificação
 */
export type NotificationType = "success" | "error" | "info" | "warning";

/**
 * Configuração de notificação
 */
export interface NotificationConfig {
  id: string; // ID único para deduplicação
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number; // em ms
  deduplicateFor?: number; // em ms - tempo que a notificação não será repetida
}

/**
 * Armazena informações sobre notificações já disparadas
 */
interface DisplayedNotification {
  id: string;
  timestamp: number;
  hash: string; // hash do conteúdo para comparação
}

/**
 * Classe para gerenciar notificações com deduplicação
 */
class NotificationManager {
  private displayedNotifications: Map<string, DisplayedNotification> =
    new Map();
  private localStorageKey = "displayed_notifications";
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromLocalStorage();
    this.startCleanupTimer();
  }

  /**
   * Carrega notificações do localStorage
   */
  private loadFromLocalStorage() {
    try {
      if (typeof window === "undefined") return;

      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        const notifications: DisplayedNotification[] = JSON.parse(stored);
        notifications.forEach((notif) => {
          this.displayedNotifications.set(notif.id, notif);
        });
      }
    } catch (error) {
      console.warn("Failed to load notifications from localStorage", error);
    }
  }

  /**
   * Salva notificações no localStorage
   */
  private saveToLocalStorage() {
    try {
      if (typeof window === "undefined") return;

      const notifications = Array.from(
        this.displayedNotifications.values(),
      ).slice(-100); // Mantém apenas últimas 100

      localStorage.setItem(this.localStorageKey, JSON.stringify(notifications));
    } catch (error) {
      console.warn("Failed to save notifications to localStorage", error);
    }
  }

  /**
   * Gera hash simples do conteúdo da notificação
   */
  private generateHash(config: NotificationConfig): string {
    const content = `${config.type}|${config.message}|${config.description || ""}`;
    return btoa(content); // Base64 encode
  }

  /**
   * Inicia timer de limpeza de notificações antigas
   */
  private startCleanupTimer() {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanupOldNotifications();
    }, 60000); // A cada 1 minuto
  }

  /**
   * Limpa notificações mais antigas que 24 horas
   */
  private cleanupOldNotifications() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    for (const [id, notif] of this.displayedNotifications.entries()) {
      if (now - notif.timestamp > maxAge) {
        this.displayedNotifications.delete(id);
      }
    }

    this.saveToLocalStorage();
  }

  /**
   * Verifica se a notificação já foi exibida recentemente
   */
  private wasRecentlyDisplayed(config: NotificationConfig): boolean {
    const existing = this.displayedNotifications.get(config.id);
    if (!existing) return false;

    const now = Date.now();
    const deduplicateFor = config.deduplicateFor || 5000; // 5s por padrão
    const timeSinceDisplay = now - existing.timestamp;

    // Verifica se foi exibida recentemente
    if (timeSinceDisplay < deduplicateFor) {
      // Verifica também se o conteúdo é idêntico
      const hash = this.generateHash(config);
      return existing.hash === hash;
    }

    return false;
  }

  /**
   * Registra notificação como exibida
   */
  private markAsDisplayed(config: NotificationConfig) {
    const hash = this.generateHash(config);
    this.displayedNotifications.set(config.id, {
      id: config.id,
      timestamp: Date.now(),
      hash,
    });

    this.saveToLocalStorage();
  }

  /**
   * Dispara notificação com deduplicação automática
   */
  public notify(config: NotificationConfig): string | number | undefined {
    // Verifica se foi exibida recentemente
    if (this.wasRecentlyDisplayed(config)) {
      return undefined; // Notificação não foi exibida
    }

    // Marca como exibida
    this.markAsDisplayed(config);

    // Dispara o toast
    const duration = config.duration ?? 4000;
    const toastId = toast[config.type](config.message, {
      description: config.description,
      duration,
    });

    return toastId;
  }

  /**
   * Dispara notificação de sucesso
   */
  public success(message: string, config?: Partial<NotificationConfig>) {
    return this.notify({
      type: "success",
      message,
      id: config?.id || `success_${Date.now()}`,
      ...config,
    });
  }

  /**
   * Dispara notificação de erro
   */
  public error(message: string, config?: Partial<NotificationConfig>) {
    return this.notify({
      type: "error",
      message,
      id: config?.id || `error_${Date.now()}`,
      ...config,
    });
  }

  /**
   * Dispara notificação de info
   */
  public info(message: string, config?: Partial<NotificationConfig>) {
    return this.notify({
      type: "info",
      message,
      id: config?.id || `info_${Date.now()}`,
      ...config,
    });
  }

  /**
   * Dispara notificação de aviso
   */
  public warning(message: string, config?: Partial<NotificationConfig>) {
    return this.notify({
      type: "warning",
      message,
      id: config?.id || `warning_${Date.now()}`,
      ...config,
    });
  }

  /**
   * Limpa histórico de uma notificação específica
   */
  public clearNotification(id: string) {
    this.displayedNotifications.delete(id);
    this.saveToLocalStorage();
  }

  /**
   * Limpa todo o histórico
   */
  public clearAll() {
    this.displayedNotifications.clear();
    this.saveToLocalStorage();
  }

  /**
   * Destruir o manager (parar timer)
   */
  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Instância singleton
let notificationManagerInstance: NotificationManager | null = null;

/**
 * Obtém ou cria a instância do NotificationManager
 */
export function getNotificationManager(): NotificationManager {
  if (!notificationManagerInstance) {
    notificationManagerInstance = new NotificationManager();
  }
  return notificationManagerInstance;
}

/**
 * Hook customizado para usar o notification manager
 */
export function useNotificationManager() {
  return getNotificationManager();
}

/**
 * Atalho para disparar notificações sem precisar do hook
 */
export const toastNotification = {
  success: (message: string, config?: Partial<NotificationConfig>) =>
    getNotificationManager().success(message, config),
  error: (message: string, config?: Partial<NotificationConfig>) =>
    getNotificationManager().error(message, config),
  info: (message: string, config?: Partial<NotificationConfig>) =>
    getNotificationManager().info(message, config),
  warning: (message: string, config?: Partial<NotificationConfig>) =>
    getNotificationManager().warning(message, config),
  notify: (config: NotificationConfig) =>
    getNotificationManager().notify(config),
  clearNotification: (id: string) =>
    getNotificationManager().clearNotification(id),
  clearAll: () => getNotificationManager().clearAll(),
};
