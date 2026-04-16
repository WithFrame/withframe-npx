import { COLORS } from '@/constants';
import chalk from 'chalk';
import figlet from 'figlet';

export const showBanner = (): void => {
  const banner = figlet.textSync('Withframe', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 80,
    whitespaceBreak: true,
  });
  const coloredBanner = chalk.hex(COLORS.PRIMARY_600)(banner);
  console.log(coloredBanner);
};
