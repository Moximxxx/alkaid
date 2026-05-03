import { mkdir, cp } from 'fs/promises';
import { existsSync } from 'fs';

async function setup() {
  const targetDir = 'node_modules/electrobun/dist/api/Resources';
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }
  await cp('Resources/version.json', `${targetDir}/version.json`);
  console.log('Electrobun Resources setup complete');
}

setup();
