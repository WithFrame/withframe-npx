import { describe, expect, it, vi } from 'vitest';
import { ComponentService } from '@/api/component-service';
import { RegistryClient } from '@/api/registry-client';
import { TokenStore } from '@/lib/tokenStore';
import { ProjectComponentService } from '@/services/projectComponentService';

describe('ComponentService', () => {
  it('fetches, parses and applies component manifest', async () => {
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

    const projectComponentService = {
      resolveContext: vi.fn(async () => ({
        projectRoot: '/tmp/project',
        target: 'react_native' as const,
        outputDir: 'src/components/withframe',
      })),
      collectOverwriteDecisions: vi.fn(async () => new Map()),
      applyManifest: vi.fn(async () => ({
        createdFiles: ['/tmp/project/src/components/withframe/auth/simple-inline-sign-in-form.tsx'],
        overwrittenFiles: [],
        skippedFiles: [],
        installedDependencies: ['react@^19.0.0'],
      })),
    } as unknown as ProjectComponentService;

    const onApplyStart = vi.fn();
    const service = new ComponentService(tokenStore, registryClient, projectComponentService);

    const result = await service.addComponent(
      '  simple-inline-sign-in-form  ',
      { variant: 'hook', yes: true },
      { onApplyStart },
    );

    expect(registryClient.fetchComponent).toHaveBeenCalledWith({
      slug: 'simple-inline-sign-in-form',
      target: 'react_native',
      variant: 'hook',
      token: 'token-123',
    });
    expect(projectComponentService.applyManifest).toHaveBeenCalledWith(
      expect.objectContaining({
        manifest,
      }),
    );
    expect(onApplyStart).toHaveBeenCalledTimes(1);
    expect(result.component.slug).toBe('simple-inline-sign-in-form');
    expect(result.installedDependencies).toEqual(['react@^19.0.0']);
  });

  it('throws when no auth token is available', async () => {
    const tokenStore = {
      resolveAccessToken: vi.fn(async () => null),
    } as unknown as TokenStore;

    const service = new ComponentService(
      tokenStore,
      {} as RegistryClient,
      {
        resolveContext: vi.fn(async () => ({
          projectRoot: '/tmp/project',
          target: 'expo' as const,
          outputDir: 'src/components/withframe',
        })),
      } as unknown as ProjectComponentService,
    );

    await expect(service.addComponent('button', { variant: 'default' })).rejects.toThrow(
      /No auth token found/,
    );
  });
});
