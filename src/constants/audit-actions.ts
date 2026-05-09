/**
 * Constantes de ações de auditoria do sistema SST Dashboard.
 * Adicione novas ações aqui conforme novos fluxos forem implementados.
 */

export const AUDIT_ACTIONS = {
  // Autenticação
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",

  // Usuários e acessos
  USER_CREATED: "USER_CREATED",
  ACCESS_ACTIVATED: "ACCESS_ACTIVATED",
  ROLE_CHANGED: "ROLE_CHANGED",
  USER_BLOCKED: "USER_BLOCKED",
  USER_INACTIVATED: "USER_INACTIVATED",

  // SST
  COLABORADOR_CREATED: "COLABORADOR_CREATED",
  COLABORADOR_UPDATED: "COLABORADOR_UPDATED",
  ASO_CREATED: "ASO_CREATED",
  TRAINING_CREATED: "TRAINING_CREATED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
