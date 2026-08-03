const { spawn } = require('node:child_process');

const vitestMode = process.argv[2] || 'run';
const envName = process.env.ENV || 'local';
const childEnv = Object.fromEntries(
  Object.entries({
    ...process.env,
    ENV: envName,
  }).filter(([key, value]) => !key.startsWith('=') && value !== undefined)
);

const vitestBin = process.platform === 'win32' ? 'vitest.cmd' : 'vitest';
const child = spawn(vitestBin, [vitestMode], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: childEnv,
});

child.on('close', (code) => {
  process.exit(typeof code === 'number' ? code : 1);
});

child.on('error', (error) => {
  console.error('Failed to run vitest:', error.message);
  process.exit(1);
});
