import { describe, expect, it } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { TokenStore } from '@/lib/token-store';

const withEnv = async (key: string, value: string | undefined, fn: () => Promise<void>) => {
  const original = process.env[key];

  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }

  try {
    await fn();
  } finally {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
};

const withCwd = async (cwd: string, fn: () => Promise<void>) => {
  const original = process.cwd();
  process.chdir(cwd);

  try {
    await fn();
  } finally {
    process.chdir(original);
  }
};

describe('TokenStore', () => {
  it('reads token from WITHFRAME_TOKEN env', async () => {
    const tempHome = await mkdtemp(path.join(os.tmpdir(), 'withframe-home-'));
    await withEnv('HOME', tempHome, async () => {
      await withEnv('WITHFRAME_TOKEN', 'env-token', async () => {
        const tokenStore = new TokenStore();
        const token = await tokenStore.resolveAccessToken();

        expect(token).toEqual({ token: 'env-token', source: 'env' });
      });
    });
  });

  it('reads token from project .env when WITHFRAME_TOKEN is not exported', async () => {
    const tempHome = await mkdtemp(path.join(os.tmpdir(), 'withframe-home-'));
    const projectDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-project-'));
    await writeFile(path.join(projectDir, '.env'), 'WITHFRAME_TOKEN=project-token\n', 'utf8');

    await withEnv('HOME', tempHome, async () => {
      await withEnv('WITHFRAME_TOKEN', undefined, async () => {
        await withCwd(projectDir, async () => {
          const tokenStore = new TokenStore();
          const token = await tokenStore.resolveAccessToken();

          expect(token).toEqual({ token: 'project-token', source: 'env' });
        });
      });
    });
  });
});
