const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

const requiredIacFiles = [
  path.join(repoRoot, 'config', '.env', 'local.json'),
  path.join(repoRoot, 'deploy', 'backend.config'),
  path.join(repoRoot, 'deploy', 'local.tfvars'),
];

const missingFiles = requiredIacFiles.filter((filePath) => !fs.existsSync(filePath));

const script = missingFiles.length === 0 ? 'apps:start:iac' : 'apps:start:no-apply';

if (missingFiles.length > 0) {
  console.warn('Missing local IaC config files. Falling back to apps:start:no-apply.');
  missingFiles.forEach((filePath) => console.warn(`- ${path.relative(repoRoot, filePath)}`));
  console.warn('Run npm run load-secrets <project_name> [branch] [environment] to enable apps:start:iac.');
}

const child = spawn('npm', ['run', script], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('close', (code) => {
  process.exit(typeof code === 'number' ? code : 1);
});

child.on('error', (error) => {
  console.error(`Failed to run ${script}:`, error.message);
  process.exit(1);
});