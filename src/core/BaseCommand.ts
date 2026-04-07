import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { isFunction } from '@/lib/type-guards';

interface SpinnerTaskOptions<T> {
  spinner: Parameters<typeof ora>[0];
  successText: string | ((result: T) => string);
  failureText: string;
  startMode?: 'immediate' | 'manual';
}

export abstract class BaseCommand {
  abstract readonly name: string;
  abstract readonly description: string;

  protected configure(command: Command): Command {
    return command;
  }

  protected abstract execute(...args: unknown[]): Promise<void> | void;

  protected async runTask<T>(
    task: (controls: {
      spinner: ReturnType<typeof ora>;
      start: () => ReturnType<typeof ora>;
      isStarted: () => boolean;
    }) => Promise<T>,
    options: SpinnerTaskOptions<T>,
  ): Promise<T> {
    const spinner = ora(options.spinner);
    let started = false;

    const start = (): ReturnType<typeof ora> => {
      if (!started) {
        spinner.start();
        started = true;
      }

      return spinner;
    };

    if (options.startMode !== 'manual') {
      start();
    }

    try {
      const result = await task({
        spinner,
        start,
        isStarted: () => started,
      });
      const successText = isFunction(options.successText)
        ? options.successText(result)
        : options.successText;

      if (started) {
        spinner.succeed(successText);
      } else {
        console.log(successText);
      }

      return result;
    } catch (error) {
      if (started) {
        spinner.fail(options.failureText);
      }

      throw error;
    }
  }

  register(program: Command): void {
    const command = this.configure(program.command(this.name).description(this.description));
    command.action(async (...args: unknown[]) => {
      try {
        await this.execute(...args);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk.red(`\n${message}\n`));
        process.exitCode = 1;
      }
    });
  }
}
