import chalk from 'chalk';
import { Command } from 'commander';
import { CLI_NAME, CLI_VERSION, COLORS } from '@/constants';
import type { CliApp } from '@/core/cli-app';
import { createAppContainer } from '@/container';

export const createApp = (): CliApp => {
  const program = new Command();

  program
    .version(CLI_VERSION)
    .name(CLI_NAME)
    .usage(chalk.yellow('<command> [options]'))
    .description(
      chalk.hex(COLORS.PRIMARY_300)('🚀 Add unlocked WithFrame components into your project'),
    )
    .helpOption('-h, --help', chalk.gray('Display help information'))
    .addHelpText('before', chalk.cyan('\n✨ WithFrame CLI - Your Component Assistant\n'))
    .addHelpText(
      'after',
      chalk.dim(
        '\n📖 Example:\n  $ withframe init\n  $ withframe login\n  $ withframe add button\n',
      ),
    );

  const container = createAppContainer(program);

  program.on('command:*', () => {
    console.error(chalk.red('\n❌ Invalid command: %s\n'), chalk.bold(program.args.join(' ')));
    console.log(chalk.yellow('See --help for a list of available commands.\n'));
    process.exit(1);
  });

  return container.resolve('cliApp');
};
