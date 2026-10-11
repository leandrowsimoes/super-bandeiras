/* ============================================================
   Super Bandeiras! — Relâmpago (verdadeiro ou falso)
   "Esta é a bandeira de X?" — Sim ou Não, contra o relógio.
   Pequeno Explorador ganha mais tempo e ouve a pergunta.
   ============================================================ */

(function () {
  'use strict';

  var DURACAO = 45;
  var DURACAO_PEQUENO = 60;
  var ESPERA_ACERTO = 450;
  var ESPERA_ERRO = 1100;

  function $(id) { return document.getElementById(id); }
  var imgEl      = $('relampago-bandeira');
  var nomeEl     = $('relampago-nome');
  var avisoEl    = $('relampago-aviso');
  var placarEl   = $('relampago-placar');
  var tempoEl    = $('relampago-tempo');
  var barraFill  = $('relampago-barra-fill');
  var cartaEl    = $('relampago-carta');
  var btnSim     = $('btn-sim');
  var btnNao     = $('btn-nao');

  var estado = null;

  function sortear(lista) { return lista[Math.floor(Math.random() * lista.length)]; }

  function iniciar() {
    var duracao = Progresso.pequeno() ? DURACAO_PEQUENO : DURACAO;
    estado = {
      duracao: duracao,
      fim: 0,
      pontos: 0,
      atual: null,
      verdade: false,
      travado: true,
      relogio: null,
      ultimoSegundo: duracao,
      pool: PAISES.filter(function (p) { return p.nivel !== 'impossivel'; })
    };
    Icone.comTexto(placarEl, 'raio', '0', 'ico-texto');
    Icone.comTexto(tempoEl, 'relogio', String(duracao), 'ico-texto');
    barraFill.style.width = '100%';
    Telas.mostrar('tela-relampago', {
      aoTrocar: function () {
        estado.fim = performance.now() + duracao * 1000;
        estado.relogio = setInterval(tique, 100);
        proxima();
      }
    });
  }

  function tique() {
    var restante = Math.max(0, (estado.fim - performance.now()) / 1000);
    var segundos = Math.ceil(restante);
    Icone.comTexto(tempoEl, 'relogio', String(segundos), 'ico-texto');
    barraFill.style.width = (restante / estado.duracao * 100) + '%';
    barraFill.classList.toggle('acabando', restante <= 5);
    if (segundos < estado.ultimoSegundo) {
      estado.ultimoSegundo = segundos;
      if (segundos <= 5 && segundos > 0) Sons.tocar('tique');
    }
    if (restante <= 0) terminar();
  }

  function proxima() {
    var pais = sortear(estado.pool);
    // Metade das vezes o nome é o certo; na outra metade, um impostor.
    var verdade = Math.random() < 0.5;
    var nomeMostrado = pais;
    if (!verdade) {
      do { nomeMostrado = sortear(estado.pool); } while (nomeMostrado.codigo === pais.codigo);
    }
    estado.atual = pais;
    estado.verdade = verdade;
    imgEl.src = 'bandeiras/' + pais.codigo + '.png';
    imgEl.alt = 'Bandeira misteriosa';
    nomeEl.textContent = nomeMostrado.nome;
    avisoEl.innerHTML = '&nbsp;';
    cartaEl.classList.remove('certo', 'errado');
    Efeitos.reanimar(cartaEl, 'entrar-relampago');
    estado.travado = false;
    if (Progresso.pequeno()) Voz.falar('É a bandeira de ' + nomeMostrado.nome + '?');
  }

  function responder(disseSim) {
    if (!estado || estado.travado) return;
    estado.travado = true;
    Voz.calar();
    var acertou = disseSim === estado.verdade;
    if (acertou) {
      estado.pontos++;
      Icone.comTexto(placarEl, 'raio', String(estado.pontos), 'ico-texto');
      Efeitos.reanimar(placarEl, 'pulsar');
      cartaEl.classList.add('certo');
      Sons.tocar('par');
      avisoEl.textContent = 'Isso!';
    } else {
      cartaEl.classList.add('errado');
      Efeitos.reanimar(cartaEl, 'tremer');
      Sons.tocar('erro');
      avisoEl.textContent = estado.verdade ? 'Era mesmo ' + estado.atual.nome + '!' : 'Essa é ' + estado.atual.nome + '.';
    }
    setTimeout(function () {
      if (estado && estado.relogio) proxima();
    }, acertou ? ESPERA_ACERTO : ESPERA_ERRO);
  }

  function parar() {
    if (estado && estado.relogio) clearInterval(estado.relogio);
    if (estado) estado.relogio = null;
  }

  function terminar() {
    parar();
    estado.travado = true;
    var pontos = estado.pontos;
    var estrelas = pontos >= 15 ? 3 : pontos >= 10 ? 2 : pontos >= 5 ? 1 : 0;
    var recorde = Progresso.salvarRecorde('vb_relampago', pontos);
    Resultado.mostrar({
      medalha: 'raio',
      titulo: pontos >= 10 ? 'Rápido como um raio!' : 'Tempo esgotado!',
      estrelas: estrelas,
      resumo: 'Você acertou ' + pontos + (pontos === 1 ? ' vez' : ' vezes') + ' em ' + estado.duracao + ' segundos.',
      novoRecorde: recorde,
      novosCarimbos: [],
      textoRepetir: 'Jogar de novo',
      aoRepetir: iniciar,
      textoVoltar: 'Outros minijogos',
      aoVoltar: function () { window.Minijogos.mostrar(); }
    });
  }

  btnSim.addEventListener('click', function () { responder(true); });
  btnNao.addEventListener('click', function () { responder(false); });

  document.addEventListener('keydown', function (evento) {
    if (Telas.atual() !== 'tela-relampago') return;
    var tecla = evento.key.toLowerCase();
    if (tecla === '1' || tecla === 's' || tecla === 'arrowleft') responder(true);
    if (tecla === '2' || tecla === 'n' || tecla === 'arrowright') responder(false);
  });

  $('btn-relampago-voltar').addEventListener('click', function () {
    Sons.tocar('clique');
    Voz.calar();
    parar();
    window.Minijogos.mostrar();
  });

  window.Relampago = { iniciar: iniciar };
})();
