import chalk from 'chalk';
import type { Command } from 'commander';
import { InitService } from '@/api/init-service';
import { BaseCommand } from '@/core/base-command';
import { normalizeText } from '@/lib/normalize';

interface InitCommandOptions {
  cwd?: string;
  outputDir?: string;
  target?: string;
  force?: boolean;
}

export class InitCommand extends BaseCommand {
  readonly name = 'init';
  readonly description = chalk.blue('Create withframe.config.json in your project');

  constructor(private readonly initService: InitService) {
    super();
  }

  protected configure(command: Command): Command {
    return command
      .option('--cwd <path>', 'Project root directory')
      .option('-o, --output-dir <path>', 'Set output directory in config')
      .option('-t, --target <target>', 'Set target: react_native or expo')
      .option('-f, --force', 'Overwrite existing withframe.config.json');
  }

  protected async execute(options: InitCommandOptions): Promise<void> {
    const cwd = normalizeText(options.cwd);
    const outputDir = normalizeText(options.outputDir);

    const result = await this.runTask(
      async ({ start }) => {
        return this.initService.createConfig(
          {
            cwd,
            outputDir,
            target: options.target,
            force: Boolean(options.force),
          },
          {
            onInitializeStart: () => {
              start();
            },
          },
        );
      },
      {
        spinner: {
          text: chalk.cyan('Initializing withframe.config.json...'),
          spinner: 'dots',
          color: 'cyan',
        },
        successText: (value) =>
          value.overwritten
            ? chalk.green.bold('withframe.config.json updated')
            : chalk.green.bold('withframe.config.json created'),
        failureText: chalk.red.bold('Failed to initialize config'),
        startMode: 'manual',
      },
    );

    console.log('');
    console.log(chalk.gray(`  Path: ${result.configPath}`));
    console.log(chalk.gray(`  Output dir: ${result.config.outputDir ?? 'not set'}`));
    console.log(chalk.gray(`  Target: ${result.config.target ?? 'auto-detect on add'}`));
    console.log('');
  }
}
