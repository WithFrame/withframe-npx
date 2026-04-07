import type { Command } from 'commander';
import type { CommandRegistry } from '@/core/CommandRegistry';
import { printQuickStart } from '@/utils/output';

export class CliApp {
  constructor(
    private readonly program: Command,
    private readonly commandRegistry: CommandRegistry,
  ) {}

  run(argv: string[]): void {
    this.commandRegistry.registerAll(this.program);
    this.program.parse(argv);

    if (!argv.slice(2).length) {
      this.program.outputHelp();
      printQuickStart();
    }
  }
}
