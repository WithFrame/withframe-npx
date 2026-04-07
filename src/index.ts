import { createCliApp } from '@/cli/setup';
import { showBanner } from '@/utils/banner';

// Показуємо банер тільки якщо немає аргументів
if (process.argv.length === 2) {
  showBanner();
}

const app = createCliApp();
app.run(process.argv);
