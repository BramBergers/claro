// Lokaal bekijken:  node scripts/dev.mjs   en open dan http://localhost:4321
// Bouwt de site en herbouwt automatisch als je iets aanpast.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT) || 4321;

let building = false, again = false;
function build() {
  if (building) { again = true; return; }
  building = true;
  const p = spawn(process.execPath, [path.join(root, 'scripts/build.mjs')], { stdio: 'inherit' });
  p.on('exit', () => { building = false; if (again) { again = false; build(); } });
}
build();

let timer;
for (const dir of ['src', 'public', 'scripts']) {
  watch(path.join(root, dir), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(build, 250); });
}

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };

createServer((req, res) => {
  let file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(dist)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!existsSync(file)) { file = path.join(dist, '404.html'); res.statusCode = 404; }
  const type = types[path.extname(file)] || 'application/octet-stream';
  const size = existsSync(file) ? statSync(file).size : 0;
  const range = req.headers.range;
  if (range && res.statusCode !== 404) {
    const [s, e] = range.replace('bytes=', '').split('-');
    const start = parseInt(s, 10), end = e ? parseInt(e, 10) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(res.statusCode || 200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
    createReadStream(file).pipe(res);
  }
}).listen(port, () => console.log(`\n  Claro draait op http://localhost:${port}\n`));
