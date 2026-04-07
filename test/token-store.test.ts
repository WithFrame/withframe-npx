import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { TokenStore } from '@/lib/tokenStore';

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

describe('TokenStore', () => {
  it('prefers WITHFRAME_TOKEN over file token', async () => {
    const tempHome = await mkdtemp(path.join(os.tmpdir(), 'withframe-home-'));

    await mkdir(path.join(tempHome, '.withframe'), { recursive: true });
    await writeFile(
      path.join(tempHome, '.withframe', 'auth.json'),
      JSON.stringify(
        {
          accessToken: 'file-token',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
        null,
        2,
      ),
      'utf8',
    );

    await withEnv('HOME', tempHome, async () => {
      await withEnv('WITHFRAME_TOKEN', 'env-token', async () => {
        const tokenStore = new TokenStore();
        const token = await tokenStore.resolveAccessToken();

        expect(token).toEqual({ token: 'env-token', source: 'env' });
      });
    });
  });

  it('reads token from file when env token is missing', async () => {
    const tempHome = await mkdtemp(path.join(os.tmpdir(), 'withframe-home-'));

    await mkdir(path.join(tempHome, '.withframe'), { recursive: true });
    await writeFile(
      path.join(tempHome, '.withframe', 'auth.json'),
      JSON.stringify(
        {
          accessToken: 'file-token',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
        null,
        2,
      ),
      'utf8',
    );

    await withEnv('HOME', tempHome, async () => {
      await withEnv('WITHFRAME_TOKEN', undefined, async () => {
        const tokenStore = new TokenStore();
        const token = await tokenStore.resolveAccessToken();

        expect(token).toEqual({ token: 'file-token', source: 'file' });
      });
    });
  });

  it('clears stored token file (logout behavior)', async () => {
    const tempHome = await mkdtemp(path.join(os.tmpdir(), 'withframe-home-'));

    await mkdir(path.join(tempHome, '.withframe'), { recursive: true });
    await writeFile(
      path.join(tempHome, '.withframe', 'auth.json'),
      JSON.stringify(
        {
          accessToken: 'file-token',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
        null,
        2,
      ),
      'utf8',
    );

    await withEnv('HOME', tempHome, async () => {
      await withEnv('WITHFRAME_TOKEN', undefined, async () => {
        const tokenStore = new TokenStore();
        await tokenStore.clearToken();

        const token = await tokenStore.resolveAccessToken();
        expect(token).toBeNull();
      });
    });
  });
});
