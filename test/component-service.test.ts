import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { ComponentService } from '@/api/component-service';
import { RegistryClient } from '@/api/registry-client';
import { TokenStore } from '@/lib/tokenStore';

describe('ComponentService', () => {
  it('fetches, parses and applies component manifest', async () => {
    const projectDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-component-service-'));
    await writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(
        {
          name: 'component-test',
          private: true,
          dependencies: {
            react: '^19.0.0',
            'react-native': '^0.81.0',
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    try {
      const tokenStore = {
        resolveAccessToken: vi.fn(async () => ({ token: 'token-123', source: 'env' as const })),
      } as unknown as TokenStore;

      const manifest = {
        files: [
          {
            path: 'auth/simple-inline-sign-in-form.tsx',
            content: 'export const SignIn = () => null;\n',
            overwrite: false,
          },
        ],
        dependencies: {
          react: '^19.0.0',
        },
        peerDependencies: {},
        devDependencies: {},
        meta: {
          target: 'react_native' as const,
          variant: 'sign-in-6--hook',
          isDefaultVariant: false,
          generatedAt: '2026-04-07T21:45:30.281Z',
          source: 'withframe-registry-v1' as const,
        },
      };

      const registryClient = {
        fetchComponent: vi.fn(async () => ({
          component: {
            id: 'sign-in-6',
            slug: 'simple-inline-sign-in-form',
            title: 'Inline Sign In Form',
            section: 'sign-in',
            version: 1,
          },
          manifest,
        })),
      } as unknown as RegistryClient;

      const onApplyStart = vi.fn();
      const service = new ComponentService(tokenStore, registryClient);

      const result = await service.addComponent(
        '  simple-inline-sign-in-form  ',
        {
          variant: 'hook',
          yes: true,
          cwd: projectDir,
          target: 'react_native',
        },
        { onApplyStart },
      );

      expect(registryClient.fetchComponent).toHaveBeenCalledWith({
        slug: 'simple-inline-sign-in-form',
        target: 'react_native',
        variant: 'hook',
        token: 'token-123',
      });
      expect(onApplyStart).toHaveBeenCalledTimes(1);
      expect(result.component.slug).toBe('simple-inline-sign-in-form');
      expect(result.installedDependencies).toEqual([]);

      const writtenFile = path.join(
        projectDir,
        'src',
        'components',
        'withframe',
        'auth',
        'simple-inline-sign-in-form.tsx',
      );
      await expect(readFile(writtenFile, 'utf8')).resolves.toBe('export const SignIn = () => null;\n');
    } finally {
      await rm(projectDir, { recursive: true, force: true });
    }
  });

  it('adds component without installing dependencies when package.json is missing', async () => {
    const projectDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-component-service-'));

    try {
      const tokenStore = {
        resolveAccessToken: vi.fn(async () => ({ token: 'token-123', source: 'env' as const })),
      } as unknown as TokenStore;

      const registryClient = {
        fetchComponent: vi.fn(async () => ({
          component: {
            id: 'card-1',
            slug: 'simple-card',
            title: 'Simple Card',
            section: 'cards',
            version: 1,
          },
          manifest: {
            files: [
              {
                path: 'cards/simple-card.tsx',
                content: 'export const SimpleCard = () => null;\n',
                overwrite: false,
              },
            ],
            dependencies: {
              'left-pad': '^1.3.0',
            },
            peerDependencies: {},
            devDependencies: {},
            meta: {
              target: 'expo' as const,
              variant: 'default',
              isDefaultVariant: true,
              generatedAt: '2026-04-22T09:00:00.000Z',
              source: 'withframe-registry-v1' as const,
            },
          },
        })),
      } as unknown as RegistryClient;

      const service = new ComponentService(tokenStore, registryClient);
      const result = await service.addComponent(
        'simple-card',
        {
          variant: 'default',
          yes: true,
          cwd: projectDir,
          target: 'expo',
        },
        {},
      );

      expect(result.installedDependencies).toEqual([]);
      await expect(
        readFile(
          path.join(projectDir, 'src', 'components', 'withframe', 'cards', 'simple-card.tsx'),
          'utf8',
        ),
      ).resolves.toBe('export const SimpleCard = () => null;\n');
    } finally {
      await rm(projectDir, { recursive: true, force: true });
    }
  });

  it('throws when no auth token is available', async () => {
    const projectDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-component-service-'));
    await writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(
        {
          name: 'component-test',
          private: true,
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
      const tokenStore = {
        resolveAccessToken: vi.fn(async () => null),
      } as unknown as TokenStore;
      const registryClient = {
        fetchComponent: vi.fn(),
      } as unknown as RegistryClient;
      const service = new ComponentService(tokenStore, registryClient);

      await expect(
        service.addComponent('button', { variant: 'default', cwd: projectDir, target: 'expo' }),
      ).rejects.toThrow(/No auth token found/);

      expect(registryClient.fetchComponent).not.toHaveBeenCalled();
    } finally {
      await rm(projectDir, { recursive: true, force: true });
    }
  });
});
