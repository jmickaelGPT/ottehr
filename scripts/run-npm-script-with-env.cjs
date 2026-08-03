const { spawn } = require('node:child_process');

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function getMultiArg(name) {
  const values = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === `--${name}`) {
      values.push(process.argv[i + 1]);
      i += 1;
    }
  }
  return values;
}

const script = getArg('script');
const envName = getArg('env-name');
const envFrom = getArg('env-from');
const extras = getMultiArg('extra');

if (!script || !envName || !envFrom) {
  console.error('Usage: node run-npm-script-with-env.cjs --script <name> --env-name <ENV_KEY> --env-from <source-key> [--extra K=V]');
  process.exit(1);
}

const sourceValue = process.env[envFrom];
if (!sourceValue) {
  console.error(`Missing required environment variable: ${envFrom}`);
  process.exit(1);
}

const childEnv = { ...process.env, [envName]: sourceValue };

for (const pair of extras) {
  const separatorIndex = pair.indexOf('=');
  if (separatorIndex <= 0) {
    console.error(`Invalid --extra value: ${pair}. Expected KEY=VALUE format.`);
    process.exit(1);
  }
  const key = pair.slice(0, separatorIndex);
  const value = pair.slice(separatorIndex + 1);
  childEnv[key] = value;
}

const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const child = spawn(npmBin, ['run', script], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: childEnv,
});

child.on('close', (code) => {
  process.exit(typeof code === 'number' ? code : 1);
});

child.on('error', (error) => {
  console.error('Failed to run npm script:', error.message);
  process.exit(1);
});
