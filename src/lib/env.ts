import { readFileSync } from 'node:fs';
import path from 'node:path';

export const ENV = {
  WITHFRAME_TOKEN: 'WITHFRAME_TOKEN',
} as const;

export type EnvVariable = keyof typeof ENV;
const PROJECT_ENV_FILES = ['.env.local', '.env', '.env.development'] as const;

// Resolves the real process.env key for a known environment variable.
export const getEnvVariableName = (key: EnvVariable): string => ENV[key];

const formatEnvString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.trim() || undefined;
};

const unquote = (value: string): string => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const getValueFromProjectEnvFiles = (envName: string): string | undefined => {
  const cwd = process.cwd();

  for (const fileName of PROJECT_ENV_FILES) {
    const filePath = path.join(cwd, fileName);
    let content: string;

    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    for (const rawLine of content.split(/\r?\n/g)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const withoutExport = line.startsWith('export ') ? line.slice(7).trim() : line;
      const separatorIndex = withoutExport.indexOf('=');
      if (separatorIndex <= 0) continue;

      const key = withoutExport.slice(0, separatorIndex).trim();
      if (key !== envName) continue;

      const rawValue = withoutExport.slice(separatorIndex + 1).trim();
      const value = formatEnvString(unquote(rawValue));
      if (value) return value;
    }
  }

  return undefined;
};

// Returns a trimmed environment value or undefined when absent.
export const getEnvValue = (key: EnvVariable): string | undefined => {
  const envName = getEnvVariableName(key);
  const direct = formatEnvString(process.env[envName]);
  if (direct) return direct;

  return getValueFromProjectEnvFiles(envName);
};

// Returns a required env var value or throws with an actionable message.
export const getRequiredEnvValue = (key: EnvVariable): string => {
  const value = getEnvValue(key);
  if (value) return value;

  const envName = getEnvVariableName(key);
  throw new Error(`Missing required environment variable: ${envName}.`);
};
