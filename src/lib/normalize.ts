import type { AddOptions, ProjectTarget } from '@/types';

// Normalizes unknown input to a non-empty trimmed string.
export const normalizeText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
};

// Validates and normalizes a supported project target value.
export const normalizeProjectTarget = (value: unknown): ProjectTarget | undefined => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  if (normalized === 'react_native' || normalized === 'expo') {
    return normalized;
  }

  throw new Error("Invalid target value. Use 'react_native' or 'expo'.");
};

// Produces a sanitized add-command options object.
export const normalizeOptions = (opts: AddOptions): AddOptions => {
  return {
    cwd: normalizeText(opts.cwd),
    target: normalizeProjectTarget(opts.target),
    variant: normalizeText(opts.variant) ?? 'default',
    yes: Boolean(opts.yes),
  };
};
