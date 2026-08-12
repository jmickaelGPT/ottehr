const { spawnSync } = require('node:child_process');

const envMode = process.argv[2];
if (!envMode) {
  console.error('Usage: node scripts/build-azure-all-apps.cjs <azure-dev|azure-beta|azure-production>');
  process.exit(1);
}

const includeBillingApp = String(process.env.INCLUDE_BILLING_APP || '').toLowerCase() === 'true';

const apps = [
  { name: 'ehr', dir: 'apps/ehr', script: 'build-skeleton' },
  { name: 'intake', dir: 'apps/intake', script: 'build-skeleton' },
];

if (includeBillingApp) {
  apps.push({ name: 'billing', dir: 'apps/billing', script: 'build-skeleton' });
} else {
  console.log('Skipping billing build (set INCLUDE_BILLING_APP=true to include it).');
}

for (const app of apps) {
  console.log(`Building ${app.name} with mode ${envMode}`);
  const result = spawnSync('npm', ['run', app.script], {
    cwd: app.dir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ENV: envMode },
  });

  if (result.error) {
    console.error(`Failed to run build for ${app.name}:`, result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log('All app builds completed.');
