import chalk from 'chalk';
import { SEPARATOR } from '@/constants/cli';
import type { AddResult } from '@/types';

const printList = ({
  title,
  items,
  titleColor,
  prefix,
}: {
  title: string;
  items: string[];
  titleColor: (text: string) => string;
  prefix: string;
}): void => {
  if (!items.length) {
    return;
  }

  console.log(titleColor(`\n  ${title}:`));
  items.forEach((item) => {
    console.log(chalk.white(`  ${prefix} ${item}`));
  });
};

export const printQuickStart = (): void => {
  console.log(chalk.dim(SEPARATOR));
  console.log(chalk.cyan('\n  🎯 Quick Start:\n'));
  console.log(chalk.white('  $ withframe init       ') + chalk.gray('→ Create local config'));
  console.log(chalk.white('  $ withframe login      ') + chalk.gray('→ Authenticate'));
  console.log(chalk.white('  $ withframe add button ') + chalk.gray('→ Add component code\n'));
  console.log(chalk.white('  $ withframe logout     ') + chalk.gray('→ Clear local token\n'));
};

export const printAddResult = (result: AddResult): void => {
  console.log('');
  console.log(chalk.gray(`  Target: ${result.target}`));
  console.log(chalk.gray(`  Output dir: ${result.outputDir}`));

  printList({
    title: 'Created files',
    items: result.createdFiles,
    titleColor: chalk.cyan,
    prefix: '+',
  });
  printList({
    title: 'Overwritten files',
    items: result.overwrittenFiles,
    titleColor: chalk.yellow,
    prefix: '~',
  });
  printList({
    title: 'Skipped files',
    items: result.skippedFiles,
    titleColor: chalk.yellow,
    prefix: '-',
  });
  printList({
    title: 'Installed dependencies',
    items: result.installedDependencies,
    titleColor: chalk.cyan,
    prefix: '•',
  });

  console.log('');
};
