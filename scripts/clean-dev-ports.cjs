const { execSync } = require('node:child_process');

const ports = [3000, 5175, 5176];

function run(command) {
  return execSync(command, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
}

function killWindowsPort(port) {
  let output = '';
  try {
    output = run(`netstat -ano -p tcp | findstr :${port}`);
  } catch {
    return;
  }

  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!trimmed.includes('LISTENING')) continue;
    const match = trimmed.match(/\s(\d+)$/);
    if (!match) continue;
    const pid = match[1];
    if (pid !== '0') pids.add(pid);
  }

  for (const pid of pids) {
    try {
      run(`taskkill /PID ${pid} /F`);
      console.log(`Freed port ${port} by killing PID ${pid}`);
    } catch {
      // Ignore races where the process exits between netstat and taskkill.
    }
  }
}

function killUnixPort(port) {
  let output = '';
  try {
    output = run(`lsof -ti tcp:${port}`);
  } catch {
    return;
  }

  const pids = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const pid of pids) {
    try {
      run(`kill -9 ${pid}`);
      console.log(`Freed port ${port} by killing PID ${pid}`);
    } catch {
      // Ignore races where the process exits between lsof and kill.
    }
  }
}

for (const port of ports) {
  if (process.platform === 'win32') {
    killWindowsPort(port);
  } else {
    killUnixPort(port);
  }
}