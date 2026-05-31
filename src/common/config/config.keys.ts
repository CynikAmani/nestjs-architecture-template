import type { EnvironmentVariables } from './environment-variables.interface';

export const CONFIG_KEYS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  DATABASE_URL: 'DATABASE_URL',
  JWT_SECRET: 'JWT_SECRET',
  JWT_EXPIRATION_TIME: 'JWT_EXPIRATION_TIME',
} as const satisfies { [K in keyof EnvironmentVariables]: K };
