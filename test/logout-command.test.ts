import { describe, expect, it, vi } from 'vitest';
import { LogoutCommand } from '@/commands/logout';
import { TokenStore } from '@/lib/token-store';

type LogoutCommandTestAccess = LogoutCommand & {
  runTask: <T>(
    task: (controls: {
      spinner: unknown;
      start: () => unknown;
      isStarted: () => boolean;
    }) => Promise<T>,
  ) => Promise<T>;
  execute: () => Promise<void>;
};

describe('LogoutCommand', () => {
  it('clears local token and prints token path', async () => {
    const tokenStore = {
      clearToken: vi.fn(async () => undefined),
      getAuthFilePath: vi.fn(() => '/tmp/.withframe/auth.json'),
    } as unknown as TokenStore;

    const command = new LogoutCommand(tokenStore) as unknown as LogoutCommandTestAccess;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(command, 'runTask').mockImplementation(async (task) => {
      return task({
        spinner: {},
        start: () => ({}),
        isStarted: () => true,
      });
    });

    await command.execute();

    expect(tokenStore.clearToken).toHaveBeenCalledTimes(1);
    expect(tokenStore.getAuthFilePath).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('/tmp/.withframe/auth.json'));

    logSpy.mockRestore();
  });
});
