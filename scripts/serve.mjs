#!/usr/bin/env node
/**
 * Servidor estatico minimo para revisar el sitio en local.
 *
 *   node scripts/serve.mjs            -> http://localhost:4173
 *   node scripts/serve.mjs 8080       -> http://localhost:8080
 *
 * Solo sirve archivos; no hace falta para publicar.
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const puerto = Number(process.argv[2]) || 4173;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${puerto}`);
    let relativa = decodeURIComponent(url.pathname);
    if (relativa.endsWith('/')) relativa += 'index.html';

    const destino = path.join(raiz, path.normalize(relativa).replace(/^(\.\.[/\\])+/, ''));
    if (!destino.startsWith(raiz)) {
      res.writeHead(403).end('403');
      return;
    }

    const info = await stat(destino);
    if (info.isDirectory()) {
      res.writeHead(302, { Location: relativa + '/' }).end();
      return;
    }

    res.writeHead(200, {
      'content-type': TIPOS[path.extname(destino).toLowerCase()] ?? 'application/octet-stream',
      'content-length': info.size,
      'cache-control': 'no-cache'
    });
    createReadStream(destino).pipe(res);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404');
  }
}).listen(puerto, () => {
  process.stdout.write(`\nSitio en http://localhost:${puerto}\nCtrl+C para detener.\n\n`);
});
