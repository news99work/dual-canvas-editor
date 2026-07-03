const net = require('net');
async function check(port, label) {
  return new Promise(res => {
    const s = net.connect(port, '127.0.0.1', () => { s.end(); console.log(label + ': OPEN'); res(true); });
    s.on('error', () => { console.log(label + ': CLOSED'); res(false); });
    s.setTimeout(2000, () => { s.destroy(); console.log(label + ': TIMEOUT'); res(false); });
  });
}
setTimeout(async () => {
  await check(4000, 'Server(4000)');
  await check(5173, 'Client(5173)');
  await check(3000, 'Client(3000)');
  process.exit(0);
}, 1000);
