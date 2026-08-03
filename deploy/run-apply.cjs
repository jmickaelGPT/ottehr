const { spawn } = require('node:child_process');

const envName = process.argv[2] || 'local';
const action = process.argv[3] || 'apply';

function exitWith(code) {
  process.exit(typeof code === 'number' ? code : 1);
}

if (process.platform === 'win32') {
  const child = spawn(
    'powershell.exe',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      './apply.ps1',
      envName,
      action,
    ],
    {
      stdio: 'inherit',
      cwd: __dirname,
      env: process.env,
    }
  );

  child.on('close', exitWith);
  child.on('error', (error) => {
    console.error('Failed to start PowerShell apply script:', error.message);
    exitWith(1);
  });
} else {
  const command = `tr -d '\\r' < ./apply.sh | bash -s -- ${envName} ${action}`;
  const child = spawn('bash', ['-lc', command], {
    stdio: 'inherit',
    cwd: __dirname,
    env: process.env,
  });

  child.on('close', exitWith);
  child.on('error', (error) => {
    console.error('Failed to start bash apply script:', error.message);
    exitWith(1);
  });
}
