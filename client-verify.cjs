const http = require('http');

async function get(url) {
  return new Promise(resolve => {
    http.get(url, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', e => resolve({ status: 0, error: e.message })).setTimeout(5000, function() { this.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

async function main() {
  console.log('=== CLIENT VERIFICATION ===\n');

  // 1. Get main HTML page
  const client = await get('http://127.0.0.1:5173/');
  console.log('1. Client HTML status:', client.status);
  if (client.status === 200) {
    // Check for key indicators
    const indicators = [
      { name: 'React root div', pattern: 'id="root"' },
      { name: 'React app mount', pattern: 'root' },
      { name: 'Any canvas reference', pattern: 'canvas' },
    ];
    for (const ind of indicators) {
      const found = client.body.toLowerCase().includes(ind.pattern.toLowerCase());
      console.log(`   ${found ? '✓' : '✗'} ${ind.name}: ${found}`);
    }
    console.log('\n   HTML snippet (first 500 chars):');
    console.log('   ' + client.body.substring(0, 500).replace(/\n/g, '\n   '));
  }

  // 2. Verify proxy
  console.log('\n2. Proxy verification:');
  const proxyHealth = await get('http://127.0.0.1:5173/api/health');
  console.log(`   GET /api/health via proxy → ${proxyHealth.status}`);
  if (proxyHealth.status === 200) {
    try { console.log(`   Body: ${JSON.stringify(JSON.parse(proxyHealth.body)).substring(0, 200)}`); } catch {}
  }

  const proxyFonts = await get('http://127.0.0.1:5173/api/v1/fonts');
  console.log(`   GET /api/v1/fonts via proxy → ${proxyFonts.status}`);
  if (proxyFonts.status === 200) {
    try { const d = JSON.parse(proxyFonts.body); console.log(`   ${d.data.length} fonts`); } catch {}
  }

  const proxyAssets = await get('http://127.0.0.1:5173/api/v1/assets');
  console.log(`   GET /api/v1/assets via proxy → ${proxyAssets.status}`);

  // 3. Check asset cache issue - start fresh
  console.log('\n3. Asset cache investigation:');
  const directAssets = await get('http://127.0.0.1:4000/api/v1/assets');
  console.log(`   Direct GET /api/v1/assets → ${directAssets.status}`);
  if (directAssets.status === 200) {
    try { 
      const d = JSON.parse(directAssets.body);
      console.log(`   ${d.data.length} assets in list`);
      console.log(`   Cursor: ${d.cursor}, hasMore: ${d.hasMore}`);
      if (d.data.length > 0) {
        console.log(`   First asset: ${JSON.stringify(d.data[0]).substring(0, 200)}`);
      } else {
        console.log('   ASSET LIST EMPTY — in-memory cache stale after upload');
        // Check actual file
        const fs = require('fs');
        const assetsFile = '/Users/dp_macbook_07/Documents/goclaw/.local-goclaw/workspace/teams/d69797bb-37f9-4ee6-ad72-97a592b742e7/dual-canvas-editor/server/meta/assets.json';
        const fileContent = JSON.parse(fs.readFileSync(assetsFile, 'utf-8'));
        console.log(`   assets.json has ${fileContent.length} asset(s) — cache IS stale`);
      }
    } catch(e) { console.log('   Parse error:', e.message); }
  }

  // 4. Verify export status
  console.log('\n4. Export verification:');
  // Check export dir
  const fs = require('fs');
  const path = require('path');
  const exportDir = '/Users/dp_macbook_07/Documents/goclaw/.local-goclaw/workspace/teams/d69797bb-37f9-4ee6-ad72-97a592b742e7/dual-canvas-editor/server/exports';
  const exports = fs.readdirSync(exportDir);
  console.log(`   Export files: ${exports.length}`);
  for (const f of exports.slice(-4)) {
    const stat = fs.statSync(path.join(exportDir, f));
    console.log(`   ${f} (${stat.size} bytes)`);
  }

  console.log('\n=== DONE ===');
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
