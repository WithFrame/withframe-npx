import { TokenStore } from '@/lib/tokenStore';
import { RegistryClient } from './registry-client';
import { normalizeText } from '@/lib/normalize';
import { hasFile } from '@/lib/project';
import path from 'node:path';
import { UploadOptions, UploadResult } from '@/types';
import { access, readFile } from 'node:fs/promises';

export class UploadService {
  constructor(
    private readonly tokenStore: TokenStore,
    private readonly registryClient: RegistryClient,
  ) {}

  public async upload(opts: UploadOptions): Promise<UploadResult> {
    const compPath = await this.resolveComponentPath(opts.path);

    const tokenResult = await this.tokenStore.resolveAccessToken();
    if (!tokenResult) {
      throw new Error('No auth token found. Run `withframe login` first.');
    }

    try {
      await access(compPath);
      const content = await readFile(compPath, 'utf-8');
      const fileName = path.basename(compPath);
      return this.registryClient.uploadComponent({
        content,
        fileName,
        token: tokenResult.token,
      });
    } catch {
      throw new Error('File read error. Please check the file path and permissions.');
    }
  }

  private async resolveComponentPath(compPath: string): Promise<string> {
    const cleanedPath = normalizeText(compPath);
    if (!cleanedPath) {
      throw new Error('Component path is required.');
    }

    const absolutePath = path.resolve(process.cwd(), cleanedPath);
    const exist = await hasFile(absolutePath);
    if (!exist) {
      throw new Error(`File not found at path: ${absolutePath}`);
    }
    return absolutePath;
  }
}
