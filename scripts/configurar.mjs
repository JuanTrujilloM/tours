#!/usr/bin/env node
/**
 * Aplica los valores de data/sitio.json al sitio.
 *
 *   node scripts/configurar.mjs
 *   npm run configurar
 *
 * Reemplaza el titulo, el numero de contacto, el mensaje de WhatsApp y la URL
 * base en index.html, sitemap.xml y robots.txt.
 *
 * Como sabe que reemplazar: guarda los valores aplicados en
 * data/.sitio-aplicado.json y en la siguiente corrida cambia los viejos por los
 * nuevos. La primera vez usa los valores iniciales del proyecto.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rutaConfig = path.join(raiz, 'data', 'sitio.json');
const rutaEstado = path.join(raiz, 'data', '.sitio-aplicado.json');

const ARCHIVOS = ['index.html', 'sitemap.xml', 'robots.txt'];

/** Valores con los que nacio el proyecto. */
const INICIALES = {
  titulo: 'Pesca en Inírida',
  telefonoVisible: '+57 312 4420951',
  telefonoEnlace: '+573124420951',
  telefonoWhatsapp: '573124420951',
  mensajeWhatsapp: 'Hola, vi la página y quiero información sobre las salidas de pesca en Inírida',
  urlBase: 'https://usuario.github.io/pesca-inirida/'
};

function normalizarBase(url) {
  return url.endsWith('/') ? url : url + '/';
}

function enlaceWhatsapp(cfg) {
  return `https://wa.me/${cfg.telefonoWhatsapp}?text=${encodeURIComponent(cfg.mensajeWhatsapp)}`;
}

function escaparRegExp(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function reemplazarTodo(texto, viejo, nuevo) {
  if (!viejo || viejo === nuevo) return { texto, cambios: 0 };
  const re = new RegExp(escaparRegExp(viejo), 'g');
  const cambios = (texto.match(re) || []).length;
  return { texto: texto.replace(re, nuevo), cambios };
}

async function main() {
  const cfg = JSON.parse(await readFile(rutaConfig, 'utf8'));
  cfg.urlBase = normalizarBase(cfg.urlBase);

  const anterior = existsSync(rutaEstado)
    ? JSON.parse(await readFile(rutaEstado, 'utf8'))
    : { ...INICIALES };
  anterior.urlBase = normalizarBase(anterior.urlBase);

  const sustituciones = [
    // El enlace completo primero: contiene el numero y el mensaje.
    [enlaceWhatsapp(anterior), enlaceWhatsapp(cfg)],
    [`tel:${anterior.telefonoEnlace}`, `tel:${cfg.telefonoEnlace}`],
    [anterior.telefonoVisible, cfg.telefonoVisible],
    [anterior.urlBase, cfg.urlBase],
    [anterior.titulo, cfg.titulo]
  ];

  let totalCambios = 0;
  process.stdout.write('\nAplicando data/sitio.json\n\n');

  for (const nombre of ARCHIVOS) {
    const ruta = path.join(raiz, nombre);
    if (!existsSync(ruta)) {
      process.stdout.write(`  ${nombre.padEnd(14)} (no existe, se omite)\n`);
      continue;
    }
    let texto = await readFile(ruta, 'utf8');
    let cambiosArchivo = 0;

    for (const [viejo, nuevo] of sustituciones) {
      const r = reemplazarTodo(texto, viejo, nuevo);
      texto = r.texto;
      cambiosArchivo += r.cambios;
    }

    if (cambiosArchivo > 0) await writeFile(ruta, texto, 'utf8');
    totalCambios += cambiosArchivo;
    process.stdout.write(`  ${nombre.padEnd(14)} ${cambiosArchivo} reemplazo(s)\n`);
  }

  const estado = {
    titulo: cfg.titulo,
    telefonoVisible: cfg.telefonoVisible,
    telefonoEnlace: cfg.telefonoEnlace,
    telefonoWhatsapp: cfg.telefonoWhatsapp,
    mensajeWhatsapp: cfg.mensajeWhatsapp,
    urlBase: cfg.urlBase
  };
  await writeFile(rutaEstado, JSON.stringify(estado, null, 2) + '\n', 'utf8');

  if (totalCambios === 0) {
    process.stdout.write('\nNada que cambiar: el sitio ya coincide con data/sitio.json.\n\n');
  } else {
    process.stdout.write(`\nListo: ${totalCambios} reemplazo(s).\n\n`);
  }
}

main().catch((err) => {
  process.stderr.write(`\nError: ${err.message}\n\n`);
  process.exitCode = 1;
});
