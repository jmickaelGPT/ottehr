const { spawn } = require('node:child_process');

function parseArg(name, defaultValue) {
  const prefix = `--${name}=`;
  const equalsArg = process.argv.find((value) => value.startsWith(prefix));
  if (equalsArg) {
    return equalsArg.slice(prefix.length);
  }

  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }

  return defaultValue;
}

const defaultMode = parseArg('default', 'default');
const localAlias = parseArg('local-alias', 'local');

const envValue = process.env.ENV;
let mode = defaultMode;

if (envValue) {
  mode = envValue === 'local' ? localAlias : envValue;
}

const childEnv = Object.fromEntries(Object.entries(process.env).filter(([key, value]) => !key.startsWith('=') && value !== undefined));
const child = spawn(`vite --mode ${mode}`, {
  shell: true,
  stdio: 'inherit',
  cwd: process.cwd(),
  env: childEnv,
});

child.on('close', (code) => {
  process.exit(typeof code === 'number' ? code : 1);
});

child.on('error', (error) => {
  console.error('Failed to start Vite:', error.message);
  process.exit(1);
});
