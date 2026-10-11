/* ============================================================
   Super Bandeiras! — Mapa de Aventura (campanha)
   5 continentes × 3 fases. Os países de cada continente são
   ordenados por dificuldade e divididos em terços. Passar uma
   fase (≥ 50 % de acertos) libera a próxima.
   ============================================================ */

(function () {
  'use strict';

  var FASES_POR_CONTINENTE = 3;
  var PERGUNTAS_POR_FASE = 8;
  var ORDEM_NIVEL = { facil: 0, medio: 1, dificil: 2, impossivel: 3 };
  // A fase do meio usa o modo "Ache a bandeira" para variar a brincadeira.
  var MODO_DA_FASE = ['pais', 'bandeira', 'pais'];

  var listaEl = document.getElementById('mapa-lista');
  var totalEstrelasEl = document.getElementById('mapa-estrelas');
  var recemLiberada = null;   // id da fase que acabou de ser liberada (para animar)

  function idFase(continente, fase) { return continente + '-' + (fase + 1); }

  function paisesDo(continente) {
    return PAISES
      .map(function (p, i) { return { pais: p, i: i }; })
      .filter(function (x) { return INFO_PAISES[x.pais.codigo].continente === continente; })
      .sort(function (a, b) { return (ORDEM_NIVEL[a.pais.nivel] - ORDEM_NIVEL[b.pais.nivel]) || (a.i - b.i); })
      .map(function (x) { return x.pais; });
  }

  function paisesDaFase(continente, fase) {
    var todos = paisesDo(continente);
    var tamanho = Math.ceil(todos.length / FASES_POR_CONTINENTE);
    return todos.slice(fase * tamanho, (fase + 1) * tamanho);
  }

  // Lista linear de todas as fases, na ordem da aventura.
  function todasAsFases() {
    var fases = [];
    CONTINENTES.forEach(function (c) {
      for (var f = 0; f < FASES_POR_CONTINENTE; f++) fases.push({ continente: c, fase: f, id: idFase(c.id, f) });
    });
    return fases;
  }

  function liberada(indiceLinear, fases) {
    return indiceLinear === 0 || Progresso.estrelasFase(fases[indiceLinear - 1].id) > 0;
  }

  function estrelasPorFracao(fracao) {
    return fracao >= 0.9 ? 3 : fracao >= 0.7 ? 2 : fracao >= 0.5 ? 1 : 0;
  }

  function desenharEstrelas(elemento, n) {
    for (var i = 0; i < 3; i++) {
      var estrela = document.createElement('span');
      estrela.textContent = '★';
      if (i < n) estrela.className = 'ganha';
      elemento.appendChild(estrela);
    }
  }

  function desenhar() {
    var fases = todasAsFases();
    var total = 0;
    var atual = -1;   // primeira fase liberada ainda sem estrela: onde o avião fica
    listaEl.innerHTML = '';

    CONTINENTES.forEach(function (continente, c) {
      var bloco = document.createElement('section');
      bloco.className = 'continente-mapa continente-' + continente.id;
      var liberadoContinente = liberada(c * FASES_POR_CONTINENTE, fases);
      bloco.classList.toggle('trancado', !liberadoContinente);

      var titulo = document.createElement('h3');
      titulo.innerHTML = '<span class="continente-emoji"></span><span class="continente-nome"></span>';
      titulo.querySelector('.continente-emoji').innerHTML = Icone.html(liberadoContinente ? continente.id : 'cadeado');
      titulo.querySelector('.continente-nome').textContent = continente.nome;
      bloco.appendChild(titulo);

      var trilha = document.createElement('div');
      trilha.className = 'trilha';
      for (var f = 0; f < FASES_POR_CONTINENTE; f++) {
        var linear = c * FASES_POR_CONTINENTE + f;
        var id = fases[linear].id;
        var estrelas = Progresso.estrelasFase(id);
        var aberta = liberada(linear, fases);
        total += estrelas;
        if (aberta && estrelas === 0 && atual === -1) atual = linear;

        var no = document.createElement('button');
        no.type = 'button';
        no.className = 'no-fase';
        no.disabled = !aberta;
        no.setAttribute('data-fase', id);
        no.setAttribute('aria-label', continente.nome + ', fase ' + (f + 1) + (aberta ? ', ' + estrelas + ' estrelas' : ', trancada'));
        no.innerHTML = '<span class="no-numero"></span><span class="no-estrelas"></span>';
        if (aberta) no.querySelector('.no-numero').textContent = String(f + 1);
        else no.querySelector('.no-numero').innerHTML = Icone.html('cadeado');
        if (aberta) desenharEstrelas(no.querySelector('.no-estrelas'), estrelas);
        if (id === recemLiberada) no.classList.add('liberando');
        (function (cont, fase) {
          no.addEventListener('click', function () { iniciarFase(cont, fase); });
        })(continente, f);
        trilha.appendChild(no);
      }
      bloco.appendChild(trilha);
      listaEl.appendChild(bloco);
    });

    if (atual !== -1) {
      var noAtual = listaEl.querySelector('[data-fase="' + fases[atual].id + '"]');
      noAtual.classList.add('atual');
      var aviao = document.createElement('span');
      aviao.className = 'aviao-mapa';
      aviao.setAttribute('aria-hidden', 'true');
      aviao.innerHTML = Icone.html('aviao');
      noAtual.appendChild(aviao);
    }
    totalEstrelasEl.innerHTML = '<svg class="ico ico-texto" aria-hidden="true"><use href="#i-estrela"/></svg> ' + total + ' / ' + fases.length * 3;
  }

  function mostrar() {
    Telas.mostrar('tela-mapa', {
      aoTrocar: function () {
        desenhar();
        if (recemLiberada) {
          var no = listaEl.querySelector('[data-fase="' + recemLiberada + '"]');
          recemLiberada = null;
          setTimeout(function () {
            Sons.tocar('desbloquear');
            if (no) {
              no.scrollIntoView({ block: 'center', behavior: Efeitos.movimentoReduzido() ? 'auto' : 'smooth' });
              setTimeout(function () { Efeitos.explodirDe(no, { quantidade: 30 }); }, 500);
            }
          }, 500);
        } else {
          var atual = listaEl.querySelector('.no-fase.atual');
          if (atual) atual.scrollIntoView({ block: 'center' });
        }
      }
    });
  }

  function iniciarFase(continente, fase) {
    Sons.tocar('clique');
    var id = idFase(continente.id, fase);
    var perguntas = Quiz.embaralhar(paisesDaFase(continente.id, fase)).slice(0, PERGUNTAS_POR_FASE);
    Quiz.iniciar({
      perguntas: perguntas,
      grupo: paisesDo(continente.id),
      modo: MODO_DA_FASE[fase],
      titulo: continente.nome + ' · ' + (fase + 1),
      icone: continente.id,
      aoSair: mostrar,
      aoTerminar: function (r) { terminarFase(continente, fase, id, r); }
    });
  }

  function terminarFase(continente, fase, id, r) {
    var fases = todasAsFases();
    var linear = fases.map(function (x) { return x.id; }).indexOf(id);
    var proxima = fases[linear + 1];
    var proximaEstavaTrancada = proxima && !liberada(linear + 1, fases);

    var estrelas = estrelasPorFracao(r.acertos / r.total);
    Progresso.salvarFase(id, estrelas);
    var passou = estrelas > 0;
    if (passou && proximaEstavaTrancada) recemLiberada = proxima.id;
    if (passou && fase === FASES_POR_CONTINENTE - 1) Progresso.desbloquear('continente-' + continente.id);

    var avaliacao = Resultado.avaliar(r.acertos, r.total);
    var resumo = 'Você acertou ' + r.acertos + ' de ' + r.total + ' e fez ' + r.pontos.toLocaleString('pt-BR') + ' pontos. ';
    if (!passou) {
      resumo += 'Acerte pelo menos metade para passar de fase!';
    } else if (proximaEstavaTrancada) {
      resumo += proxima.continente.id === continente.id
        ? 'Fase ' + (proxima.fase + 1) + ' liberada!'
        : 'Novo continente liberado: ' + proxima.continente.nome + '!';
    }

    Resultado.mostrar({
      medalha: passou ? avaliacao.medalha : '🌱',
      titulo: passou ? avaliacao.titulo : 'Quase lá! Tente de novo!',
      estrelas: estrelas,
      pontos: r.pontos,
      resumo: resumo,
      novoRecorde: false,
      novosCarimbos: r.novosCarimbos,
      textoRepetir: 'Jogar de novo',
      aoRepetir: function () { iniciarFase(continente, fase); },
      textoVoltar: 'Voltar ao mapa',
      aoVoltar: mostrar
    });
  }

  window.Mapa = { mostrar: mostrar };
})();
