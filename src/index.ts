import { createApp } from '@/setup';
import { showBanner } from '@/utils/banner';

if (process.argv.length === 2) {
  showBanner();
}

const app = createApp();
app.run(process.argv);
