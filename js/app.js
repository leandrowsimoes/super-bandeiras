/* ============================================================
   Super Bandeiras! — Aplicativo
   Liga a tela inicial, o Quiz Livre (níveis), os minijogos,
   os botões de som/música, o Pequeno Explorador e o atalho
   index.html?nivel=<nivel>.
   ============================================================ */

(function () {
  'use strict';

  var TOTAL_PERGUNTAS = 10;
  var NIVEIS = {
    facil:      { nome: 'Fácil',      icone: 'broto' },
    medio:      { nome: 'Médio',      icone: 'globo' },
    dificil:    { nome: 'Difícil',    icone: 'vulcao' },
    impossivel: { nome: 'Impossível', icone: 'alien' }
  };

  function $(id) { return document.getElementById(id); }
  var modoQuiz = localStorage.getItem('vb_modo') === 'bandeira' ? 'bandeira' : 'pais';

  function formatarPontos(n) { return n.toLocaleString('pt-BR'); }

  function chaveRecorde(nivel, modo) {
    // A chave do modo "pais" é a mesma da versão anterior, preservando recordes.
    return modo === 'bandeira' ? 'vb_pontos_bandeira_' + nivel : 'vb_pontos_' + nivel;
  }

  // ---------- Som e música ----------
  var btnSom = $('btn-som');
  var btnMusica = $('btn-musica');

  function atualizarBotaoSom() {
    btnSom.classList.toggle('mudo', !Sons.ligado());
    btnSom.setAttribute('aria-label', Sons.ligado() ? 'Desligar os efeitos e a voz' : 'Ligar os efeitos e a voz');
  }

  function atualizarBotaoMusica() {
    btnMusica.classList.toggle('mudo', !Musica.ligada());
    btnMusica.setAttribute('aria-label', Musica.ligada() ? 'Desligar a música' : 'Ligar a música');
  }

  btnSom.addEventListener('click', function () {
    Sons.alternar();
    if (!Sons.ligado()) Voz.calar();
    atualizarBotaoSom();
    Sons.tocar('clique');
  });

  btnMusica.addEventListener('click', function () {
    Musica.alternar();
    atualizarBotaoMusica();
  });

  // "Pop" suave ao passar o mouse em qualquer botão grande.
  document.addEventListener('mouseover', function (evento) {
    var botao = evento.target.closest && evento.target.closest('button');
    if (botao && !botao.disabled && !botao.contains(evento.relatedTarget)) Sons.tocar('hover');
  });

  // ---------- Pequeno Explorador ----------
  var btnPequeno = $('btn-pequeno');

  function atualizarPequeno() {
    var ligado = Progresso.pequeno();
    btnPequeno.setAttribute('aria-checked', ligado ? 'true' : 'false');
    btnPequeno.querySelector('.interruptor-estado').textContent = ligado ? 'Ligado' : 'Desligado';
  }

  btnPequeno.addEventListener('click', function () {
    Progresso.definirPequeno(!Progresso.pequeno());
    atualizarPequeno();
    Sons.tocar(Progresso.pequeno() ? 'boing' : 'clique');
    Voz.falar(Progresso.pequeno()
      ? 'Modo Pequeno Explorador ligado! Eu vou ler tudo para você.'
      : 'Modo Pequeno Explorador desligado.');
  });

  // ---------- Tela inicial ----------
  var destinos = {
    mapa: function () { Mapa.mostrar(); },
    niveis: mostrarNiveis,
    passaporte: function () { Passaporte.mostrar(); },
    minijogos: mostrarMinijogos
  };

  var botoesModo = document.querySelectorAll('[data-ir]');
  for (var i = 0; i < botoesModo.length; i++) {
    botoesModo[i].addEventListener('click', function () {
      Sons.tocar('clique');
      destinos[this.getAttribute('data-ir')]();
    });
  }

  function atualizarResumoInicio() {
    $('resumo-carimbos').textContent = Progresso.carimbos().length + ' de ' + PAISES.length + ' carimbos';
  }

  function mostrarInicio() {
    atualizarResumoInicio();
    Telas.mostrar('tela-inicio');
  }

  // ---------- Quiz Livre (níveis) ----------
  function atualizarNiveis() {
    var botoes = document.querySelectorAll('[data-recorde]');
    for (var b = 0; b < botoes.length; b++) {
      var recorde = Progresso.lerNumero(chaveRecorde(botoes[b].getAttribute('data-recorde'), modoQuiz));
      if (recorde === null) botoes[b].textContent = '';
      else Icone.comTexto(botoes[b], 'trofeu', formatarPontos(recorde), 'ico-texto');
    }
    var seletores = document.querySelectorAll('[data-modo]');
    for (var s = 0; s < seletores.length; s++) {
      var ativo = seletores[s].getAttribute('data-modo') === modoQuiz;
      seletores[s].classList.toggle('ativo', ativo);
      seletores[s].setAttribute('aria-pressed', ativo ? 'true' : 'false');
    }
  }

  function mostrarNiveis() {
    atualizarNiveis();
    Telas.mostrar('tela-niveis');
  }

  var seletoresModo = document.querySelectorAll('[data-modo]');
  for (var m = 0; m < seletoresModo.length; m++) {
    seletoresModo[m].addEventListener('click', function () {
      Sons.tocar('clique');
      modoQuiz = this.getAttribute('data-modo');
      localStorage.setItem('vb_modo', modoQuiz);
      atualizarNiveis();
    });
  }

  function jogarNivel(nivel, instantaneo) {
    var grupo = PAISES.filter(function (p) { return p.nivel === nivel; });
    var modo = modoQuiz;
    Quiz.iniciar({
      perguntas: Quiz.embaralhar(grupo).slice(0, TOTAL_PERGUNTAS),
      grupo: grupo,
      modo: modo,
      titulo: NIVEIS[nivel].nome,
      icone: NIVEIS[nivel].icone,
      instantaneo: instantaneo,
      aoSair: mostrarNiveis,
      aoTerminar: function (r) {
        var avaliacao = Resultado.avaliar(r.acertos, r.total);
        Resultado.mostrar({
          medalha: avaliacao.medalha,
          titulo: avaliacao.titulo,
          estrelas: avaliacao.estrelas,
          pontos: r.pontos,
          resumo: 'Você fez ' + formatarPontos(r.pontos) + ' pontos e acertou ' + r.acertos + ' de ' + r.total +
            ' bandeiras no nível ' + NIVEIS[nivel].nome + '.',
          novoRecorde: Progresso.salvarRecorde(chaveRecorde(nivel, modo), r.pontos),
          novosCarimbos: r.novosCarimbos,
          textoRepetir: 'Jogar de novo',
          aoRepetir: function () { jogarNivel(nivel); },
          textoVoltar: 'Mudar nível',
          aoVoltar: mostrarNiveis
        });
      }
    });
  }

  var botoesNivel = document.querySelectorAll('.btn-nivel');
  for (var n = 0; n < botoesNivel.length; n++) {
    botoesNivel[n].addEventListener('click', function () {
      Sons.tocar('clique');
      jogarNivel(this.getAttribute('data-nivel'));
    });
  }

  // ---------- Minijogos ----------
  function mostrarMinijogos() {
    var memoria = Progresso.lerNumero('vb_memoria_' + (Progresso.pequeno() ? 4 : 6));
    var relampago = Progresso.lerNumero('vb_relampago');
    if (memoria === null) $('recorde-memoria').textContent = '';
    else Icone.comTexto($('recorde-memoria'), 'trofeu', memoria + ' jogadas', 'ico-texto');
    if (relampago === null) $('recorde-relampago').textContent = '';
    else Icone.comTexto($('recorde-relampago'), 'trofeu', relampago + ' acertos', 'ico-texto');
    Telas.mostrar('tela-minijogos');
  }

  $('btn-memoria').addEventListener('click', function () { Sons.tocar('clique'); Memoria.iniciar(); });
  $('btn-relampago').addEventListener('click', function () { Sons.tocar('clique'); Relampago.iniciar(); });

  var voltarInicio = document.querySelectorAll('[data-voltar-inicio]');
  for (var v = 0; v < voltarInicio.length; v++) {
    voltarInicio[v].addEventListener('click', function () {
      Sons.tocar('clique');
      mostrarInicio();
    });
  }

  window.Minijogos = { mostrar: mostrarMinijogos };

  // ---------- Início ----------
  atualizarBotaoSom();
  atualizarBotaoMusica();
  atualizarPequeno();
  atualizarResumoInicio();

  // Atalho: abrir index.html?nivel=facil (ou medio, dificil, impossivel)
  // começa o jogo direto nesse nível.
  var nivelUrl = new URLSearchParams(window.location.search).get('nivel');
  if (nivelUrl && NIVEIS[nivelUrl]) {
    jogarNivel(nivelUrl, true);
  } else {
    Telas.mostrar('tela-inicio', { instantaneo: true });
  }
})();
