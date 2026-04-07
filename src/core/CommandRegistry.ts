import type { Command } from 'commander';
import type { BaseCommand } from '@/core/BaseCommand';

export class CommandRegistry {
  constructor(private readonly commands: BaseCommand[]) {}

  registerAll(program: Command): void {
    this.commands.forEach((command) => {
      command.register(program);
    });
  }
}
