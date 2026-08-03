const { execFileSync, spawn } = require('node:child_process');
const { cpSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const copyRobots = process.argv.includes('--copy-robots');

function run(command, args, env) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env,
  });

  child.on('close', (code) => {
    if (code !== 0) {
      process.exit(code || 1);
    }
  });

  child.on('error', (error) => {
    console.error(`Failed to start ${command}:`, error.message);
    process.exit(1);
  });

  return child;
}

function resolveGitSha() {
  if (process.env.GIT_HEAD) {
    return process.env.GIT_HEAD;
  }

  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

function resolveVersion() {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(join(process.cwd(), 'package.json')).version;
  } catch {
    return '0.0.0';
  }
}

const envValue = process.env.ENV || 'default';
const buildEnv = {
  ...process.env,
  VITE_APP_ENV: envValue,
  VITE_APP_SHA: resolveGitSha(),
  VITE_APP_VERSION: resolveVersion(),
};

const tscBin = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
const viteBin = process.platform === 'win32' ? 'vite.cmd' : 'vite';

const tscChild = run(tscBin, [], process.env);
tscChild.on('close', (tscCode) => {
  if (tscCode !== 0) {
    process.exit(tscCode || 1);
    return;
  }

  const viteChild = run(viteBin, ['build', '--mode', envValue], buildEnv);
  viteChild.on('close', (viteCode) => {
    if (viteCode !== 0) {
      process.exit(viteCode || 1);
      return;
    }

    if (copyRobots) {
      const robotsFile = process.env.ROBOTS_FILE || 'lowers';
      const sourcePath = join(process.cwd(), 'src', 'themes', 'ottehr', `robots-${robotsFile}.txt`);
      const targetPath = join(process.cwd(), 'build', 'robots.txt');

      if (!existsSync(sourcePath)) {
        console.error(`Robots source file not found: ${sourcePath}`);
        process.exit(1);
        return;
      }

      cpSync(sourcePath, targetPath);
    }
  });
});
