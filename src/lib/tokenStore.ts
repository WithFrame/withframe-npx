import { mkdir, readFile, unlink, writeFile, chmod } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AUTH_FILE_NAME, TOKEN_ENV_KEY, WITHFRAME_DIR } from '@/constants';
import type { AuthFilePayload, AuthTokenResult } from '@/types';

// Checks that a value is a valid ISO date in the future.
const isFutureIsoDate = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() > Date.now();
};

export class TokenStore {
  private readonly authDirectoryPath: string = path.join(os.homedir(), WITHFRAME_DIR);
  private readonly authFilePath: string = path.join(this.authDirectoryPath, AUTH_FILE_NAME);

  // Returns the full path where auth credentials are stored.
  getAuthFilePath(): string {
    return this.authFilePath;
  }

  // Reads a valid token from env or auth file, otherwise returns null.
  async resolveAccessToken(): Promise<AuthTokenResult | null> {
    const envToken = process.env[TOKEN_ENV_KEY]?.trim();
    if (envToken) {
      return { token: envToken, source: 'env' };
    }

    let payload: AuthFilePayload;
    try {
      const raw = await readFile(this.authFilePath, 'utf8');
      payload = JSON.parse(raw) as AuthFilePayload;
    } catch {
      return null;
    }

    if (
      typeof payload?.accessToken !== 'string' ||
      !payload.accessToken.trim() ||
      !isFutureIsoDate(payload?.expiresAt)
    ) {
      await this.clearToken().catch(() => undefined);
      return null;
    }

    return { token: payload.accessToken.trim(), source: 'file' };
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
