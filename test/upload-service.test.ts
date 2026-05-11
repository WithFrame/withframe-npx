import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { UploadService } from '@/api/upload-service';
import { RegistryClient } from '@/api/registry-client';
import { TokenStore } from '@/lib/token-store';

describe('UploadService', () => {
  it('reads component source and uploads it to registry', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'withframe-upload-test-'));
    const filePath = path.join(tmpDir, 'Button.tsx');
    const content = "import React from 'react';\nexport const Button = () => null;\n";
    await writeFile(filePath, content, 'utf8');

    try {
      const tokenStore = {
        resolveAccessToken: vi.fn(async () => ({ token: 'token-123', source: 'env' as const })),
      } as unknown as TokenStore;

      const registryClient = {
        uploadComponent: vi.fn(async () => ({
          componentId: 'draft-1',
          slug: 'draft-1',
          status: 'draft' as const,
          target: 'react_native' as const,
          editUrl: 'http://localhost:3000/developers/test/draft/draft-1',
          createdDraft: true,
        })),
      } as unknown as RegistryClient;

      const service = new UploadService(tokenStore, registryClient);
      const result = await service.upload({ path: filePath });

      expect(result.componentId).toBe('draft-1');
      expect(registryClient.uploadComponent).toHaveBeenCalledWith({
        content,
        fileName: 'Button.tsx',
        token: 'token-123',
      });
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

});
