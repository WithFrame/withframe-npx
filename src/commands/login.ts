import chalk from 'chalk';
import type { Command } from 'commander';
import { AuthService } from '@/api/authService';
import { loadWithFrameConfig } from '@/lib/config';
import { BaseCommand } from '@/core/BaseCommand';
import { TokenStore } from '@/lib/tokenStore';

export class LoginCommand extends BaseCommand {
  readonly name = 'login';
  readonly description = chalk.green('Authenticate WithFrame CLI via Device Flow');

  constructor(
    private readonly authService: AuthService,
    private readonly tokenStore: TokenStore,
  ) {
    super();
  }

  protected configure(command: Command): Command {
    return command
      .option('-r, --registry <url>', 'Override registry base URL')
      .option('--no-open', 'Do not open browser automatically')
      .option('--cwd <path>', 'Resolve config from directory');
  }

  protected async execute(options: {
    registry?: string;
    open?: boolean;
    cwd?: string;
  }): Promise<void> {
    const cwd = options.cwd?.trim() || process.cwd();
    await loadWithFrameConfig(cwd);

    const session = await this.runTask(
      async ({ spinner }) => {
        spinner.text = chalk.cyan('Waiting for browser approval...');
        return this.authService.login({ openBrowser: options.open });
      },
      {
        spinner: {
          text: chalk.cyan('🔐 Starting device login...'),
          spinner: 'dots',
          color: 'cyan',
        },
        successText: chalk.green.bold('Logged in successfully'),
        failureText: chalk.red.bold('Login failed'),
      },
    );

    console.log('');
    console.log(chalk.gray(`  Verification URL: ${session.verificationUri}`));
    console.log(chalk.gray(`  Code: ${session.userCode}`));
    console.log(chalk.gray(`  Token cache: ${this.tokenStore.getAuthFilePath()}`));
    console.log('');
  }
}
