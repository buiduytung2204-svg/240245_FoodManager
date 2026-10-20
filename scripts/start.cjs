const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

// Keep Metro's temporary files on the project's drive, away from a full C:.
const temp = path.resolve(__dirname, '../.cache/temp');
fs.mkdirSync(temp, { recursive: true });
const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin/cli');
const args = process.argv.slice(2);
if (!args.some(arg => arg === '--port' || arg.startsWith('--port='))) args.push('--port', '8082');
const child = spawn(process.execPath, [cli, 'start', '--max-workers', '1', ...args], {
  stdio: 'inherit',
  env: { ...process.env, TEMP: temp, TMP: temp },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 0; });
