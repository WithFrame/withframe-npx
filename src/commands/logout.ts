import chalk from 'chalk';
import { BaseCommand } from '@/core/base-command';
import { TokenStore } from '@/lib/tokenStore';

export class LogoutCommand extends BaseCommand {
  readonly name = 'logout';
  readonly description = chalk.red('Clear local WithFrame auth token');

  constructor(private readonly tokenStore: TokenStore) {
    super();
  }

  protected async execute(): Promise<void> {
    const authFilePath = await this.runTask(
      async () => {
        await this.tokenStore.clearToken();
        return this.tokenStore.getAuthFilePath();
      },
      {
        spinner: {
          text: chalk.cyan('Clearing local session...'),
          spinner: 'dots',
          color: 'yellow',
        },
        successText: chalk.yellow.bold('Logged out successfully'),
        failureText: chalk.red.bold('Failed to clear local session'),
      },
    );

    console.log(chalk.dim(`\n  Token cache cleared: ${authFilePath}\n`));
  }
}
