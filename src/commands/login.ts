import chalk from 'chalk';
import type { Command } from 'commander';
import { AuthService } from '@/api/auth-service';
import { loadWithFrameConfig } from '@/lib/config';
import { BaseCommand } from '@/core/base-command';

export class LoginCommand extends BaseCommand {
  readonly name = 'login';
  readonly description = chalk.green('Authenticate and output WITHFRAME_TOKEN export command');

  constructor(private readonly authService: AuthService) {
    super();
  }

  protected configure(command: Command): Command {
    return command
      .option('--no-open', 'Do not open browser automatically')
      .option('--cwd <path>', 'Resolve config from directory');
  }

  protected async execute(options: { open?: boolean; cwd?: string }): Promise<void> {
    const cwd = options.cwd?.trim() || process.cwd();
    await loadWithFrameConfig(cwd);

    const authResult = await this.runTask(
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
    console.log(chalk.cyan('  Use this token in one of two ways:'));
    console.log(chalk.cyan('  export in your shell'));
    console.log(chalk.white(`  export WITHFRAME_TOKEN="${authResult.accessToken}"`));
    console.log(chalk.gray('  ─────────────── OR ───────────────'));
    console.log(chalk.cyan('  save in your project .env or .env.local'));
    console.log(chalk.white(`  WITHFRAME_TOKEN="${authResult.accessToken}"`));
    console.log('');
  }
}
