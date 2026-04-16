import { createApp } from '@/setup';
import { showBanner } from '@/utils/banner';

const WITHOUT_PARAMS = process.argv.length === 2;

if (WITHOUT_PARAMS) showBanner();

const app = createApp();
app.run(process.argv);
