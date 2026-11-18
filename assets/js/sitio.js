/* Pesca en Inírida — comportamiento del sitio.
   Tres cosas: la galería, el visor de imágenes y el revelado al hacer scroll.
   Sin dependencias. */

(function () {
  'use strict';

  var RUTA_IMG = 'assets/img/';
  var imagenes = window.IMAGENES || {};
  var galeria = window.GALERIA || [];

  function mayorAncho(datos) {
    if (!datos || !datos.anchos || !datos.anchos.length) return null;
    return datos.anchos[datos.anchos.length - 1];
  }

  function srcset(id, anchos, extension) {
    return anchos
      .map(function (w) {
        return RUTA_IMG + id + '-' + w + '.' + extension + ' ' + w + 'w';
      })
      .join(', ');
  }

  /* ---------------- Galería ---------------- */

  function montarGaleria() {
    var lista = document.getElementById('galeria-lista');
    if (!lista || !galeria.length) return;

    var fragmento = document.createDocumentFragment();

    galeria.forEach(function (foto) {
      var anchos = foto.anchos || [];
      if (!anchos.length) return;

      var medio = anchos[Math.min(1, anchos.length - 1)];
      var tamanos = '(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, calc(100vw - 2rem)';

      var li = document.createElement('li');

      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'galeria__boton';
      boton.setAttribute('data-visor', foto.id);
      boton.setAttribute('aria-label', 'Ampliar: ' + foto.alt);

      var picture = document.createElement('picture');

      var source = document.createElement('source');
      source.type = 'image/webp';
      source.srcset = srcset(foto.id, anchos, 'webp');
      source.sizes = tamanos;

      var img = document.createElement('img');
      img.src = RUTA_IMG + foto.id + '-' + medio + '.jpg';
      img.srcset = srcset(foto.id, anchos, 'jpg');
      img.sizes = tamanos;
      img.width = foto.ancho;
      img.height = foto.alto;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = foto.alt;

      picture.appendChild(source);
      picture.appendChild(img);
      boton.appendChild(picture);
      li.appendChild(boton);
      fragmento.appendChild(li);
    });

    lista.appendChild(fragmento);
  }

  /* ---------------- Visor ---------------- */

  function montarVisor() {
    var visor = document.getElementById('visor');
    var imagen = document.getElementById('visor-imagen');
    var pie = document.getElementById('visor-pie');
    var cerrar = document.getElementById('visor-cerrar');
    if (!visor || !imagen || !pie || !cerrar) return;

    var disparadorPrevio = null;
    var soportaDialog = typeof visor.showModal === 'function';

    function abrir(id, disparador) {
      var datos = imagenes[id];
      if (!datos) return;
      var w = mayorAncho(datos);
      if (!w) return;

      disparadorPrevio = disparador || null;
      imagen.src = RUTA_IMG + id + '-' + w + '.jpg';
      imagen.width = datos.ancho;
      imagen.height = datos.alto;
      imagen.alt = datos.alt || '';
      pie.textContent = datos.pie || datos.alt || '';

      if (soportaDialog) {
        visor.showModal();
        document.documentElement.style.overflow = 'hidden';
        cerrar.focus();
      }
    }

    function alCerrar() {
      document.documentElement.style.overflow = '';
      imagen.removeAttribute('src');
      if (disparadorPrevio && typeof disparadorPrevio.focus === 'function') {
        disparadorPrevio.focus();
      }
      disparadorPrevio = null;
    }

    // Delegación: sirve para la infografía y para la galería generada después.
    document.addEventListener('click', function (evento) {
      var disparador = evento.target.closest('[data-visor]');
      if (!disparador) return;
      if (!soportaDialog) return; // sin <dialog>, el botón simplemente no hace nada raro
      evento.preventDefault();
      abrir(disparador.getAttribute('data-visor'), disparador);
    });

    cerrar.addEventListener('click', function () {
      visor.close();
    });

    // Clic en el fondo para cerrar.
    visor.addEventListener('click', function (evento) {
      if (evento.target === visor) visor.close();
    });

    visor.addEventListener('close', alCerrar);
    visor.addEventListener('cancel', function () {
      // Esc: dejamos que el navegador cierre, solo limpiamos después.
    });
  }

  /* ---------------- Revelado al hacer scroll ---------------- */

  function montarRevelado() {
    var elementos = document.querySelectorAll('.revelar');
    if (!elementos.length) return;

    var prefiereQuieto =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefiereQuieto || !('IntersectionObserver' in window)) {
      elementos.forEach(function (el) {
        el.classList.add('es-visible');
      });
      return;
    }

    var observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add('es-visible');
          observador.unobserve(entrada.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    elementos.forEach(function (el) {
      observador.observe(el);
    });
  }

  /* ---------------- Arranque ---------------- */

  function iniciar() {
    montarGaleria();
    montarVisor();
    montarRevelado();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
