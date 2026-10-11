/* ============================================================
   Super Bandeiras! — Passaporte do Explorador
   Álbum de carimbos por continente (todo acerto carimba) e a
   página de conquistas. Tocar num carimbo abre o cartão do país.
   ============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  var conteudoEl   = $('passaporte-conteudo');
  var contagemEl   = $('passaporte-contagem');
  var barraEl      = $('passaporte-barra-fill');
  var abas         = document.querySelectorAll('.aba-passaporte');
  var cartaoFundo  = $('cartao-pais');
  var paisAberto   = null;
  var abaAtual     = 'carimbos';

  function criar(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function desenharCarimbos() {
    var obtidos = Progresso.carimbos();
    CONTINENTES.forEach(function (continente) {
      var paises = PAISES.filter(function (p) { return INFO_PAISES[p.codigo].continente === continente.id; });
      var quantos = paises.filter(function (p) { return obtidos.indexOf(p.codigo) !== -1; }).length;

      var pagina = criar('section', 'pagina-passaporte continente-' + continente.id);
      var titulo = criar('h3', null, continente.emoji + ' ' + continente.nome + ' ');
      titulo.appendChild(criar('small', null, quantos + ' de ' + paises.length));
      pagina.appendChild(titulo);

      var grade = criar('div', 'grade-carimbos');
      paises.forEach(function (pais, i) {
        var tem = obtidos.indexOf(pais.codigo) !== -1;
        var selo = criar('button', 'carimbo-passaporte' + (tem ? ' obtido' : ''));
        selo.type = 'button';
        selo.style.setProperty('--giro', ((i * 37) % 11 - 5) + 'deg');
        if (tem) {
          var img = criar('img');
          img.src = 'bandeiras/' + pais.codigo + '.png';
          img.alt = '';
          img.loading = 'lazy';
          selo.appendChild(img);
          selo.appendChild(criar('span', 'carimbo-nome', pais.nome));
          selo.setAttribute('aria-label', pais.nome);
          selo.addEventListener('click', function () { abrirCartao(pais); });
        } else {
          selo.appendChild(criar('span', 'carimbo-misterio', '?'));
          selo.setAttribute('aria-label', 'Carimbo ainda não conquistado');
          selo.addEventListener('click', function () {
            Sons.tocar('boing');
            Efeitos.reanimar(selo, 'tremer');
          });
        }
        grade.appendChild(selo);
      });
      pagina.appendChild(grade);
      conteudoEl.appendChild(pagina);
    });
  }

  function desenharConquistas() {
    var obtidas = Progresso.conquistasObtidas();
    var grade = criar('div', 'grade-conquistas');
    Progresso.CONQUISTAS.forEach(function (c) {
      var tem = obtidas.indexOf(c.id) !== -1;
      var cartao = criar('div', 'conquista' + (tem ? ' obtida' : ''));
      var selo = criar('span', 'conquista-emoji');
      selo.innerHTML = Icone.html(tem ? c.icone : 'cadeado');
      cartao.appendChild(selo);
      var textos = criar('span', 'conquista-textos');
      textos.appendChild(criar('strong', null, c.nome));
      textos.appendChild(criar('small', null, c.descricao));
      cartao.appendChild(textos);
      grade.appendChild(cartao);
    });
    conteudoEl.appendChild(grade);
  }

  function desenhar() {
    var quantos = Progresso.carimbos().length;
    contagemEl.textContent = quantos + ' de ' + PAISES.length + ' carimbos';
    barraEl.style.width = (quantos / PAISES.length * 100) + '%';
    conteudoEl.innerHTML = '';
    for (var i = 0; i < abas.length; i++) {
      var ativa = abas[i].getAttribute('data-aba') === abaAtual;
      abas[i].classList.toggle('ativa', ativa);
      abas[i].setAttribute('aria-selected', ativa ? 'true' : 'false');
    }
    if (abaAtual === 'carimbos') desenharCarimbos(); else desenharConquistas();
  }

  // ---------- Cartão do país ----------
  function abrirCartao(pais) {
    var dados = INFO_PAISES[pais.codigo];
    paisAberto = pais;
    $('cartao-bandeira').src = 'bandeiras/' + pais.codigo + '.png';
    $('cartao-bandeira').alt = 'Bandeira de ' + pais.nome;
    $('cartao-nome').textContent = pais.nome;
    $('cartao-capital').textContent = 'Capital: ' + dados.capital;
    $('cartao-texto').textContent = dados.curiosidade || '';
    cartaoFundo.hidden = false;
    Sons.tocar('virar');
    $('btn-cartao-fechar').focus();
    falarPais();
  }

  function falarPais() {
    if (!paisAberto) return;
    var dados = INFO_PAISES[paisAberto.codigo];
    Voz.falar(paisAberto.nome + '. A capital é ' + dados.capital + '. ' + (dados.curiosidade || ''));
  }

  function fecharCartao() {
    if (cartaoFundo.hidden) return;
    Voz.calar();
    Sons.tocar('clique');
    cartaoFundo.hidden = true;
    paisAberto = null;
  }

  $('btn-cartao-ouvir').addEventListener('click', falarPais);
  $('btn-cartao-fechar').addEventListener('click', fecharCartao);
  cartaoFundo.addEventListener('click', function (evento) {
    if (evento.target === cartaoFundo) fecharCartao();
  });
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape') fecharCartao();
  });

  for (var i = 0; i < abas.length; i++) {
    abas[i].addEventListener('click', function () {
      Sons.tocar('clique');
      abaAtual = this.getAttribute('data-aba');
      desenhar();
    });
  }

  window.Passaporte = {
    mostrar: function () {
      abaAtual = 'carimbos';
      Telas.mostrar('tela-passaporte', { aoTrocar: desenhar });
    }
  };
})();
