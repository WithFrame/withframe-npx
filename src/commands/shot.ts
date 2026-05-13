import chalk from 'chalk';
import type { Command } from 'commander';
import { ShotService } from '@/api/shot-service';
import { BaseCommand } from '@/core/base-command';
import type { ShotOptions } from '@/types';
import type { EnvVariable } from '@/lib/env';

export class ShotCommand extends BaseCommand {
  readonly name = 'shot';
  readonly description = chalk.cyan('Upload a screenshot and attach it to a collection');

  constructor(private readonly shotService: ShotService) {
    super();
  }

  protected requiredEnvVariables(): EnvVariable[] {
    return ['WITHFRAME_TOKEN'];
  }

  protected configure(command: Command): Command {
    return command
      .requiredOption('--file <path>', 'Screenshot file path')
      .option('--device <id>', 'Preferred device id when dimensions match multiple models');
  }

  protected async execute(opts: ShotOptions): Promise<void> {
    const result = await this.runTask(
      async ({ start }) => {
        return this.shotService.uploadShot(opts, {
          onUploadStart: () => {
            start();
          },
        });
      },
      {
        spinner: {
          text: 'Uploading screenshot ...',
          spinner: 'dots',
          color: 'cyan',
        },
        successText: () => chalk.green.bold('Screenshot uploaded successfully'),
        failureText: chalk.red.bold('Failed to upload screenshot'),
        startMode: 'manual',
      },
    );

    console.log(result.url);
  }
}
