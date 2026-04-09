import { beforeEach, describe, expect, it, vi } from 'vitest';
import open from 'open';
import { AuthService } from '@/api/auth-service';
import { RegistryClient } from '@/api/registry-client';
import { DEFAULT_REGISTRY_URL } from '@/constants';
import { TokenStore } from '@/lib/tokenStore';
import { delay } from '@/utils/delay';

vi.mock('open', () => ({
  default: vi.fn(async () => undefined),
}));

vi.mock('@/utils/delay', () => ({
  delay: vi.fn(async () => undefined),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('polls device flow and stores token after authorization', async () => {
    const tokenStore = {
      saveToken: vi.fn(async () => undefined),
    } as unknown as TokenStore;

    const registryClient = {
      startDeviceFlow: vi.fn(async () => ({
        deviceCode: 'device-code',
        userCode: 'ABCD1234',
        verificationUri: `${DEFAULT_REGISTRY_URL}/device`,
        verificationUriComplete: `${DEFAULT_REGISTRY_URL}/device?user_code=ABCD1234`,
        interval: 1,
        expiresIn: 30,
      })),
      pollDeviceFlow: vi
        .fn()
        .mockResolvedValueOnce({ status: 'pending', interval: 1 })
        .mockResolvedValueOnce({
          status: 'authorized',
          accessToken: 'access-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        }),
    } as unknown as RegistryClient;

    const service = new AuthService(tokenStore, registryClient);
    const result = await service.login({ openBrowser: true });

    expect(result).toEqual({
      userCode: 'ABCD1234',
      verificationUri: `${DEFAULT_REGISTRY_URL}/device`,
    });
    expect(registryClient.startDeviceFlow).toHaveBeenCalledTimes(1);
    expect(registryClient.pollDeviceFlow).toHaveBeenCalledTimes(2);
    expect(tokenStore.saveToken).toHaveBeenCalledWith('access-token', 3600);
    expect(vi.mocked(delay)).toHaveBeenCalled();
    expect(vi.mocked(open)).toHaveBeenCalledWith(
      `${DEFAULT_REGISTRY_URL}/device?user_code=ABCD1234`,
    );
  });
});
