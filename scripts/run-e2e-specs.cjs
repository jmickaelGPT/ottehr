const { spawn } = require('node:child_process');

function splitArgs(input) {
  if (!input) {
    return [];
  }

  return input
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

const baseArgs = process.argv.slice(2);
const extraArgs = splitArgs(process.env.PLAYWRIGHT_EXTRA_ARGS);
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const child = spawn(npmBin, ['run', 'e2e-skeleton', '--', ...baseArgs, ...extraArgs], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env,
});

child.on('close', (code) => {
  process.exit(typeof code === 'number' ? code : 1);
});

child.on('error', (error) => {
  console.error('Failed to run e2e specs script:', error.message);
  process.exit(1);
});
