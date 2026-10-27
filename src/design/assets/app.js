/* ============================================================================
   BuffetYa! prototype — icon sprite + screen behaviour
   Icons are authored SVG at one stroke weight. No emoji, no Unicode glyphs.
   ============================================================================ */

(function () {
  'use strict';

  var ICONS = {
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    receipt: '<path d="M5 21V4a1 1 0 0 1 1.5-.87L9 4.5l2.5-1.4a1 1 0 0 1 1 0L15 4.5l2.5-1.37A1 1 0 0 1 19 4v17l-2.5-1.4a1 1 0 0 0-1 0L13 21l-2.5-1.4a1 1 0 0 0-1 0L7 21Z"/><path d="M9 9h6M9 13h6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h2.6l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L20.5 7H6"/>',
    bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    chevronRight: '<path d="M9 5l7 7-7 7"/>',
    chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    checkBig: '<path d="M3.5 12.5l5.5 5.5L20.5 6.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.9-3.9"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
    bell: '<path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z"/><path d="M10.3 19a2 2 0 0 0 3.4 0"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.2h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4.5M12 8h.01"/>',
    wheat: '<path d="M4 20L20 4"/><path d="M12.5 5.5a3 3 0 0 1 4.2 4.2 3 3 0 0 1-4.2-4.2ZM9 9a3 3 0 0 1 4.2 4.2A3 3 0 0 1 9 9ZM5.5 12.5a3 3 0 0 1 4.2 4.2 3 3 0 0 1-4.2-4.2Z"/>',
    leaf: '<path d="M4.5 19.5C3 15 5 6 14 5c2.5-.3 5 .5 5 .5s.5 8-4 11.5c-3.7 2.9-8 3-10.5 2.5Z"/><path d="M5 19c3-5.5 6.5-8.5 10-10.5"/>',
    sprout: '<path d="M12 20v-7"/><path d="M12 13C12 9 9 6.5 5 6.5c0 4 3 6.5 7 6.5Z"/><path d="M12 13c0-3.3 2.5-5.5 6-5.5 0 3.3-2.5 5.5-6 5.5Z"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h3"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 10v4M18 10v4"/>',
    share: '<path d="M12 15V3.5"/><path d="M8.2 7.3L12 3.5l3.8 3.8"/><path d="M6 12H5a1.5 1.5 0 0 0-1.5 1.5V19A1.5 1.5 0 0 0 5 20.5h14A1.5 1.5 0 0 0 20.5 19v-5.5A1.5 1.5 0 0 0 19 12h-1"/>',
    addSquare: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M10.6 6.2A8.7 8.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15.6 15.6 0 0 1-3.3 3.9M6.3 8.1A15.5 15.5 0 0 0 2.5 12S6 18 12 18a9 9 0 0 0 3.6-.7"/><path d="M3 3l18 18"/><path d="M9.9 10a3 3 0 0 0 4.1 4.2"/>',
    trash: '<path d="M4 7h16M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7"/><path d="M6.5 7l.8 12.1a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/><path d="M10.5 11v6M13.5 11v6"/>',
    package: '<path d="M20.5 8.2v7.6a1.6 1.6 0 0 1-.9 1.4l-6.8 3.5a1.6 1.6 0 0 1-1.6 0l-6.8-3.5a1.6 1.6 0 0 1-.9-1.4V8.2"/><path d="M3.9 7.3l7.3-3.7a1.6 1.6 0 0 1 1.6 0l7.3 3.7-8.1 4.2L3.9 7.3Z"/><path d="M12 11.5v9"/>',
    flame: '<path d="M12 21c3.9 0 6.5-2.5 6.5-6 0-4.5-4-6-4-10 0 0-2.5 1.5-2.5 4.5 0 1.6-1 2.5-2 2.5S8.5 11 8.5 9C6.7 10.6 5.5 12.6 5.5 15c0 3.5 2.6 6 6.5 6Z"/>',
    refresh: '<path d="M20 11.5A8 8 0 0 0 6.2 6.4L3.5 9"/><path d="M4 12.5a8 8 0 0 0 13.8 5.1L20.5 15"/><path d="M3.5 4.5V9H8M20.5 19.5V15H16"/>',
    logout: '<path d="M15 4.5h3A1.5 1.5 0 0 1 19.5 6v12a1.5 1.5 0 0 1-1.5 1.5h-3"/><path d="M10 16l-4-4 4-4M6 12h9"/>',
    phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    lock: '<rect x="4.5" y="10" width="15" height="10.5" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
    mail: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3.5 7l7.6 5.3a1.5 1.5 0 0 0 1.8 0L20.5 7"/>',
    mapPin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 9.7l5.9-.8L12 3.5Z"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    download: '<path d="M12 3.5v11"/><path d="M8 11l4 3.5 4-3.5"/><path d="M4.5 17v2A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-2"/>',
    moreVertical: '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>'
  };

  function buildSprite() {
    if (document.getElementById('by-sprite')) return;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('id', 'by-sprite');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');

    var markup = '';
    Object.keys(ICONS).forEach(function (name) {
      markup +=
        '<symbol id="i-' + name + '" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round">' +
        ICONS[name] + '</symbol>';
    });
    svg.innerHTML = markup;
    document.body.insertBefore(svg, document.body.firstChild);
  }

  /* Quantity steppers ---------------------------------------------------- */
  function bindSteppers(root) {
    root.querySelectorAll('[data-stepper]').forEach(function (el) {
      var out = el.querySelector('output');
      var dec = el.querySelector('[data-dec]');
      var inc = el.querySelector('[data-inc]');
      var min = parseInt(el.dataset.min || '1', 10);
      var max = parseInt(el.dataset.max || '20', 10);

      function sync() {
        var n = parseInt(out.textContent, 10);
        dec.disabled = n <= min;
        inc.disabled = n >= max;
        el.dispatchEvent(new CustomEvent('qtychange', { bubbles: true, detail: { value: n } }));
      }
      dec.addEventListener('click', function () {
        var n = parseInt(out.textContent, 10);
        if (n > min) { out.textContent = n - 1; sync(); }
      });
      inc.addEventListener('click', function () {
        var n = parseInt(out.textContent, 10);
        if (n < max) { out.textContent = n + 1; sync(); }
      });
      sync();
    });
  }

  /* Filter chips --------------------------------------------------------- */
  function bindChips(root) {
    root.querySelectorAll('[data-chipgroup]').forEach(function (group) {
      var exclusive = group.dataset.chipgroup === 'one';
      group.querySelectorAll('.chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          var on = chip.getAttribute('aria-pressed') === 'true';
          if (exclusive) {
            group.querySelectorAll('.chip').forEach(function (c) {
              c.setAttribute('aria-pressed', 'false');
            });
            chip.setAttribute('aria-pressed', 'true');
          } else {
            chip.setAttribute('aria-pressed', on ? 'false' : 'true');
          }
          group.dispatchEvent(new CustomEvent('filterchange', { bubbles: true }));
        });
      });
    });
  }

  /* Password reveal ------------------------------------------------------ */
  function bindReveal(root) {
    root.querySelectorAll('[data-reveal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = document.getElementById(btn.dataset.reveal);
        var hidden = input.type === 'password';
        input.type = hidden ? 'text' : 'password';
        btn.setAttribute('aria-label', hidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
        btn.querySelector('use').setAttribute('href', hidden ? '#i-eyeOff' : '#i-eye');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildSprite();
    bindSteppers(document);
    bindChips(document);
    bindReveal(document);
  });

  window.BuffetYa = { icons: ICONS };
})();
