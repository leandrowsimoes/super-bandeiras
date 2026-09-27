/* ============================================================
   Super Bandeiras! — Efeitos sonoros
   Todos os sons são sintetizados com Web Audio (sem arquivos).
   Sons suaves e "redondos", pensados para crianças: nada de
   buzinas ásperas no erro. Liga/desliga pelo botão 🔊.
   ============================================================ */

(function () {
  'use strict';

  var ligado = localStorage.getItem('vb_som') !== 'nao';
  var contexto = null;
  var mestre = null;
  var ruido = null;
  var ultimoHover = 0;

  function garantirContexto() {
    if (!contexto) {
      contexto = new (window.AudioContext || window.webkitAudioContext)();
      // Compressor evita que sons sobrepostos estourem o volume.
      var compressor = contexto.createDynamicsCompressor();
      compressor.connect(contexto.destination);
      mestre = contexto.createGain();
      mestre.gain.value = 0.9;
      mestre.connect(compressor);

      var amostras = contexto.sampleRate;
      ruido = contexto.createBuffer(1, amostras, contexto.sampleRate);
      var dados = ruido.getChannelData(0);
      for (var i = 0; i < amostras; i++) dados[i] = Math.random() * 2 - 1;
    }
    if (contexto.state === 'suspended') contexto.resume();
  }

  // Uma nota com ataque rápido e queda suave; `deslizarPara` faz a
  // frequência escorregar (útil para "boing", "whoop" e glissandos).
  function nota(freq, inicio, duracao, tipo, volume, deslizarPara) {
    var osc = contexto.createOscillator();
    var ganho = contexto.createGain();
    var t = contexto.currentTime + inicio;
    osc.type = tipo || 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    if (deslizarPara) osc.frequency.exponentialRampToValueAtTime(deslizarPara, t + duracao);
    ganho.gain.setValueAtTime(0.0001, t);
    ganho.gain.exponentialRampToValueAtTime(volume || 0.15, t + 0.015);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
    osc.connect(ganho);
    ganho.connect(mestre);
    osc.start(t);
    osc.stop(t + duracao + 0.05);
  }

  // Ruído filtrado com a frequência varrendo de `de` até `ate`: "whoosh".
  function sopro(inicio, duracao, de, ate, volume) {
    var fonte = contexto.createBufferSource();
    var filtro = contexto.createBiquadFilter();
    var ganho = contexto.createGain();
    var t = contexto.currentTime + inicio;
    fonte.buffer = ruido;
    filtro.type = 'bandpass';
    filtro.Q.value = 1.2;
    filtro.frequency.setValueAtTime(de, t);
    filtro.frequency.exponentialRampToValueAtTime(ate, t + duracao);
    ganho.gain.setValueAtTime(0.0001, t);
    ganho.gain.exponentialRampToValueAtTime(volume, t + duracao * 0.4);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
    fonte.connect(filtro);
    filtro.connect(ganho);
    ganho.connect(mestre);
    fonte.start(t);
    fonte.stop(t + duracao + 0.05);
  }

  var DO_MAIOR = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5, 1174.66, 1318.51];

  var SONS = {
    clique: function () {
      nota(900, 0, 0.07, 'triangle', 0.08, 1200);
    },
    hover: function () {
      nota(1400, 0, 0.05, 'sine', 0.035);
    },
    acerto: function () {
      nota(523.25, 0, 0.14, 'triangle', 0.16);
      nota(659.25, 0.07, 0.14, 'triangle', 0.16);
      nota(783.99, 0.14, 0.26, 'triangle', 0.18);
      nota(2093, 0.2, 0.25, 'sine', 0.05);
      nota(2637, 0.26, 0.3, 'sine', 0.04);
    },
    erro: function () {
      // "Uh-oh" suave, descendo, em vez de buzina.
      nota(392, 0, 0.18, 'triangle', 0.13, 370);
      nota(311, 0.17, 0.32, 'triangle', 0.13, 262);
    },
    combo: function (nivel) {
      // Quanto maior o combo, mais agudo o "plim".
      var passo = Math.min(nivel || 2, 5);
      var base = DO_MAIOR[passo + 2];
      nota(base, 0.28, 0.1, 'square', 0.04);
      nota(base * 1.5, 0.34, 0.16, 'square', 0.04);
    },
    super: function () {
      nota(783.99, 0.3, 0.12, 'square', 0.05);
      nota(1046.5, 0.4, 0.12, 'square', 0.05);
      nota(1318.51, 0.5, 0.12, 'square', 0.05);
      nota(1567.98, 0.6, 0.4, 'square', 0.06);
      sopro(0.3, 0.6, 2000, 8000, 0.05);
    },
    whoosh: function () {
      sopro(0, 0.55, 300, 2600, 0.12);
    },
    virar: function () {
      sopro(0, 0.12, 1500, 4000, 0.05);
      nota(700, 0.02, 0.07, 'triangle', 0.05, 1000);
    },
    estrela: function (indice) {
      var tons = [783.99, 987.77, 1174.66];
      var f = tons[Math.min(indice || 0, 2)];
      nota(f, 0, 0.4, 'triangle', 0.17);
      nota(f * 2, 0.03, 0.35, 'sine', 0.06);
    },
    moeda: function () {
      nota(1568, 0, 0.05, 'square', 0.025);
      nota(2093, 0.04, 0.07, 'square', 0.025);
    },
    fanfarra: function () {
      nota(523.25, 0, 0.16, 'triangle', 0.16);
      nota(659.25, 0.13, 0.16, 'triangle', 0.16);
      nota(783.99, 0.26, 0.16, 'triangle', 0.16);
      nota(1046.5, 0.39, 0.55, 'triangle', 0.2);
      nota(659.25, 0.39, 0.55, 'sine', 0.08);
      nota(783.99, 0.39, 0.55, 'sine', 0.08);
    },
    encorajar: function () {
      // Frase curtinha que sobe: "você consegue!".
      nota(392, 0, 0.16, 'triangle', 0.14);
      nota(440, 0.15, 0.16, 'triangle', 0.14);
      nota(523.25, 0.3, 0.16, 'triangle', 0.14);
      nota(659.25, 0.45, 0.4, 'triangle', 0.16);
    },
    conquista: function () {
      nota(1046.5, 0, 0.12, 'sine', 0.12);
      nota(1318.51, 0.08, 0.12, 'sine', 0.12);
      nota(1567.98, 0.16, 0.12, 'sine', 0.12);
      nota(2093, 0.24, 0.5, 'sine', 0.14);
      nota(1046.5, 0.24, 0.5, 'triangle', 0.08);
    },
    carimbo: function () {
      nota(160, 0, 0.16, 'sine', 0.3, 55);
      sopro(0, 0.08, 800, 300, 0.12);
    },
    desbloquear: function () {
      nota(400, 0, 0.45, 'triangle', 0.1, 1200);
      nota(1046.5, 0.45, 0.12, 'triangle', 0.14);
      nota(1318.51, 0.55, 0.12, 'triangle', 0.14);
      nota(1567.98, 0.65, 0.45, 'triangle', 0.16);
    },
    par: function () {
      nota(659.25, 0, 0.12, 'triangle', 0.14);
      nota(987.77, 0.09, 0.22, 'triangle', 0.15);
    },
    tique: function () {
      nota(1000, 0, 0.04, 'sine', 0.06);
    },
    boing: function () {
      nota(220, 0, 0.25, 'sine', 0.15, 520);
    }
  };

  function tocar(nome, argumento) {
    if (!ligado || !SONS[nome]) return;
    if (nome === 'hover') {
      // Passar o mouse por vários botões seguidos não vira metralhadora.
      var agora = Date.now();
      if (agora - ultimoHover < 70) return;
      ultimoHover = agora;
    }
    try {
      garantirContexto();
      SONS[nome](argumento);
    } catch (erro) {
      // Sem áudio disponível (navegador antigo ou bloqueado): segue em silêncio.
      if (window.console) console.warn('Som indisponível:', erro);
    }
  }

  window.Sons = {
    tocar: tocar,
    ligado: function () { return ligado; },
    alternar: function () {
      ligado = !ligado;
      localStorage.setItem('vb_som', ligado ? 'sim' : 'nao');
      return ligado;
    }
  };
})();
