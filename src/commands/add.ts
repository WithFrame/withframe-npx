import chalk from 'chalk';
import type { Command } from 'commander';
import { ComponentService } from '@/api/component-service';
import { BaseCommand } from '@/core/base-command';
import { confirm } from '@/lib/prompt';
import type { AddOptions, AddResult } from '@/types';
import { printAddResult } from '@/utils/output';
import type { EnvVariable } from '@/lib/env';

export class AddCommand extends BaseCommand {
  readonly name = 'add <component>';
  readonly description = chalk.magenta('Add a component from WithFrame registry');

  constructor(private readonly componentService: ComponentService) {
    super();
  }

  protected requiredEnvVariables(): EnvVariable[] {
    return ['WITHFRAME_TOKEN'];
  }

  protected configure(command: Command): Command {
    return command
      .alias('install')
      .option('-v, --variant <variant>', 'Install specific variant id', 'default')
      .option('-t, --target <target>', 'Project target: react_native or expo')
      .option('--cwd <path>', 'Project root directory')
      .option('-y, --yes', 'Overwrite files without confirmation');
  }

  protected async execute(comp: string, opts: AddOptions): Promise<void> {
    const displayComponent = comp.trim() || 'component';
    const result = await this.runTask<AddResult>(
      async ({ start }) => {
        return this.componentService.addComponent(comp, opts, {
          onApplyStart: () => {
            start();
          },
          confirmOverwrite: async (relativePath) => {
            return confirm(`File ${relativePath} exists. Overwrite? [y/N] `);
          },
        });
      },
      {
        spinner: {
          text: `📦 Adding ${chalk.bold(displayComponent)}...`,
          spinner: 'dots',
          color: 'cyan',
        },
        successText: (value) => chalk.green.bold(`${value.component.slug} added successfully`),
        failureText: chalk.red.bold('Failed to add component'),
        startMode: 'manual',
      },
    );

    printAddResult(result);
  }
}
