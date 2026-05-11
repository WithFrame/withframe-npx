import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShotService } from '@/api/shot-service';
import { RegistryClient } from '@/api/registry-client';
import { TokenStore } from '@/lib/token-store';
import { input, select } from '@inquirer/prompts';

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
}));

vi.mock('jimp', () => ({
  Jimp: {
    read: vi.fn(async () => ({
      bitmap: {
        width: 1170,
        height: 2532,
      },
    })),
  },
}));

describe('ShotService', () => {
  const stdinTty = process.stdin.isTTY;
  const stdoutTty = process.stdout.isTTY;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
  });

  afterAll(() => {
    Object.defineProperty(process.stdin, 'isTTY', { value: stdinTty, configurable: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: stdoutTty, configurable: true });
  });

  it('uploads screenshot to selected existing collection', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-shot-test-'));
    const filePath = path.join(tmpDir, 'shot.png');
    await writeFile(filePath, Buffer.from([1, 2, 3, 4]));

    try {
      vi.mocked(select)
        .mockResolvedValueOnce('red')
        .mockResolvedValueOnce('f2eecf6a-59c9-4986-8cae-f5c0f44d6a4e');

      const tokenStore = {
        resolveAccessToken: vi.fn(async () => ({ token: 'token-123', source: 'env' as const })),
      } as unknown as TokenStore;

      const registryClient = {
        fetchShotCollections: vi.fn(async () => ({
          items: [
            {
              collectionId: 'f2eecf6a-59c9-4986-8cae-f5c0f44d6a4e',
              title: 'My shots',
              updatedAt: new Date().toISOString(),
              screenshotsCount: 2,
            },
          ],
          hasMore: false,
          nextOffset: 1,
        })),
        uploadShot: vi.fn(async () => ({
          url: 'https://shot.withfra.me/s/f2eecf6a-59c9-4986-8cae-f5c0f44d6a4e',
        })),
      } as unknown as RegistryClient;

      const service = new ShotService(tokenStore, registryClient);
      const result = await service.uploadShot({ file: filePath });

      expect(result.url).toContain('/s/');
      expect(registryClient.fetchShotCollections).toHaveBeenCalledWith({
        token: 'token-123',
        offset: 0,
        limit: 40,
      });
      expect(registryClient.uploadShot).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'token-123',
          fileName: 'shot.png',
          mimeType: 'image/png',
          color: 'red',
          collectionId: 'f2eecf6a-59c9-4986-8cae-f5c0f44d6a4e',
        }),
      );
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('uploads screenshot to new collection when prompt selects create new', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-shot-test-'));
    const filePath = path.join(tmpDir, 'shot.png');
    await writeFile(filePath, Buffer.from([1, 2, 3, 4]));

    try {
      vi.mocked(select)
        .mockResolvedValueOnce('red')
        .mockResolvedValueOnce('__create_new_collection__');
      vi.mocked(input).mockResolvedValueOnce('');

      const tokenStore = {
        resolveAccessToken: vi.fn(async () => ({ token: 'token-123', source: 'env' as const })),
      } as unknown as TokenStore;

      const registryClient = {
        fetchShotCollections: vi.fn(async () => ({
          items: [],
          hasMore: false,
          nextOffset: 0,
        })),
        uploadShot: vi.fn(async () => ({
          url: 'https://shot.withfra.me/s/0cc27b59-a629-4915-a736-265196194b75',
        })),
      } as unknown as RegistryClient;

      const service = new ShotService(tokenStore, registryClient);
      const result = await service.uploadShot({ file: filePath });

      expect(result.url).toContain('/s/');
      expect(registryClient.uploadShot).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'token-123',
          fileName: 'shot.png',
          mimeType: 'image/png',
          color: 'red',
          collectionId: undefined,
          createNewCollection: true,
          collectionTitle: undefined,
        }),
      );
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('forwards collection title when create-new flow is selected', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-shot-test-'));
    const filePath = path.join(tmpDir, 'shot.png');
    await writeFile(filePath, Buffer.from([1, 2, 3, 4]));

    try {
      vi.mocked(select)
        .mockResolvedValueOnce('red')
        .mockResolvedValueOnce('__create_new_collection__');
      vi.mocked(input).mockResolvedValueOnce('My shots');

      const tokenStore = {
        resolveAccessToken: vi.fn(async () => ({ token: 'token-123', source: 'env' as const })),
      } as unknown as TokenStore;

      const registryClient = {
        fetchShotCollections: vi.fn(async () => ({
          items: [
            {
              collectionId: 'f2eecf6a-59c9-4986-8cae-f5c0f44d6a4e',
              title: 'My shots',
              updatedAt: new Date().toISOString(),
              screenshotsCount: 2,
            },
          ],
          hasMore: false,
          nextOffset: 1,
        })),
        uploadShot: vi.fn(async () => ({
          url: 'https://shot.withfra.me/s/f2eecf6a-59c9-4986-8cae-f5c0f44d6a4e',
        })),
      } as unknown as RegistryClient;

      const service = new ShotService(tokenStore, registryClient);
      const result = await service.uploadShot({ file: filePath });

      expect(result.url).toContain('/s/');
      expect(registryClient.uploadShot).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'token-123',
          fileName: 'shot.png',
          mimeType: 'image/png',
          color: 'red',
          collectionId: undefined,
          createNewCollection: true,
          collectionTitle: 'My shots',
        }),
      );
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('calls onUploadStart hook before upload begins', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-shot-test-'));
    const filePath = path.join(tmpDir, 'shot.png');
    await writeFile(filePath, Buffer.from([1, 2, 3, 4]));

    try {
      vi.mocked(select)
        .mockResolvedValueOnce('red')
        .mockResolvedValueOnce('__create_new_collection__');
      vi.mocked(input).mockResolvedValueOnce('');

      const tokenStore = {
        resolveAccessToken: vi.fn(async () => ({ token: 'token-123', source: 'env' as const })),
      } as unknown as TokenStore;

      const registryClient = {
        fetchShotCollections: vi.fn(async () => ({
          items: [],
          hasMore: false,
          nextOffset: 0,
        })),
        uploadShot: vi.fn(async () => ({
          url: 'https://shot.withfra.me/s/4b124b7f-e8ca-4948-b855-f58c8c8ca4ec',
        })),
      } as unknown as RegistryClient;

      const onUploadStart = vi.fn();

      const service = new ShotService(tokenStore, registryClient);
      await service.uploadShot(
        { file: filePath },
        {
          onUploadStart,
        },
      );

      expect(onUploadStart).toHaveBeenCalledTimes(1);
      expect(onUploadStart.mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(registryClient.uploadShot).mock.invocationCallOrder[0],
      );
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('throws when file is missing', async () => {
    const tokenStore = {
      resolveAccessToken: vi.fn(async () => ({ token: 'token-123', source: 'env' as const })),
    } as unknown as TokenStore;

    const service = new ShotService(tokenStore, {} as RegistryClient);

    await expect(service.uploadShot({ file: './missing-shot.png' })).rejects.toThrow(
      /File not found at path/,
    );
  });

  it('throws for unsupported file extension', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-shot-test-'));
    const filePath = path.join(tmpDir, 'shot.webp');
    await writeFile(filePath, Buffer.from([1, 2, 3, 4]));

    try {
      const tokenStore = {
        resolveAccessToken: vi.fn(async () => ({ token: 'token-123', source: 'env' as const })),
      } as unknown as TokenStore;

      const service = new ShotService(tokenStore, {} as RegistryClient);

      await expect(service.uploadShot({ file: filePath })).rejects.toThrow(
        /Unsupported screenshot file type/,
      );
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
