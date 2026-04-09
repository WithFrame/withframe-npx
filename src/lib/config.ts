import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { CONFIG_FILE_NAME } from '@/constants';
import type { WithFrameConfig } from '@/types';
import { normalizeProjectTarget, normalizeText } from './normalize';

// Builds an absolute path to the local CLI config file.
export const getConfigFilePath = (cwd: string): string => path.join(cwd, CONFIG_FILE_NAME);

// Reads and validates withframe.config.json from the given working directory.
export const loadWithFrameConfig = async (cwd: string): Promise<WithFrameConfig> => {
  const configPath = getConfigFilePath(cwd);

  try {
    await access(configPath);
  } catch {
    return {};
  }

  let parsed: unknown;
  try {
    const raw = await readFile(configPath, 'utf8');
    parsed = JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(
      `Failed to parse ${CONFIG_FILE_NAME}: ${error instanceof Error ? error.message : 'Invalid JSON'}`,
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`${CONFIG_FILE_NAME} must be a JSON object.`);
  }

  const safe = parsed as Record<string, unknown>;

  return {
    outputDir: normalizeText(safe.outputDir),
    target: normalizeProjectTarget(safe.target),
  };
};
