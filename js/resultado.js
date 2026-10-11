/* ============================================================
   Super Bandeiras! — Tela de resultado (todos os modos)
   Coreografia: medalha cai quicando → estrelas acendem uma a
   uma → pontos sobem contando → carimbos novos batem na tela.
   ============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  var medalhaEl     = $('medalha');
  var tituloEl      = $('titulo-fim');
  var estrelasBox   = $('estrelas');
  var estrelasEl    = estrelasBox.children;
  var pontosEl      = $('pontos-final');
  var resumoEl      = $('placar-final');
  var recordeEl     = $('novo-recorde');
  var carimbosBox   = $('carimbos-novos');
  var carimbosTexto = $('carimbos-novos-texto');
  var carimbosLista = $('carimbos-novos-lista');
  var btnRepetir    = $('btn-de-novo');
  var btnVoltar     = $('btn-mudar');

  var timers = [];
  var acoes = {};

  function depois(ms, fn) { timers.push(setTimeout(fn, ms)); }

  function formatarPontos(n) { return n.toLocaleString('pt-BR'); }

  // Medalha, título e estrelas pela fração de acertos.
  function avaliar(acertos, total) {
    var fracao = total ? acertos / total : 0;
    var estrelas = fracao >= 0.9 ? 3 : fracao >= 0.6 ? 2 : fracao >= 0.3 ? 1 : 0;
    if (acertos === total) return { medalha: 'trofeu', titulo: 'PERFEITO! Você é um campeão!', estrelas: 3 };
    if (fracao >= 0.7) return { medalha: 'medalha', titulo: 'Incrível, grande explorador!', estrelas: estrelas };
    if (fracao >= 0.5) return { medalha: 'medalha-prata', titulo: 'Muito bem, viajante!', estrelas: estrelas };
    if (fracao >= 0.3) return { medalha: 'medalha-bronze', titulo: 'Boa! Continue explorando!', estrelas: estrelas };
    return { medalha: 'broto', titulo: 'Não desista! Tente de novo!', estrelas: estrelas };
  }

  function mostrarCarimbos(codigos, inicio) {
    carimbosBox.hidden = !codigos.length;
    carimbosLista.innerHTML = '';
    if (!codigos.length) return inicio;
    carimbosTexto.textContent = codigos.length === 1
      ? '+1 carimbo novo no passaporte!'
      : '+' + codigos.length + ' carimbos novos no passaporte!';
    var mostrar = codigos.slice(0, 10);
    mostrar.forEach(function (codigo, i) {
      var pais = PAISES.filter(function (p) { return p.codigo === codigo; })[0];
      var selo = document.createElement('span');
      selo.className = 'mini-carimbo';
      selo.style.setProperty('--giro', ((i % 3) - 1) * 7 + 'deg');
      var img = document.createElement('img');
      img.src = 'bandeiras/' + codigo + '.png';
      img.alt = pais.nome;
      img.title = pais.nome;
      selo.appendChild(img);
      carimbosLista.appendChild(selo);
      depois(inicio + i * 180, function () {
        selo.classList.add('batido');
        Sons.tocar('carimbo');
      });
    });
    return inicio + mostrar.length * 180;
  }

  // opcoes: { medalha, titulo, estrelas, pontos?, resumo, novoRecorde,
  //           novosCarimbos, textoRepetir, aoRepetir, textoVoltar, aoVoltar }
  // Sair antes do fim da coreografia não deixa estrelas e sons
  // tocando na tela seguinte.
  function cancelarCoreografia() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function mostrar(opcoes) {
    cancelarCoreografia();
    acoes = { repetir: opcoes.aoRepetir, voltar: opcoes.aoVoltar };

    medalhaEl.innerHTML = Icone.html(opcoes.medalha);
    tituloEl.textContent = opcoes.titulo;
    resumoEl.textContent = opcoes.resumo;
    recordeEl.hidden = true;
    btnRepetir.textContent = opcoes.textoRepetir || 'Jogar de novo';
    btnVoltar.textContent = opcoes.textoVoltar || 'Voltar';
    estrelasBox.setAttribute('aria-label', opcoes.estrelas + ' de 3 estrelas');
    for (var i = 0; i < estrelasEl.length; i++) estrelasEl[i].className = 'estrela';

    var temPontos = typeof opcoes.pontos === 'number';
    pontosEl.hidden = !temPontos;
    pontosEl.textContent = '0';

    Telas.mostrar('tela-fim', {
      aoTrocar: function () {
        Efeitos.reanimar(medalhaEl, 'cair');
        var t = 600;
        for (var e = 0; e < opcoes.estrelas; e++) {
          (function (indice) {
            depois(t + indice * 380, function () {
              estrelasEl[indice].className = 'estrela acesa';
              Sons.tocar('estrela', indice);
            });
          })(e);
        }
        t += opcoes.estrelas * 380 + 150;
        if (temPontos) {
          depois(t, function () {
            Efeitos.contar(pontosEl, 0, opcoes.pontos, 1100, function (n) { return formatarPontos(n) + ' pts'; }, function () {
              Sons.tocar('moeda');
            });
          });
          t += 1200;
        }
        depois(t, function () {
          recordeEl.hidden = !opcoes.novoRecorde;
          if (opcoes.novoRecorde) Efeitos.reanimar(recordeEl, 'pular');
          if (opcoes.estrelas >= 2 || opcoes.novoRecorde) {
            Sons.tocar('fanfarra');
            Efeitos.confete();
          } else {
            Sons.tocar('encorajar');
          }
        });
        mostrarCarimbos(opcoes.novosCarimbos || [], t + 700);
      }
    });
  }

  btnRepetir.addEventListener('click', function () {
    cancelarCoreografia();
    Sons.tocar('clique');
    if (acoes.repetir) acoes.repetir();
  });
  btnVoltar.addEventListener('click', function () {
    cancelarCoreografia();
    Sons.tocar('clique');
    if (acoes.voltar) acoes.voltar();
  });

  window.Resultado = {
    avaliar: avaliar,
    mostrar: mostrar
  };
})();
