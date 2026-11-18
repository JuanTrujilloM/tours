#!/usr/bin/env node
/**
 * Genera las imagenes derivadas del sitio.
 *
 *   node scripts/build-images.mjs
 *   npm run images
 *
 * Lee  : fotos-originales/  +  data/fotos.json
 * Crea : assets/img/<id>-<ancho>.webp
 *        assets/img/<id>-<ancho>.jpg
 *        assets/img/<id>-placeholder.webp   (miniatura borrosa, en linea en el HTML si se quiere)
 *        assets/js/galeria-data.js          (datos de la galeria y dimensiones reales)
 *
 * Nunca modifica los originales.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dirOrigen = path.join(raiz, 'fotos-originales');
const dirDestino = path.join(raiz, 'assets', 'img');
const rutaManifiesto = path.join(raiz, 'data', 'fotos.json');
const rutaDatosGaleria = path.join(raiz, 'assets', 'js', 'galeria-data.js');

const CALIDAD_WEBP = 72;
const CALIDAD_JPG = 76;

function aviso(msg) {
  process.stdout.write(`  ${msg}\n`);
}

async function main() {
  if (!existsSync(dirOrigen)) {
    throw new Error(`No existe la carpeta de originales: ${dirOrigen}`);
  }
  await mkdir(dirDestino, { recursive: true });
  await mkdir(path.dirname(rutaDatosGaleria), { recursive: true });

  const manifiesto = JSON.parse(await readFile(rutaManifiesto, 'utf8'));
  const anchos = manifiesto.anchos ?? [480, 960, 1600];
  const fotos = manifiesto.fotos ?? [];

  const archivosEnDisco = (await readdir(dirOrigen)).filter((f) =>
    /\.(jpe?g|png|webp|tiff?)$/i.test(f)
  );
  const declarados = new Set(fotos.map((f) => f.archivo));
  const huerfanos = archivosEnDisco.filter((f) => !declarados.has(f));

  const ids = new Set();
  const salida = [];

  process.stdout.write(`\nGenerando imagenes en assets/img/\n\n`);

  for (const foto of fotos) {
    const { id, archivo } = foto;
    if (!id || !archivo) throw new Error(`Entrada invalida en data/fotos.json: ${JSON.stringify(foto)}`);
    if (ids.has(id)) throw new Error(`El id "${id}" esta repetido en data/fotos.json`);
    ids.add(id);

    const rutaOrigen = path.join(dirOrigen, archivo);
    if (!existsSync(rutaOrigen)) {
      throw new Error(`Falta el archivo ${archivo} en fotos-originales/ (lo pide el id "${id}")`);
    }

    const entrada = sharp(rutaOrigen, { failOn: 'error' }).rotate(); // respeta la orientacion EXIF
    const meta = await entrada.metadata();
    const anchoReal = meta.autoOrient?.width ?? meta.width;
    const altoReal = meta.autoOrient?.height ?? meta.height;
    const proporcion = altoReal / anchoReal;

    process.stdout.write(`${id}  (${archivo}, ${anchoReal}x${altoReal})\n`);

    // No ampliamos nunca: solo anchos menores o iguales al original.
    const anchosUtiles = anchos.filter((w) => w <= anchoReal);
    if (anchosUtiles.length === 0) anchosUtiles.push(anchoReal);
    if (!anchosUtiles.includes(anchoReal) && anchoReal < Math.max(...anchos)) {
      anchosUtiles.push(anchoReal);
    }
    anchosUtiles.sort((a, b) => a - b);

    const generados = [];
    for (const w of anchosUtiles) {
      const h = Math.round(w * proporcion);
      const base = `${id}-${w}`;
      const redimensionada = sharp(rutaOrigen).rotate().resize({ width: w, withoutEnlargement: true });

      await redimensionada
        .clone()
        .webp({ quality: CALIDAD_WEBP, effort: 6 })
        .toFile(path.join(dirDestino, `${base}.webp`));

      await redimensionada
        .clone()
        .jpeg({ quality: CALIDAD_JPG, progressive: true, mozjpeg: true })
        .toFile(path.join(dirDestino, `${base}.jpg`));

      generados.push({ ancho: w, alto: h });
      aviso(`${base}.webp + ${base}.jpg`);
    }

    // Miniatura muy pequena para usar como fondo mientras carga.
    await sharp(rutaOrigen)
      .rotate()
      .resize({ width: 24 })
      .blur(1.2)
      .webp({ quality: 40 })
      .toFile(path.join(dirDestino, `${id}-placeholder.webp`));

    salida.push({
      id,
      rol: foto.rol ?? 'galeria',
      galeria: foto.galeria !== false,
      alt: foto.alt ?? '',
      pie: foto.pie ?? '',
      ancho: anchoReal,
      alto: altoReal,
      anchos: generados.map((g) => g.ancho),
      orientacion: proporcion > 1.05 ? 'vertical' : proporcion < 0.85 ? 'panoramica' : 'cuadrada'
    });
  }

  const cabecera = `/* Archivo generado por scripts/build-images.mjs. No editar a mano. */\n`;
  const cuerpo =
    `window.GALERIA = ${JSON.stringify(salida.filter((f) => f.galeria), null, 2)};\n` +
    `window.IMAGENES = ${JSON.stringify(Object.fromEntries(salida.map((f) => [f.id, f])), null, 2)};\n`;
  await writeFile(rutaDatosGaleria, cabecera + cuerpo, 'utf8');

  process.stdout.write(`\nassets/js/galeria-data.js actualizado (${salida.filter((f) => f.galeria).length} fotos en galeria)\n`);

  // Resumen util para pegar en el HTML.
  process.stdout.write(`\nDimensiones intrinsecas (para width/height en el HTML):\n`);
  for (const f of salida) {
    process.stdout.write(`  ${f.id.padEnd(26)} width="${f.ancho}" height="${f.alto}"  [${f.orientacion}] anchos: ${f.anchos.join(', ')}\n`);
  }

  if (huerfanos.length) {
    process.stdout.write(
      `\nAviso: estos archivos estan en fotos-originales/ pero no aparecen en data/fotos.json, asi que no se usaron:\n` +
        huerfanos.map((f) => `  - ${f}`).join('\n') +
        `\n`
    );
  }
  process.stdout.write('\nListo.\n\n');
}

main().catch((err) => {
  process.stderr.write(`\nError: ${err.message}\n\n`);
  process.exitCode = 1;
});
