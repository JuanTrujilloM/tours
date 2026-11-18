# Pesca en Inírida

Sitio web estático e informativo sobre las salidas de pesca en Puerto Inírida y la Estrella
Fluvial de Inírida (Guainía, Colombia). HTML, CSS y JavaScript sin framework. Se publica en
GitHub Pages.

**El sitio no tiene precios, tarifas, paquetes, duración de planes, horarios ni disponibilidad**, y
no afirma nada que no esté respaldado por una fuente. Toda la investigación con sus enlaces está en
[`docs/investigacion.md`](docs/investigacion.md).

---

## Qué hay en el repositorio

```
index.html                 La página completa. Todo el contenido vive aquí.
favicon.svg                Ícono propio, dibujado a mano.
robots.txt  sitemap.xml    SEO.
.nojekyll                  Evita que GitHub Pages procese el sitio con Jekyll.

assets/css/estilo.css      Hoja de estilos. La paleta está arriba, como tokens CSS.
assets/js/sitio.js         Galería, visor de imágenes y revelado al hacer scroll.
assets/js/galeria-data.js  GENERADO. No editar: lo escribe el script de imágenes.
assets/fonts/              Fraunces y Public Sans, autoalojadas (subconjunto latino).
assets/img/                GENERADAS. Derivadas WebP y JPG en varios anchos.

fotos-originales/          Las fotos tal como llegaron. Nunca se modifican.
data/fotos.json            Qué foto se usa, con qué id, alt y pie.
data/sitio.json            Título, teléfono, mensaje de WhatsApp y URL base.

scripts/build-images.mjs   Genera assets/img/ y assets/js/galeria-data.js.
scripts/configurar.mjs     Aplica data/sitio.json al HTML y al SEO.
scripts/serve.mjs          Servidor local para revisar el sitio.

docs/investigacion.md      La investigación, con la fuente de cada dato.
.github/workflows/pages.yml  Publicación automática en GitHub Pages.
```

Las imágenes generadas **sí se suben al repositorio**: GitHub Pages no corre el script, publica lo
que encuentre.

---

## Requisitos

Node.js 18 o superior, solo para correr los scripts. El sitio en sí no necesita compilarse.

```bash
npm install
```

---

## Agregar fotos nuevas

1. Copia el archivo a `fotos-originales/`. No cambies ni recortes los originales.

2. Agrega una entrada en `data/fotos.json`, dentro de `fotos`:

   ```json
   {
     "id": "raudal-atardecer",
     "archivo": "12.jpg",
     "rol": "galeria",
     "galeria": true,
     "alt": "Descripción de la escena y, si se reconoce, de la especie. Sin nombres de personas.",
     "pie": "Texto corto que se muestra debajo de la imagen en el visor."
   }
   ```

   - `id`: en minúsculas, sin espacios ni tildes. Define el nombre de los archivos generados.
   - `archivo`: el nombre dentro de `fotos-originales/`.
   - `galeria`: `true` para que aparezca en la galería, `false` si solo se usa dentro de una sección.
   - `alt`: **obligatorio**. Describe la escena. No se nombran las personas que aparecen.

3. Genera las derivadas:

   ```bash
   npm run images
   ```

   Crea los WebP y los JPG en 480, 960 y 1600 px (nunca amplía: si el original es más pequeño, usa
   su ancho real), más una miniatura, y reescribe `assets/js/galeria-data.js`. Al final imprime las
   dimensiones de cada imagen, por si necesitas los `width`/`height` para pegarlos en el HTML.

4. Si la foto va **solo a la galería**, ya terminaste: la galería se arma sola desde el archivo de
   datos. Si quieres usarla dentro de una sección, copia un bloque `<picture>` del `index.html` y
   cambia el id, los anchos y el `alt`.

5. Súbelo todo, incluidas las imágenes generadas.

Las fotos que estén en `fotos-originales/` pero no en `data/fotos.json` se ignoran; el script avisa
cuáles son.

---

## Cambiar el número de contacto o el título

Ambos están en **un solo lugar**: `data/sitio.json`.

```json
{
  "titulo": "Pesca en Inírida",
  "telefonoVisible": "+57 312 4420951",
  "telefonoEnlace": "+573124420951",
  "telefonoWhatsapp": "573124420951",
  "mensajeWhatsapp": "Hola, vi la página y quiero información sobre las salidas de pesca en Inírida",
  "urlBase": "https://juantrujillom.github.io/tours/"
}
```

Edita lo que necesites y corre:

```bash
npm run configurar
```

El script reemplaza los valores en `index.html`, `sitemap.xml` y `robots.txt`, incluido el enlace de
WhatsApp con el mensaje ya codificado. Guarda lo aplicado en `data/.sitio-aplicado.json` para saber
qué reemplazar la próxima vez, así que **no edites esos valores a mano en el HTML**.

- `telefonoEnlace` es el número para `tel:`, en formato internacional y con `+`.
- `telefonoWhatsapp` es el mismo número sin `+` ni espacios, como lo pide `wa.me`.
- `urlBase` debe terminar en `/`.

---

## Ver el sitio en local

```bash
npm run serve
```

Queda en `http://localhost:4173`. Abrir `index.html` con doble clic también funciona casi todo,
pero el servidor reproduce mejor las condiciones reales.

---

## Publicar en GitHub Pages

El repositorio ya trae el flujo de trabajo oficial en `.github/workflows/pages.yml`
(`actions/upload-pages-artifact` + `actions/deploy-pages`).

El repositorio ya está conectado a `git@github.com:JuanTrujilloM/tours.git` y el código ya está en
la rama `main`. La URL del sitio será **https://juantrujillom.github.io/tours/**, y las etiquetas
canónicas, Open Graph y el sitemap ya apuntan ahí.

**Falta un paso manual, que solo puedes hacer tú desde GitHub:**

1. Entra a <https://github.com/JuanTrujilloM/tours/settings/pages>.
2. En **Source**, elige **GitHub Actions**. No elijas "Deploy from a branch".
3. Ve a <https://github.com/JuanTrujilloM/tours/actions> y mira el flujo
   «Publicar en GitHub Pages». Si no arrancó solo, ábrelo y usa **Run workflow**.
4. Cuando termine, el sitio queda en <https://juantrujillom.github.io/tours/>.

De ahí en adelante, cada `push` a `main` vuelve a publicar:

```bash
git add .
git commit -m "Describe el cambio"
git push
```

### Si cambias de repositorio o de dominio

Edita `urlBase` en `data/sitio.json` y corre `npm run configurar`. Eso solo afecta las etiquetas
canónicas, Open Graph y el sitemap: todas las rutas internas del sitio son relativas, así que
funciona en cualquier subcarpeta sin tocar nada más.

Cada `push` a `main` vuelve a publicar. También puedes lanzarlo a mano desde *Actions* con
**Run workflow**.

### Si algo sale mal

- **El sitio sale sin estilos**: casi siempre falta `.nojekyll`. Ya está en el repositorio;
  verifica que se haya subido (los archivos que empiezan por punto a veces se escapan).
- **Las imágenes no aparecen**: revisa que `assets/img/` esté en el repositorio. Si tienes un
  `.gitignore` que excluya imágenes, quítalo.
- **El flujo falla con un error de permisos**: confirma que en *Settings → Pages* la fuente sea
  **GitHub Actions**.

---

## Decisiones que conviene conocer antes de editar el contenido

- **Terminología legal.** El sitio dice «pesca de turismo» y «salidas de pesca», no «pesca
  deportiva». La Sentencia C-148 de 2022 retiró esa figura del ordenamiento y la Ley 2501 de 2025
  creó la nueva categoría. Si cambias los textos, mantén ese lenguaje.
- **La infografía tiene un error.** Presenta el «pavón pintalapa» como el juvenil del cinchado. La
  literatura científica dice que es la misma especie (*Cichla temensis*) en otro momento de su
  ciclo reproductivo. La sección de especies lo corrige; no borres esa aclaración sin reemplazarla.
- **Fechas que caducan.** Las vedas y el estado de la reglamentación llevan la marca
  «verificada el 17 de noviembre de 2026». Cuando actualices esos datos, mueve también la fecha, que
  aparece en la sección de normativa y en el pie.
- **Fotos que quedaron fuera.** En `fotos-originales/` hay cuatro archivos sin usar: `6.jpg` (casi
  idéntica a `5.jpg`), `8.jpg` (aparece un menor de edad), y `9.jpg` y `10.jpg` (peces sacrificados
  y peces asándose, que chocan con el mensaje de captura y liberación). Si decides publicarlas,
  basta agregarlas a `data/fotos.json` y correr `npm run images`.
- **Nada de precios.** Es una restricción del proyecto, no un olvido.

---

## Calidad

Resultados de Lighthouse 12 contra el servidor local, el 17 de noviembre de 2026:

| Categoría | Móvil | Escritorio |
|---|---|---|
| Rendimiento | 92 | 100 |
| Accesibilidad | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| SEO | 100 | 100 |

CLS 0 y TBT 0 ms en ambos. Para repetirlo:

```bash
npx lighthouse http://localhost:4173/ --view
```

Notas de accesibilidad: HTML semántico, foco visible, navegación completa por teclado, `alt` en
todas las imágenes, contraste AA verificado y respeto a `prefers-reduced-motion` (sin animaciones de
scroll si el sistema las desactiva). La galería es lo único que necesita JavaScript; el resto del
contenido funciona sin él.
