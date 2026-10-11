/* ============================================================
   Super Bandeiras! — Ícones
   Monta o SVG de um ícone do sprite embutido no index.html.
   ============================================================ */

(function () {
  'use strict';

  window.Icone = {
    // Devolve o HTML do ícone; "id" é o nome do <symbol> sem o prefixo "i-".
    html: function (id, classe) {
      return '<svg class="ico' + (classe ? ' ' + classe : '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>';
    },

    // Troca o conteúdo de `elemento` por ícone + texto (o texto entra como texto puro).
    comTexto: function (elemento, id, texto, classe) {
      elemento.innerHTML = window.Icone.html(id, classe) + ' ';
      elemento.appendChild(document.createTextNode(texto));
    }
  };
})();
