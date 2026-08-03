const { spawn } = require('node:child_process');

const envName = process.env.ENV || 'local';
const secretsArg = `secrets=.env/zambda-secrets-${envName}.json`;
const childEnv = Object.fromEntries(Object.entries(process.env).filter(([key, value]) => !key.startsWith('=') && value !== undefined));

const child = spawn(`tsx watch --include "./src/**/*" src/local-server/index.ts -- ${secretsArg}`, {
  shell: true,
  stdio: 'inherit',
  cwd: process.cwd(),
  env: childEnv,
});

child.on('close', (code) => {
  process.exit(typeof code === 'number' ? code : 1);
});

child.on('error', (error) => {
  console.error('Failed to start zambdas local server:', error.message);
  process.exit(1);
});
