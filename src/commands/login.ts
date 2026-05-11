import chalk from 'chalk';
import type { Command } from 'commander';
import { AuthService } from '@/api/auth-service';
import { loadWithFrameConfig } from '@/lib/config';
import { BaseCommand } from '@/core/base-command';
import type { EnvVariable } from '@/lib/env';

export class LoginCommand extends BaseCommand {
  readonly name = 'login';
  readonly description = chalk.green('Authenticate and output WITHFRAME_TOKEN export command');

  constructor(private readonly authService: AuthService) {
    super();
  }

  protected requiredEnvVariables(): EnvVariable[] {
    return ['WITHFRAME_REGISTRY_URL'];
  }

  protected configure(command: Command): Command {
    return command
      .option('--no-open', 'Do not open browser automatically')
      .option('--cwd <path>', 'Resolve config from directory');
  }

  protected async execute(options: {
    open?: boolean;
    cwd?: string;
  }): Promise<void> {
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
    console.log(chalk.cyan('  Export this token in your shell:'));
    console.log(chalk.white(`  export WITHFRAME_TOKEN="${authResult.accessToken}"`));
    console.log('');
  }
}
