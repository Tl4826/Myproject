import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(__dirname, '..');
const mockPort = process.env.MOCK_API_PORT || '3001';
const proxyTarget = `http://127.0.0.1:${mockPort}`;

const mockApi = spawn(process.execPath, [path.join(__dirname, 'dev-mock-api.mjs')], {
  cwd: webDir,
  stdio: 'inherit',
  env: { ...process.env, MOCK_API_PORT: mockPort },
});

const nextBin = path.join(webDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const extraArgs = process.argv.slice(2);
const nextDev = spawn(process.execPath, [nextBin, 'dev', ...extraArgs], {
  cwd: webDir,
  stdio: 'inherit',
  env: { ...process.env, LOCAL_API_PROXY: proxyTarget },
});

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (!mockApi.killed) mockApi.kill();
  if (!nextDev.killed) nextDev.kill();
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
mockApi.on('exit', code => shutdown(code ?? 0));
nextDev.on('exit', code => shutdown(code ?? 0));
