import { COLORS } from '@/constants';
import chalk from 'chalk';

const BANNER = `
 __        ___ _   _     _____                         
 \ \      / (_) |_| |__ |  ___| __ __ _ _ __ ___   ___ 
  \ \ /\ / /| | __| '_ \| |_ | '__/ _\` | '_ \ _ \ / _ \
   \ V  V / | | |_| | | |  _|| | | (_| | | | | | |  __/
    \_/\_/  |_|\__|_| |_|_|  |_|  \__,_|_| |_| |_|\___|
`;

export const showBanner = (): void => {
  const coloredBanner = chalk.hex(COLORS.PRIMARY_600)(BANNER);
  console.log(coloredBanner);
};
