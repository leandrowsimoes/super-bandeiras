/* ============================================================
   Super Bandeiras! — Jogo da Memória
   Pares bandeira ↔ nome. O nome é falado ao virar a carta.
   Pequeno Explorador joga com 4 pares; os demais, com 6.
   ============================================================ */

(function () {
  'use strict';

  var TEMPO_DESVIRAR = 900; // ms que um par errado fica à mostra

  function $(id) { return document.getElementById(id); }
  var gradeEl   = $('memoria-grade');
  var jogadasEl = $('memoria-jogadas');
  var paresEl   = $('memoria-pares');

  var estado = null;

  function criarCarta(pais, tipo) {
    var carta = document.createElement('button');
    carta.type = 'button';
    carta.className = 'carta-memoria entrar-cascata';
    carta.setAttribute('data-codigo', pais.codigo);
    carta.setAttribute('aria-label', 'Carta virada para baixo');
    var interior = document.createElement('span');
    interior.className = 'carta-interior';
    var verso = document.createElement('span');
    verso.className = 'carta-verso';
    verso.textContent = '?';
    var frente = document.createElement('span');
    frente.className = 'carta-frente';
    if (tipo === 'bandeira') {
      var img = document.createElement('img');
      img.src = 'bandeiras/' + pais.codigo + '.png';
      img.alt = '';
      frente.appendChild(img);
    } else {
      frente.classList.add('frente-nome');
      frente.textContent = pais.nome;
    }
    interior.appendChild(verso);
    interior.appendChild(frente);
    carta.appendChild(interior);
    carta.addEventListener('click', function () { virar(carta, pais, tipo); });
    return carta;
  }

  function atualizarContadores() {
    jogadasEl.textContent = '👆 ' + estado.jogadas;
    jogadasEl.setAttribute('aria-label', estado.jogadas + (estado.jogadas === 1 ? ' jogada' : ' jogadas'));
    paresEl.textContent = '✅ ' + estado.achados + '/' + estado.pares;
    paresEl.setAttribute('aria-label', estado.achados + ' de ' + estado.pares + ' pares');
  }

  function iniciar() {
    var pares = Progresso.pequeno() ? 4 : 6;
    var candidatos = PAISES.filter(function (p) { return p.nivel === 'facil' || p.nivel === 'medio'; });
    var escolhidos = Quiz.embaralhar(candidatos).slice(0, pares);
    estado = { pares: pares, achados: 0, jogadas: 0, abertas: [], travado: false };

    var cartas = [];
    escolhidos.forEach(function (pais) {
      cartas.push(criarCarta(pais, 'bandeira'), criarCarta(pais, 'nome'));
    });
    gradeEl.innerHTML = '';
    gradeEl.classList.toggle('grade-pequena', pares === 4);
    Quiz.embaralhar(cartas).forEach(function (carta, i) {
      carta.style.animationDelay = (i * 45) + 'ms';
      gradeEl.appendChild(carta);
    });
    atualizarContadores();
    Telas.mostrar('tela-memoria');
  }

  function virar(carta, pais, tipo) {
    if (estado.travado || carta.classList.contains('virada')) return;
    carta.classList.add('virada');
    carta.setAttribute('aria-label', tipo === 'bandeira' ? 'Bandeira de ' + pais.nome : pais.nome);
    Sons.tocar('virar');
    Voz.falar(pais.nome);
    estado.abertas.push(carta);
    if (estado.abertas.length < 2) return;

    estado.jogadas++;
    var a = estado.abertas[0];
    var b = estado.abertas[1];
    estado.abertas = [];
    if (a.getAttribute('data-codigo') === b.getAttribute('data-codigo')) {
      estado.achados++;
      [a, b].forEach(function (c) {
        c.classList.add('achada');
        c.disabled = true;
        Efeitos.explodirDe(c, { quantidade: 14 });
      });
      Sons.tocar('par');
      if (estado.achados === estado.pares) setTimeout(terminar, 900);
    } else {
      estado.travado = true;
      setTimeout(function () {
        [a, b].forEach(function (c) {
          c.classList.remove('virada');
          c.setAttribute('aria-label', 'Carta virada para baixo');
        });
        estado.travado = false;
      }, TEMPO_DESVIRAR);
    }
    atualizarContadores();
  }

  function terminar() {
    // A criança pode ter saído do jogo durante a pausa após o último par.
    if (Telas.atual() !== 'tela-memoria') return;
    var jogadas = estado.jogadas;
    var pares = estado.pares;
    var estrelas = jogadas <= pares * 1.5 ? 3 : jogadas <= pares * 2.2 ? 2 : 1;
    var recorde = Progresso.salvarRecorde('vb_memoria_' + pares, jogadas, true);
    Progresso.desbloquear('memoria');
    Resultado.mostrar({
      medalha: estrelas === 3 ? '🧠' : estrelas === 2 ? '🥇' : '🥈',
      titulo: estrelas === 3 ? 'Memória de elefante!' : 'Achou todos os pares!',
      estrelas: estrelas,
      resumo: 'Você achou os ' + pares + ' pares em ' + jogadas + ' jogadas.',
      novoRecorde: recorde,
      novosCarimbos: [],
      textoRepetir: 'Jogar de novo',
      aoRepetir: iniciar,
      textoVoltar: 'Outros minijogos',
      aoVoltar: function () { window.Minijogos.mostrar(); }
    });
  }

  $('btn-memoria-voltar').addEventListener('click', function () {
    Sons.tocar('clique');
    Voz.calar();
    window.Minijogos.mostrar();
  });

  window.Memoria = { iniciar: iniciar };
})();
