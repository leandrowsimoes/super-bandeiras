/* ============================================================
   Volta ao Mundo — Música de fundo
   Trilha alegre gerada com Web Audio (sem arquivos de áudio).
   Peça de 32 compassos (~71 segundos) em forma A-B-A-C:
   tema, variação, tema de novo e um trecho calmo antes de
   recomeçar. Liga/desliga pelo botão 🎵 e a escolha fica salva.
   ============================================================ */

(function () {
  'use strict';

  var BPM = 108;
  var BATIDA = 60 / BPM;          // segundos por batida
  var LOOP_BATIDAS = 128;         // 32 compassos de 4 tempos

  // Notas como [batida, nota MIDI, duração em batidas].
  // Cada seção tem 32 batidas; desloca() encadeia as seções.

  // Seção A — tema (C, G, Am, F | C, G, F, C)
  var MELODIA_A = [
    [0, 76, 0.5], [0.5, 79, 0.5], [1, 84, 1], [2, 79, 0.5], [2.5, 76, 0.5], [3, 79, 1],
    [4, 74, 0.5], [4.5, 79, 0.5], [5, 83, 1], [6, 79, 0.5], [6.5, 74, 0.5], [7, 79, 1],
    [8, 72, 0.5], [8.5, 76, 0.5], [9, 81, 1], [10, 76, 0.5], [10.5, 72, 0.5], [11, 76, 1],
    [12, 72, 0.5], [12.5, 77, 0.5], [13, 81, 1], [14, 84, 1], [15, 81, 1],
    [16, 79, 1], [17, 76, 0.5], [17.5, 79, 0.5], [18, 84, 1.5], [19.5, 83, 0.5],
    [20, 81, 0.5], [20.5, 79, 0.5], [21, 74, 1], [22, 79, 1], [23, 83, 1],
    [24, 81, 1], [25, 77, 0.5], [25.5, 81, 0.5], [26, 84, 1], [27, 86, 1],
    [28, 88, 1], [29, 84, 0.5], [29.5, 79, 0.5], [30, 76, 1], [31, 74, 1]
  ];

  // Seção B — variação (F, C, G, Am | F, C, G, G)
  var MELODIA_B = [
    [0, 81, 1], [1, 77, 0.5], [1.5, 81, 0.5], [2, 84, 1], [3, 81, 1],
    [4, 79, 1], [5, 76, 0.5], [5.5, 79, 0.5], [6, 84, 1], [7, 79, 1],
    [8, 74, 0.5], [8.5, 79, 0.5], [9, 83, 1], [10, 81, 0.5], [10.5, 79, 0.5], [11, 74, 1],
    [12, 76, 1], [13, 72, 0.5], [13.5, 76, 0.5], [14, 81, 1.5], [15.5, 79, 0.5],
    [16, 77, 0.5], [16.5, 81, 0.5], [17, 84, 1], [18, 86, 1], [19, 84, 1],
    [20, 84, 0.5], [20.5, 79, 0.5], [21, 76, 1], [22, 79, 1], [23, 84, 1],
    [24, 83, 1], [25, 79, 0.5], [25.5, 83, 0.5], [26, 86, 1], [27, 83, 1],
    [28, 86, 0.5], [28.5, 83, 0.5], [29, 79, 1], [30, 74, 1], [31, 71, 1]
  ];

  // Seção C — trecho calmo, notas longas (Am, F, C, G | Am, F, G, G)
  var MELODIA_C = [
    [0, 76, 2], [2, 81, 2],
    [4, 77, 2], [6, 81, 2],
    [8, 79, 2], [10, 84, 2],
    [12, 83, 2], [14, 79, 2],
    [16, 81, 2], [18, 76, 2],
    [20, 77, 1], [21, 79, 1], [22, 81, 2],
    [24, 79, 1], [25, 81, 1], [26, 83, 2],
    [28, 86, 1], [29, 83, 1], [30, 79, 1], [31, 74, 1]
  ];

  var BAIXO_A = [
    [0, 48, 1.5], [2, 55, 1.5],
    [4, 43, 1.5], [6, 50, 1.5],
    [8, 45, 1.5], [10, 52, 1.5],
    [12, 41, 1.5], [14, 48, 1.5],
    [16, 48, 1.5], [18, 55, 1.5],
    [20, 43, 1.5], [22, 50, 1.5],
    [24, 41, 1.5], [26, 48, 1.5],
    [28, 48, 1.5], [30, 43, 1.5]
  ];

  var BAIXO_B = [
    [0, 41, 1.5], [2, 48, 1.5],
    [4, 48, 1.5], [6, 55, 1.5],
    [8, 43, 1.5], [10, 50, 1.5],
    [12, 45, 1.5], [14, 52, 1.5],
    [16, 41, 1.5], [18, 48, 1.5],
    [20, 48, 1.5], [22, 55, 1.5],
    [24, 43, 1.5], [26, 50, 1.5],
    [28, 43, 1.5], [30, 50, 1.5]
  ];

  var BAIXO_C = [
    [0, 45, 1.5], [2, 52, 1.5],
    [4, 41, 1.5], [6, 48, 1.5],
    [8, 48, 1.5], [10, 55, 1.5],
    [12, 43, 1.5], [14, 50, 1.5],
    [16, 45, 1.5], [18, 52, 1.5],
    [20, 41, 1.5], [22, 48, 1.5],
    [24, 43, 1.5], [26, 50, 1.5],
    [28, 43, 1.5], [30, 50, 1.5]
  ];

  function desloca(secao, batidas) {
    return secao.map(function (n) { return [n[0] + batidas, n[1], n[2]]; });
  }

  // Forma da peça: A (0-31), B (32-63), A (64-95), C (96-127)
  var MELODIA = [].concat(
    MELODIA_A,
    desloca(MELODIA_B, 32),
    desloca(MELODIA_A, 64),
    desloca(MELODIA_C, 96)
  );
  var BAIXO = [].concat(
    BAIXO_A,
    desloca(BAIXO_B, 32),
    desloca(BAIXO_A, 64),
    desloca(BAIXO_C, 96)
  );

  // Volume geral da música (0 a 1). O jogo é o protagonista:
  // a trilha fica ao fundo, bem discreta.
  var VOLUME_MUSICA = 0.5;

  var ligada = localStorage.getItem('vb_musica') !== 'nao';
  var contexto = null;
  var mestre = null;
  var ruido = null;              // buffer de "chimbal"
  var inicioLoop = 0;
  var relogio = null;

  function freq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function garantirContexto() {
    if (contexto) return;
    contexto = new (window.AudioContext || window.webkitAudioContext)();

    mestre = contexto.createGain();
    mestre.gain.value = 0;
    mestre.connect(contexto.destination);

    // Meio segundo de ruído branco para os toques de chimbal.
    var amostras = Math.floor(contexto.sampleRate * 0.5);
    ruido = contexto.createBuffer(1, amostras, contexto.sampleRate);
    var dados = ruido.getChannelData(0);
    for (var i = 0; i < amostras; i++) dados[i] = Math.random() * 2 - 1;
  }

  function nota(quando, midi, duracao, tipo, volume, corte) {
    var osc = contexto.createOscillator();
    var ganho = contexto.createGain();
    var filtro = contexto.createBiquadFilter();
    osc.type = tipo;
    osc.frequency.value = freq(midi);
    filtro.type = 'lowpass';
    filtro.frequency.value = corte;
    ganho.gain.setValueAtTime(0.0001, quando);
    ganho.gain.exponentialRampToValueAtTime(volume, quando + 0.03);
    ganho.gain.setValueAtTime(volume, quando + duracao * 0.6);
    ganho.gain.exponentialRampToValueAtTime(0.0001, quando + duracao);
    osc.connect(filtro);
    filtro.connect(ganho);
    ganho.connect(mestre);
    osc.start(quando);
    osc.stop(quando + duracao + 0.05);
  }

  function chimbal(quando) {
    var fonte = contexto.createBufferSource();
    var ganho = contexto.createGain();
    var filtro = contexto.createBiquadFilter();
    fonte.buffer = ruido;
    filtro.type = 'highpass';
    filtro.frequency.value = 6500;
    ganho.gain.setValueAtTime(0.008, quando);
    ganho.gain.exponentialRampToValueAtTime(0.0001, quando + 0.06);
    fonte.connect(filtro);
    filtro.connect(ganho);
    ganho.connect(mestre);
    fonte.start(quando);
    fonte.stop(quando + 0.08);
  }

  function agendarLoop() {
    var t = inicioLoop;
    MELODIA.forEach(function (n) {
      nota(t + n[0] * BATIDA, n[1], n[2] * BATIDA, 'triangle', 0.045, 2000);
    });
    BAIXO.forEach(function (n) {
      nota(t + n[0] * BATIDA, n[1], n[2] * BATIDA, 'sine', 0.06, 500);
    });
    // Chimbal só nas seções animadas; o trecho calmo (batida 96+)
    // fica sem percussão para dar respiro à peça.
    for (var b = 0.5; b < 96; b += 1) {
      chimbal(t + b * BATIDA);
    }
    inicioLoop += LOOP_BATIDAS * BATIDA;
  }

  function tic() {
    // Agenda o próximo loop um pouco antes do atual acabar.
    if (contexto.currentTime > inicioLoop - 1.5) agendarLoop();
  }

  function comecar() {
    garantirContexto();
    if (contexto.state === 'suspended') contexto.resume();
    if (relogio) return;
    // Recria o canal mestre: notas antigas ainda agendadas ficam
    // presas no canal desconectado e não tocam por cima do novo loop.
    mestre.disconnect();
    mestre = contexto.createGain();
    mestre.gain.setValueAtTime(0.0001, contexto.currentTime);
    mestre.gain.exponentialRampToValueAtTime(VOLUME_MUSICA, contexto.currentTime + 1.2);
    mestre.connect(contexto.destination);
    inicioLoop = contexto.currentTime + 0.1;
    agendarLoop();
    relogio = setInterval(tic, 400);
  }

  function parar() {
    if (!contexto || !relogio) return;
    clearInterval(relogio);
    relogio = null;
    mestre.gain.cancelScheduledValues(contexto.currentTime);
    mestre.gain.setValueAtTime(mestre.gain.value, contexto.currentTime);
    mestre.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + 0.4);
  }

  // O navegador só libera áudio depois de um toque ou tecla;
  // este ouvinte liga a música na primeira interação.
  function aoInteragir() {
    if (ligada && !relogio) {
      try { comecar(); } catch (e) { /* sem áudio, o jogo segue */ }
    }
  }
  document.addEventListener('pointerdown', aoInteragir);
  document.addEventListener('keydown', aoInteragir);

  window.Musica = {
    ligada: function () { return ligada; },
    alternar: function () {
      ligada = !ligada;
      localStorage.setItem('vb_musica', ligada ? 'sim' : 'nao');
      try {
        if (ligada) comecar(); else parar();
      } catch (e) { /* sem áudio, o jogo segue */ }
      return ligada;
    }
  };
})();
