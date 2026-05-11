import { mkdir, unlink, writeFile, chmod } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AUTH_FILE_NAME, WITHFRAME_DIR } from '@/constants';
import type { AuthFilePayload, AuthTokenResult } from '@/types';
import { getEnvValue } from './env';

export class TokenStore {
  private readonly authDirectoryPath: string = path.join(os.homedir(), WITHFRAME_DIR);
  private readonly authFilePath: string = path.join(this.authDirectoryPath, AUTH_FILE_NAME);

  // Returns the full path where auth credentials are stored.
  getAuthFilePath(): string {
    return this.authFilePath;
  }

  async resolveAccessToken(): Promise<AuthTokenResult> {
    return { token: getEnvValue('WITHFRAME_TOKEN') as string, source: 'env' };
  }

  // Persists an access token with creation and expiration timestamps.
  async saveToken(accessToken: string, expiresInSeconds: number): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + Math.max(0, expiresInSeconds) * 1000);

    const payload: AuthFilePayload = {
      accessToken,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await mkdir(this.authDirectoryPath, { recursive: true, mode: 0o700 });
    await writeFile(this.authFilePath, `${JSON.stringify(payload, null, 2)}\n`, {
      mode: 0o600,
      encoding: 'utf8',
    });
    await chmod(this.authFilePath, 0o600).catch(() => undefined);
  }

  // Removes the stored auth token file if it exists.
  async clearToken(): Promise<void> {
    await unlink(this.authFilePath).catch(() => undefined);
  }
}
