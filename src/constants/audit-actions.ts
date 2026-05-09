/**
 * Constantes de acoes de auditoria do sistema SST Dashboard.
 * Adicione novas acoes aqui conforme novos fluxos forem implementados.
 */

export const AUDIT_ACTIONS = {
  // Autenticacao
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED:  "LOGIN_FAILED",
  LOGOUT:        "LOGOUT",

  // Usuarios e acessos
  USER_CREATED:     "USER_CREATED",
  ACCESS_ACTIVATED: "ACCESS_ACTIVATED",
  ROLE_CHANGED:     "ROLE_CHANGED",
  USER_BLOCKED:     "USER_BLOCKED",
  USER_INACTIVATED: "USER_INACTIVATED",

  // SST
  COLABORADOR_CREATED: "COLABORADOR_CREATED",
  COLABORADOR_UPDATED: "COLABORADOR_UPDATED",
  ASO_CREATED:         "ASO_CREATED",
  TRAINING_CREATED:    "TRAINING_CREATED",

  // Convites de acesso
  INVITE_CREATED: "INVITE_CREATED",
  INVITE_USED:    "INVITE_USED",
  INVITE_EXPIRED: "INVITE_EXPIRED",
  INVITE_INVALID: "INVITE_INVALID",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
