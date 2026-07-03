const net = require('net');
async function check(port) {
  return new Promise(res => {
    const s = net.connect(port, '127.0.0.1', () => { s.end(); res(true); });
    s.on('error', () => res(false));
    s.setTimeout(2000, () => { s.destroy(); res(false); });
  });
}
Promise.all([check(3000), check(5173), check(4000)]).then(r => console.log('3000:'+r[0]+' 5173:'+r[1]+' 4000:'+r[2]));
