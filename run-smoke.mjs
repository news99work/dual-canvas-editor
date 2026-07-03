import { spawn } from 'node:child_process';
import http from 'node:http';

const BASE = '/Users/dp_macbook_07/Documents/goclaw/.local-goclaw/workspace/teams/d69797bb-37f9-4ee6-ad72-97a592b742e7/dual-canvas-editor/server';
const PORT = 4000;
const HOST = 'localhost';

async function waitForServer(url, retries = 15, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => { res.resume(); resolve(); });
        req.on('error', reject);
        req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return false;
}

function httpGet(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

async function main() {
  const server = spawn('node', ['dist/index.js'], {
    cwd: BASE,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });

  let serverOutput = '';
  server.stdout.on('data', (d) => { serverOutput += d.toString(); });
  server.stderr.on('data', (d) => { serverOutput += d.toString(); });

  console.log('Server PID:', server.pid);
  console.log('Waiting for server...');

  const ready = await waitForServer(`http://${HOST}:${PORT}/api/health`);
  if (!ready) {
    console.log('Server failed to start. Output:', serverOutput);
    process.exit(1);
  }

  console.log('Server is ready!\n');

  const endpoints = [
    { label: 'health', url: `http://${HOST}:${PORT}/api/health` },
    { label: 'fonts',  url: `http://${HOST}:${PORT}/api/v1/fonts` },
    { label: 'assets', url: `http://${HOST}:${PORT}/api/v1/assets` },
  ];

  let allPass = true;
  for (const ep of endpoints) {
    const result = await httpGet(ep.url);
    const ok = result.status === 200;
    const mark = ok ? '✓' : '✗';
    console.log(`${mark} ${ep.label.padEnd(10)} ${ep.url.padEnd(40)} ${result.status}`);
    if (result.body) {
      const str = JSON.stringify(result.body).substring(0, 160);
      console.log(`     → ${str}`);
    }
    if (!ok) allPass = false;
  }

  // Kill server
  try { process.kill(-server.pid, 'SIGTERM'); } catch {}
  try { server.kill('SIGTERM'); } catch {}

  console.log(`\n=== ${allPass ? 'ALL ENDPOINTS PASS' : 'SOME ENDPOINTS FAILED'} ===`);
  process.exit(allPass ? 0 : 1);
}

main();
