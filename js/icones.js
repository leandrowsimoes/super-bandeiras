/* ============================================================
   Super Bandeiras! — Ícones
   Monta o SVG de um ícone do sprite embutido no index.html.
   ============================================================ */

(function () {
  'use strict';

  window.Icone = {
    // Devolve o HTML do ícone; "id" é o nome do <symbol> sem o prefixo "i-".
    html: function (id) {
      return '<svg class="ico" aria-hidden="true"><use href="#i-' + id + '"/></svg>';
    }
  };
})();
