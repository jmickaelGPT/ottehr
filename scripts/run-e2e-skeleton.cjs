const { spawn } = require('node:child_process');

const envName = process.env.ENV || 'local';
const envFile = `./env/tests.${envName}.json`;
const additionalArgs = process.argv.slice(2);

const envCmdBin = process.platform === 'win32' ? 'env-cmd.cmd' : 'env-cmd';
const child = spawn(envCmdBin, ['-f', envFile, 'playwright', 'test', ...additionalArgs], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env,
});

child.on('close', (code) => {
  process.exit(typeof code === 'number' ? code : 1);
});

child.on('error', (error) => {
  console.error('Failed to run e2e skeleton:', error.message);
  process.exit(1);
});
