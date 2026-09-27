/* ============================================================
   Super Bandeiras! — Progresso salvo (localStorage)
   Recordes, carimbos do passaporte, conquistas, campanha e
   preferências. Dados corrompidos viram "vazio" em vez de
   travar o jogo.
   ============================================================ */

(function () {
  'use strict';

  var CONQUISTAS = [
    { id: 'primeiro-acerto', emoji: '🎯', nome: 'Primeiro acerto', descricao: 'Acerte sua primeira bandeira.' },
    { id: 'combo-5', emoji: '🔥', nome: 'Pegando fogo', descricao: 'Faça um combo de 5 acertos seguidos.' },
    { id: 'perfeito', emoji: '🏆', nome: 'Rodada perfeita', descricao: 'Acerte todas as bandeiras de uma rodada.' },
    { id: 'carimbos-10', emoji: '📘', nome: 'Colecionador', descricao: 'Junte 10 carimbos no passaporte.' },
    { id: 'carimbos-50', emoji: '🧳', nome: 'Viajante', descricao: 'Junte 50 carimbos no passaporte.' },
    { id: 'carimbos-100', emoji: '✈️', nome: 'Volta ao mundo', descricao: 'Junte 100 carimbos no passaporte.' },
    { id: 'carimbos-todos', emoji: '🌍', nome: 'Superexplorador', descricao: 'Carimbe todos os países do jogo!' },
    { id: 'continente-america', emoji: '🗽', nome: 'Rei das Américas', descricao: 'Complete as Américas no mapa.' },
    { id: 'continente-europa', emoji: '🏰', nome: 'Cavaleiro da Europa', descricao: 'Complete a Europa no mapa.' },
    { id: 'continente-africa', emoji: '🦁', nome: 'Leão da África', descricao: 'Complete a África no mapa.' },
    { id: 'continente-asia', emoji: '🐼', nome: 'Mestre da Ásia', descricao: 'Complete a Ásia no mapa.' },
    { id: 'continente-oceania', emoji: '🦘', nome: 'Surfista da Oceania', descricao: 'Complete a Oceania no mapa.' },
    { id: 'memoria', emoji: '🧠', nome: 'Memória de elefante', descricao: 'Termine um jogo da memória.' }
  ];

  function lerJSON(chave, padrao) {
    var bruto = localStorage.getItem(chave);
    if (bruto === null) return padrao;
    try {
      var valor = JSON.parse(bruto);
      return valor === null ? padrao : valor;
    } catch (erro) {
      // Dado salvo corrompido: recomeça do zero em vez de travar o jogo.
      if (window.console) console.warn('Progresso inválido em ' + chave + ', reiniciando.', erro);
      return padrao;
    }
  }

  function gravarJSON(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
  }

  function lerNumero(chave) {
    var valor = parseInt(localStorage.getItem(chave), 10);
    return !isNaN(valor) && valor >= 0 ? valor : null;
  }

  // Grava se for maior (ou menor, quando `menorVence`); diz se bateu.
  function salvarRecorde(chave, valor, menorVence) {
    var antigo = lerNumero(chave);
    var bateu = antigo === null ? (menorVence || valor > 0) : (menorVence ? valor < antigo : valor > antigo);
    if (bateu) localStorage.setItem(chave, String(valor));
    return bateu;
  }

  // ---------- Carimbos ----------
  function carimbos() {
    var lista = lerJSON('vb_carimbos', []);
    return Array.isArray(lista) ? lista : [];
  }

  function temCarimbo(codigo) {
    return carimbos().indexOf(codigo) !== -1;
  }

  // Devolve true quando o carimbo é novo.
  function carimbar(codigo) {
    var lista = carimbos();
    if (lista.indexOf(codigo) !== -1) return false;
    lista.push(codigo);
    gravarJSON('vb_carimbos', lista);
    var total = lista.length;
    if (total >= 10) desbloquear('carimbos-10');
    if (total >= 50) desbloquear('carimbos-50');
    if (total >= 100) desbloquear('carimbos-100');
    if (total >= PAISES.length) desbloquear('carimbos-todos');
    return true;
  }

  // ---------- Conquistas ----------
  function conquistasObtidas() {
    var lista = lerJSON('vb_conquistas', []);
    return Array.isArray(lista) ? lista : [];
  }

  function desbloquear(id) {
    var lista = conquistasObtidas();
    if (lista.indexOf(id) !== -1) return false;
    var conquista = CONQUISTAS.filter(function (c) { return c.id === id; })[0];
    if (!conquista) throw new Error('Conquista desconhecida: ' + id);
    lista.push(id);
    gravarJSON('vb_conquistas', lista);
    // Pequeno atraso para a faixa não brigar com o som de acerto.
    setTimeout(function () {
      Sons.tocar('conquista');
      Efeitos.faixa(conquista.emoji, 'Conquista: ' + conquista.nome, conquista.descricao);
    }, 500);
    return true;
  }

  // ---------- Campanha ----------
  function campanha() {
    var dados = lerJSON('vb_campanha', {});
    return dados && typeof dados === 'object' ? dados : {};
  }

  function estrelasFase(id) {
    var valor = campanha()[id];
    return typeof valor === 'number' ? valor : 0;
  }

  function salvarFase(id, estrelas) {
    var dados = campanha();
    if (estrelas > (dados[id] || 0)) {
      dados[id] = estrelas;
      gravarJSON('vb_campanha', dados);
    }
  }

  window.Progresso = {
    CONQUISTAS: CONQUISTAS,
    pequeno: function () { return localStorage.getItem('vb_pequeno') === 'sim'; },
    definirPequeno: function (sim) { localStorage.setItem('vb_pequeno', sim ? 'sim' : 'nao'); },
    lerNumero: lerNumero,
    salvarRecorde: salvarRecorde,
    carimbos: carimbos,
    temCarimbo: temCarimbo,
    carimbar: carimbar,
    conquistasObtidas: conquistasObtidas,
    desbloquear: desbloquear,
    estrelasFase: estrelasFase,
    salvarFase: salvarFase
  };
})();
