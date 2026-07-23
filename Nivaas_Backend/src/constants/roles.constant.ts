export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  HOST: 'host',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
