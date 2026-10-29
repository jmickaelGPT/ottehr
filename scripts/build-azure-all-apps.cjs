const { spawnSync } = require('node:child_process');

const envMode = process.argv[2];
if (!envMode) {
  console.error('Usage: node scripts/build-azure-all-apps.cjs <azure-dev|azure-beta|azure-production>');
  process.exit(1);
}

const billingOnly = String(process.env.BILLING_ONLY || '').toLowerCase() === 'true';

const apps = billingOnly
  ? [{ name: 'billing', dir: 'apps/billing', script: 'build-skeleton' }]
  : [
      { name: 'ehr', dir: 'apps/ehr', script: 'build-skeleton' },
      { name: 'intake', dir: 'apps/intake', script: 'build-skeleton' },
      { name: 'billing', dir: 'apps/billing', script: 'build-skeleton' },
    ];

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
