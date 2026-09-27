/* ============================================================
   Super Bandeiras! — Navegação entre telas
   Uma cortina de nuvens atravessa a tela: cobre, troca a tela
   por baixo e descobre. Cada tela escolhe sua trilha com
   data-musica ("menu" é o padrão).
   ============================================================ */

(function () {
  'use strict';

  var TEMPO_COBRIR = 380;    // ms até as nuvens cobrirem a tela
  var TEMPO_DESCOBRIR = 420; // ms para as nuvens saírem

  var cortina = document.getElementById('transicao');
  var telas = document.querySelectorAll('.tela');
  var atual = null;
  var timers = [];

  function limparTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function trocar(id) {
    for (var i = 0; i < telas.length; i++) {
      telas[i].hidden = telas[i].id !== id;
    }
    atual = document.getElementById(id);
    window.scrollTo(0, 0);
    if (window.Musica) Musica.trocar(atual.getAttribute('data-musica') || 'menu');
  }

  // `aoTrocar` roda no instante em que a tela nova fica visível por
  // baixo das nuvens (bom para montar o conteúdo sem o jogador ver).
  function mostrar(id, opcoes) {
    opcoes = opcoes || {};
    limparTimers();
    var instantaneo = opcoes.instantaneo || Efeitos.movimentoReduzido() || !atual;
    if (instantaneo) {
      cortina.className = 'transicao';
      trocar(id);
      if (opcoes.aoTrocar) opcoes.aoTrocar();
      return;
    }
    Sons.tocar('whoosh');
    cortina.className = 'transicao cobrindo';
    timers.push(setTimeout(function () {
      trocar(id);
      if (opcoes.aoTrocar) opcoes.aoTrocar();
      cortina.className = 'transicao descobrindo';
      timers.push(setTimeout(function () { cortina.className = 'transicao'; }, TEMPO_DESCOBRIR));
    }, TEMPO_COBRIR));
  }

  window.Telas = {
    mostrar: mostrar,
    atual: function () { return atual ? atual.id : null; }
  };
})();
