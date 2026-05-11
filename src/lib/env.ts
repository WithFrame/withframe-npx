export const ENV = {
  WITHFRAME_REGISTRY_URL: 'WITHFRAME_REGISTRY_URL',
  WITHFRAME_TOKEN: 'WITHFRAME_TOKEN',
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

// Returns a required env var value or throws with an actionable message.
export const getRequiredEnvValue = (key: EnvVariable): string => {
  const value = getEnvValue(key);
  if (value) {
    return value;
  }

  const envName = getEnvVariableName(key);
  throw new Error(`Missing required environment variable: ${envName}.`);
};
