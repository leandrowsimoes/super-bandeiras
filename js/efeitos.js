/* ============================================================
   Super Bandeiras! — Efeitos visuais
   Partículas e confete num <canvas> (mais leve que dezenas de
   divs), tremor, contagem animada e faixas de conquista.
   Tudo respeita a preferência de movimento reduzido.
   ============================================================ */

(function () {
  'use strict';

  var CORES = ['#ffd84d', '#4bd287', '#ff6374', '#9671f4', '#4d8df7', '#ff9f45'];
  var GRAVIDADE = 900; // px/s²

  var canvas = document.getElementById('efeitos');
  var pincel = canvas.getContext('2d');
  var particulas = [];
  var animando = false;
  var ultimoQuadro = 0;

  function movimentoReduzido() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function ajustarCanvas() {
    var escala = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * escala);
    canvas.height = Math.round(window.innerHeight * escala);
    pincel.setTransform(escala, 0, 0, escala, 0, 0);
  }
  window.addEventListener('resize', ajustarCanvas);
  ajustarCanvas();

  function aleatorio(min, max) { return min + Math.random() * (max - min); }
  function corAleatoria(cores) { return cores[Math.floor(Math.random() * cores.length)]; }

  function desenharEstrela(tamanho) {
    pincel.beginPath();
    for (var i = 0; i < 10; i++) {
      var raio = i % 2 === 0 ? tamanho : tamanho * 0.45;
      var angulo = (Math.PI / 5) * i - Math.PI / 2;
      pincel.lineTo(Math.cos(angulo) * raio, Math.sin(angulo) * raio);
    }
    pincel.closePath();
    pincel.fill();
  }

  function quadro(agora) {
    var dt = Math.min(0.05, (agora - ultimoQuadro) / 1000);
    ultimoQuadro = agora;
    pincel.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particulas = particulas.filter(function (p) {
      p.vida -= dt;
      if (p.vida <= 0 || p.y > window.innerHeight + 40) return false;
      p.vy += GRAVIDADE * p.peso * dt;
      p.vx *= p.arrasto;
      p.x += (p.vx + Math.sin(agora / 300 + p.fase) * p.balanco) * dt;
      p.y += p.vy * dt;
      p.giro += p.velGiro * dt;

      pincel.save();
      pincel.globalAlpha = Math.min(1, p.vida / 0.4);
      pincel.translate(p.x, p.y);
      pincel.rotate(p.giro);
      pincel.fillStyle = p.cor;
      if (p.forma === 'estrela') {
        desenharEstrela(p.tamanho);
      } else if (p.forma === 'bola') {
        pincel.beginPath();
        pincel.arc(0, 0, p.tamanho / 2, 0, Math.PI * 2);
        pincel.fill();
      } else {
        // Retângulo que "vira" no ar, como papel picado.
        pincel.scale(1, Math.cos(p.giro * 2));
        pincel.fillRect(-p.tamanho / 2, -p.tamanho / 3, p.tamanho, p.tamanho * 0.66);
      }
      pincel.restore();
      return true;
    });

    if (particulas.length) {
      requestAnimationFrame(quadro);
    } else {
      animando = false;
      pincel.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function animar() {
    if (animando) return;
    animando = true;
    ultimoQuadro = performance.now();
    requestAnimationFrame(quadro);
  }

  // Explosão de estrelinhas a partir de um ponto (ex.: botão certo).
  function explodir(x, y, opcoes) {
    if (movimentoReduzido()) return;
    opcoes = opcoes || {};
    var cores = opcoes.cores || CORES;
    var quantidade = opcoes.quantidade || 26;
    for (var i = 0; i < quantidade; i++) {
      var angulo = aleatorio(0, Math.PI * 2);
      var forca = aleatorio(180, 520);
      particulas.push({
        x: x, y: y,
        vx: Math.cos(angulo) * forca,
        vy: Math.sin(angulo) * forca - 200,
        peso: 0.9, arrasto: 0.985, balanco: 0, fase: 0,
        giro: aleatorio(0, 6), velGiro: aleatorio(-8, 8),
        tamanho: aleatorio(6, 12),
        forma: Math.random() < 0.6 ? 'estrela' : 'bola',
        cor: corAleatoria(cores),
        vida: aleatorio(0.7, 1.2)
      });
    }
    animar();
  }

  function explodirDe(elemento, opcoes) {
    var r = elemento.getBoundingClientRect();
    explodir(r.left + r.width / 2, r.top + r.height / 2, opcoes);
  }

  // Chuva de confete caindo do topo, espalhada no tempo.
  function confete(quantidade) {
    if (movimentoReduzido()) return;
    quantidade = quantidade || 120;
    for (var i = 0; i < quantidade; i++) {
      particulas.push({
        x: aleatorio(0, window.innerWidth),
        y: aleatorio(-window.innerHeight * 0.8, -20),
        vx: aleatorio(-40, 40), vy: aleatorio(60, 160),
        peso: 0.12, arrasto: 1, balanco: aleatorio(20, 60), fase: aleatorio(0, 6),
        giro: aleatorio(0, 6), velGiro: aleatorio(-5, 5),
        tamanho: aleatorio(9, 15),
        forma: Math.random() < 0.75 ? 'papel' : 'bola',
        cor: corAleatoria(CORES),
        vida: aleatorio(4, 6)
      });
    }
    animar();
  }

  // Reinicia uma animação CSS de classe (tremer, pulsar, pular...).
  function reanimar(elemento, classe) {
    elemento.classList.remove(classe);
    void elemento.offsetWidth; // força reflow para a animação recomeçar
    elemento.classList.add(classe);
  }

  // Conta de `de` até `ate` no texto do elemento, com "tique" opcional.
  function contar(elemento, de, ate, duracao, formatar, aoTique) {
    formatar = formatar || String;
    if (movimentoReduzido() || ate === de) {
      elemento.textContent = formatar(ate);
      return;
    }
    var inicio = performance.now();
    var ultimoTique = 0;
    function passo(agora) {
      var t = Math.min(1, (agora - inicio) / duracao);
      var suave = 1 - Math.pow(1 - t, 3);
      elemento.textContent = formatar(Math.round(de + (ate - de) * suave));
      if (aoTique && agora - ultimoTique > 90 && t < 1) {
        ultimoTique = agora;
        aoTique();
      }
      if (t < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  // Faixa que desce do topo (conquistas, ajudas ganhas).
  var areaFaixas = document.getElementById('faixas');
  function faixa(idIcone, titulo, texto) {
    var el = document.createElement('div');
    el.className = 'faixa';
    el.setAttribute('role', 'status');
    var icone = document.createElement('span');
    icone.className = 'faixa-emoji';
    icone.innerHTML = Icone.html(idIcone);
    var textos = document.createElement('span');
    textos.className = 'faixa-textos';
    var forte = document.createElement('strong');
    forte.textContent = titulo;
    var pequeno = document.createElement('small');
    pequeno.textContent = texto;
    textos.appendChild(forte);
    textos.appendChild(pequeno);
    el.appendChild(icone);
    el.appendChild(textos);
    areaFaixas.appendChild(el);
    setTimeout(function () { el.classList.add('saindo'); }, 3200);
    setTimeout(function () { el.remove(); }, 3700);
  }

  window.Efeitos = {
    movimentoReduzido: movimentoReduzido,
    explodir: explodir,
    explodirDe: explodirDe,
    confete: confete,
    reanimar: reanimar,
    contar: contar,
    faixa: faixa
  };
})();
