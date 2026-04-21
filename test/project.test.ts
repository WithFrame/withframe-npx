import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { shouldInstallManifestDependencies } from '@/lib/project';

describe('project helpers', () => {
  it('returns false when package.json does not exist', async () => {
    const projectDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-project-helpers-'));

    try {
      await expect(shouldInstallManifestDependencies(projectDir)).resolves.toBe(false);
    } finally {
      await rm(projectDir, { recursive: true, force: true });
    }
  });

  it('returns false when package.json does not include expo or react-native', async () => {
    const projectDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-project-helpers-'));
    await writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(
        {
          name: 'web-only-project',
          dependencies: {
            react: '^19.0.0',
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    try {
      await expect(shouldInstallManifestDependencies(projectDir)).resolves.toBe(false);
    } finally {
      await rm(projectDir, { recursive: true, force: true });
    }
  });

  it('returns true when package.json includes expo', async () => {
    const projectDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-project-helpers-'));
    await writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(
        {
          name: 'expo-project',
          dependencies: {
            expo: '^54.0.0',
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    try {
      await expect(shouldInstallManifestDependencies(projectDir)).resolves.toBe(true);
    } finally {
      await rm(projectDir, { recursive: true, force: true });
    }
  });
});
