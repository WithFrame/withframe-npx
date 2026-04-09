import open from 'open';
import { RegistryClient } from '@/api/registry-client';
import { TokenStore } from '@/lib/tokenStore';
import type { LoginOptions } from '@/types';
import { delay } from '@/utils/delay';

export class AuthService {
  constructor(
    private readonly tokenStore: TokenStore,
    private readonly registryClient: RegistryClient,
  ) {}

  async login({ openBrowser = true }: LoginOptions): Promise<{
    userCode: string;
    verificationUri: string;
  }> {
    const session = await this.registryClient.startDeviceFlow();

    if (openBrowser) {
      await open(session.verificationUriComplete).catch(() => {});
    }

    const deadline = Date.now() + session.expiresIn * 1000;
    let intervalSeconds = Math.max(1, session.interval);

    while (Date.now() < deadline) {
      await delay(intervalSeconds * 1000);

      const poll = await this.registryClient.pollDeviceFlow({ deviceCode: session.deviceCode });

      if (poll.status === 'pending') {
        intervalSeconds = Math.max(1, poll.interval ?? intervalSeconds);
        continue;
      }

      if (poll.status === 'authorized') {
        await this.tokenStore.saveToken(poll.accessToken, poll.expiresIn);
        return {
          userCode: session.userCode,
          verificationUri: session.verificationUri,
        };
      }

      throw new Error(poll.message);
    }

    throw new Error('Device login timed out. Please run `withframe login` again.');
  }
}
