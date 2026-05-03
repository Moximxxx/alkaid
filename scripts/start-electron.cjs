const { spawn } = require('child_process');
const path = require('path');

const electronPath = require('electron');
const mainPath = path.join(__dirname, '../electron/main.cjs');

console.log('[Electron] Starting...');

const child = spawn(electronPath, [mainPath], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' },
});

child.on('close', (code) => {
  console.log(`[Electron] Process exited with code ${code}`);
  process.exit(code);
});

child.on('error', (err) => {
  console.error('[Electron] Error:', err);
});
