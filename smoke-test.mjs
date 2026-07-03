import { spawn } from 'node:child_process';
import http from 'node:http';

const SERVER_DIR = '/Users/dp_macbook_07/Documents/goclaw/.local-goclaw/workspace/teams/d69797bb-37f9-4ee6-ad72-97a592b742e7/dual-canvas-editor/server';
const PORT = 4001; // use a different port to avoid conflicts

function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: 'localhost', port: PORT, path, method: 'GET', timeout: 5000 },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
          catch { resolve({ status: res.statusCode, body }); }
        });
      },
    );
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    req.end();
  });
}

async function waitForServer(maxWaitMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const result = await testEndpoint('/api/health');
      if (result.status === 200) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

async function main() {
  process.env.PORT = String(PORT);

  console.log('Starting server...');
  const server = spawn('node', ['dist/index.js'], {
    cwd: SERVER_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(PORT) },
  });

  server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[server-err] ${d}`));

  console.log('Waiting for server to start...');
  const ready = await waitForServer(8000);

  if (!ready) {
    console.log('FAIL: Server did not start within 8 seconds');
    server.kill();
    process.exit(1);
  }

  console.log('Server is UP. Testing endpoints...\n');

  const endpoints = [
    { label: 'Health', path: '/api/health' },
    { label: 'Fonts',  path: '/api/v1/fonts' },
    { label: 'Assets', path: '/api/v1/assets' },
  ];

  let allPass = true;
  for (const ep of endpoints) {
    const result = await testEndpoint(ep.path);
    const status = result.status === 200 ? '✓ PASS' : `✗ FAIL (${result.status})`;
    console.log(`  ${status}  ${ep.label.padEnd(8)} ${ep.path.padEnd(25)}`);
    if (result.body) {
      const str = JSON.stringify(result.body);
      console.log(`         → ${str.substring(0, 150)}`);
    }
    if (result.status !== 200) allPass = false;
  }

  console.log(`\n=== ${allPass ? 'ALL ENDPOINTS PASS' : 'SOME ENDPOINTS FAILED'} ===`);
  server.kill();
  process.exit(allPass ? 0 : 1);
}

main();
