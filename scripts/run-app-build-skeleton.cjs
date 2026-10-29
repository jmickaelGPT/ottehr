const { execFileSync, spawn } = require('node:child_process');
const { cpSync, existsSync, readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

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

function validateAzureEnvironment() {
  if (!envValue.startsWith('azure-')) {
    return;
  }

  const envPath = join(process.cwd(), 'env', `.env.${envValue}`);
  if (!existsSync(envPath)) {
    console.error(`Azure environment file not found: ${envPath}`);
    process.exit(1);
  }

  const placeholders = [...new Set(readFileSync(envPath, 'utf8').match(/__[A-Z0-9_]+__/g) || [])];
  if (placeholders.length > 0) {
    console.error(`Azure environment file contains unresolved placeholders: ${envPath}`);
    for (const placeholder of placeholders) {
      console.error(`  - ${placeholder}`);
    }
    process.exit(1);
  }
}

validateAzureEnvironment();

function withMaxOldSpaceSize(env, maxOldSpaceSizeMb) {
  const existingNodeOptions = env.NODE_OPTIONS || '';
  if (/--max-old-space-size=\d+/i.test(existingNodeOptions)) {
    return env;
  }

  const maxOldSpaceOption = `--max-old-space-size=${maxOldSpaceSizeMb}`;
  const normalizedNodeOptions = existingNodeOptions.trim();

  return {
    ...env,
    NODE_OPTIONS: normalizedNodeOptions ? `${normalizedNodeOptions} ${maxOldSpaceOption}` : maxOldSpaceOption,
  };
}

const buildEnv = {
  ...process.env,
  VITE_APP_ENV: envValue,
  VITE_APP_SHA: resolveGitSha(),
  VITE_APP_VERSION: resolveVersion(),
};

const tscEnv = withMaxOldSpaceSize(process.env, 8192);
const viteBuildEnv = withMaxOldSpaceSize(buildEnv, 8192);

function resolvePackageBin(packageName, relativeBinPath) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`, { paths: [process.cwd()] });
  return join(dirname(packageJsonPath), relativeBinPath);
}

const nodeBin = process.execPath;
const tscBin = resolvePackageBin('typescript', 'bin/tsc');
const viteBin = resolvePackageBin('vite', 'bin/vite.js');

const tscChild = run(nodeBin, [tscBin], tscEnv);
tscChild.on('close', (tscCode) => {
  if (tscCode !== 0) {
    process.exit(tscCode || 1);
    return;
  }

  const viteChild = run(nodeBin, [viteBin, 'build', '--mode', envValue], viteBuildEnv);
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
