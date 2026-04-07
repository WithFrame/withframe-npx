export const ENV = {
  WITHFRAME_REGISTRY_URL: 'WITHFRAME_REGISTRY_URL',
} as const;

export type EnvVariable = keyof typeof ENV;

// Resolves the real process.env key for a known environment variable.
export const getEnvVariableName = (key: EnvVariable): string => ENV[key];

// Returns a trimmed environment value or undefined when absent.
export const getEnvValue = (key: EnvVariable): string | undefined => {
  const value = process.env[getEnvVariableName(key)];
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
};
