/* ============================================================
   Super Bandeiras! — Voz (leitura em voz alta, pt-BR)
   Segue o botão 🔊. Enquanto fala, a música abaixa.
   ============================================================ */

(function () {
  'use strict';

  var disponivel = !!window.speechSynthesis;
  var vozPt = null;
  var sessao = 0;   // cada fala nova invalida os avisos de término das antigas

  function escolherVozPt() {
    var vozes = speechSynthesis.getVoices();
    vozPt = null;
    for (var i = 0; i < vozes.length; i++) {
      var idioma = (vozes[i].lang || '').toLowerCase().replace('_', '-');
      if (idioma.indexOf('pt-br') === 0) { vozPt = vozes[i]; return; }
      if (!vozPt && idioma.indexOf('pt') === 0) vozPt = vozes[i];
    }
  }

  if (disponivel) {
    escolherVozPt();
    speechSynthesis.onvoiceschanged = escolherVozPt;
  }

  function abafarMusica(sim) {
    if (window.Musica) Musica.abafar(sim);
  }

  function calar() {
    sessao++;
    abafarMusica(false);
    if (disponivel) speechSynthesis.cancel();
  }

  // Fala uma lista de trechos em sequência. `aoComecarTrecho(i)` permite
  // destacar na tela o que está sendo lido; `aoTerminar` roda no fim (ou
  // logo, se não houver voz), para o jogo nunca ficar esperando.
  function falarSequencia(trechos, aoComecarTrecho, aoTerminar) {
    calar();
    var minhaSessao = sessao;
    var terminar = function () {
      if (minhaSessao !== sessao) return;
      abafarMusica(false);
      if (aoTerminar) aoTerminar();
    };
    if (!disponivel || !window.Sons || !Sons.ligado() || !trechos.length) {
      setTimeout(terminar, 0);
      return;
    }

    abafarMusica(true);
    var indice = 0;
    function proximo() {
      if (minhaSessao !== sessao) return;
      if (indice >= trechos.length) { terminar(); return; }
      var atual = indice++;
      if (aoComecarTrecho) aoComecarTrecho(atual);
      var fala = new SpeechSynthesisUtterance(trechos[atual]);
      fala.lang = 'pt-BR';
      if (vozPt) fala.voice = vozPt;
      fala.rate = 0.95;
      // Alguns navegadores nunca disparam `onend`: um prazo estimado pelo
      // tamanho do texto garante que a sequência continue mesmo assim.
      var avancou = false;
      var avancar = function () {
        if (avancou) return;
        avancou = true;
        clearTimeout(prazo);
        setTimeout(proximo, 120);
      };
      var prazo = setTimeout(avancar, 1500 + trechos[atual].length * 110);
      fala.onend = avancar;
      fala.onerror = avancar;
      speechSynthesis.speak(fala);
    }
    proximo();
  }

  window.Voz = {
    falar: function (texto, aoTerminar) { falarSequencia([texto], null, aoTerminar); },
    falarSequencia: falarSequencia,
    calar: calar
  };
})();
