import chalk from 'chalk';
import type { Command } from 'commander';
import open from 'open';
import { BaseCommand } from '@/core/base-command';
import { UploadService } from '@/api/upload-service';
import { UploadOptions } from '@/types';

export class UploadCommand extends BaseCommand {
  readonly name = 'upload';
  readonly description = chalk.yellow('Upload a component to WithFrame registry');

  constructor(private readonly uploadService: UploadService) {
    super();
  }

  protected configure(command: Command): Command {
    return command
      .option('--path <path>', 'Component entry file path')
      .option('--no-open', 'Do not open browser automatically');
  }

  protected async execute(opts: UploadOptions): Promise<void> {
    const result = await this.runTask(
      async () => {
        return this.uploadService.upload(opts);
      },
      {
        spinner: {
          text: `📦 Uploading ...`,
          spinner: 'dots',
          color: 'cyan',
        },
        successText: () => chalk.green.bold(`Component uploaded successfully`),
        failureText: chalk.red.bold('Failed to upload component'),
        startMode: 'manual',
      },
    );

    if (opts.open !== false) {
      await open(result.editUrl).catch(() => {});
    }

    console.log('');
    console.log(chalk.gray(`  Draft: ${result.componentId}`));
    console.log(chalk.gray(`  Target: ${result.target}`));
    console.log(chalk.gray(`  Edit URL: ${result.editUrl}`));
    console.log('');
  }
}
