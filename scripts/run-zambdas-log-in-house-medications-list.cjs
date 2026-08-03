const { spawn } = require('node:child_process');

const npmConfigEnv = process.env.npm_config_env;

if (!npmConfigEnv) {
  console.error('Missing required npm config variable: npm_config_env');
  process.exit(1);
}

const tsxBin = process.platform === 'win32' ? 'tsx.cmd' : 'tsx';
const child = spawn(tsxBin, ['src/scripts/log-in-house-medications-list.ts', npmConfigEnv], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env,
});

child.on('close', (code) => {
  process.exit(typeof code === 'number' ? code : 1);
});

child.on('error', (error) => {
  console.error('Failed to run medication list script:', error.message);
  process.exit(1);
});
