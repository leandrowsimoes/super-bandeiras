/* ============================================================
   Super Bandeiras! — Voz (leitura em voz alta, pt-BR)
   Segue o botão 🔊. Enquanto fala, a música abaixa.

   A qualidade depende das vozes que o navegador/sistema oferece:
   escolhemos a melhor disponível (neurais primeiro) e falamos
   frase por frase, com pequenas pausas, para soar menos robótico.
   ============================================================ */

(function () {
  'use strict';

  var disponivel = !!window.speechSynthesis;
  var vozPt = null;
  var sessao = 0;   // cada fala nova invalida os avisos de término das antigas
  var CHAVE_PREFERENCIA = 'vb_voz';
  var MAX_CARACTERES_POR_FALA = 120;
  var emFala = null; // guarda a utterance atual: o Chrome pode coletá-la e perder o onend

  /* ---------- Escolha da melhor voz ---------- */

  function idiomaDaVoz(voz) {
    return (voz.lang || '').toLowerCase().replace('_', '-');
  }

  function ehNeural(nome) {
    return /natural|neural|online/i.test(nome);
  }

  // Quanto maior a nota, melhor a voz. Só compara vozes entre si.
  function pontuarVoz(voz) {
    var nome = voz.name || '';
    var idioma = idiomaDaVoz(voz);
    var nota = 0;

    // pt-BR sempre vence pt-PT/pt, que só servem de reserva.
    if (idioma.indexOf('pt-br') === 0) nota += 1000;
    else if (idioma.indexOf('pt') !== 0) return -Infinity;

    if (ehNeural(nome)) nota += 500;
    if (/francisca/i.test(nome)) nota += 60;
    else if (/thalita/i.test(nome)) nota += 50;
    else if (/antonio|antônio/i.test(nome)) nota += 40;

    if (/google/i.test(nome)) nota += 300;
    if (voz.localService === false) nota += 150;       // vozes de rede costumam ser melhores
    if (/luciana/i.test(nome)) nota += 200;            // macOS/iOS
    else if (/felipe/i.test(nome)) nota += 120;
    if (/premium|enhanced|aprimorad/i.test(nome)) nota += 100;

    // Voz feminina e amigável é a preferida para crianças.
    if (/francisca|thalita|luciana|camila|vitoria|vitória|fernanda|maria|female|feminin/i.test(nome)) nota += 20;

    // Vozes legadas (robóticas) ficam por último.
    if (/microsoft/i.test(nome) && /maria|daniel|heloisa|heloísa|hortense/i.test(nome) && !ehNeural(nome)) nota -= 100;
    if (/espeak/i.test(nome)) nota -= 300;

    return nota;
  }

  // `vozes` é uma lista de objetos { name, lang, localService }.
  // `preferida` é o nome salvo pelo usuário (vence a escolha automática).
  function escolherMelhorVoz(vozes, preferida) {
    var melhor = null;
    var melhorNota = -Infinity;
    for (var i = 0; i < vozes.length; i++) {
      var nota = pontuarVoz(vozes[i]);
      if (nota === -Infinity) continue;
      if (preferida && vozes[i].name === preferida) return vozes[i];
      if (nota > melhorNota) { melhorNota = nota; melhor = vozes[i]; }
    }
    return melhor;
  }

  // Classifica a voz: 'neural' (online/Natural/Google/remota), 'boa'
  // (Luciana, Felipe e afins) ou 'legada' (robótica ou ausente).
  function tipoDaVoz(voz) {
    if (!voz) return 'legada';
    var nome = voz.name || '';
    if (ehNeural(nome) || /google/i.test(nome) || voz.localService === false) return 'neural';
    if (/luciana|felipe|premium|enhanced|aprimorad/i.test(nome)) return 'boa';
    return 'legada';
  }

  function lerPreferencia() {
    try {
      return localStorage.getItem(CHAVE_PREFERENCIA);
    } catch (erro) {
      return null; // localStorage pode estar bloqueado (modo privado, file://)
    }
  }

  function reavaliarVozes() {
    if (!disponivel) return;
    var vozes = speechSynthesis.getVoices() || [];
    vozPt = escolherMelhorVoz(vozes, lerPreferencia());
  }

  // O Chrome carrega as vozes de forma assíncrona (e as do Google por
  // último): além do evento, tentamos de novo por alguns segundos.
  function iniciarBuscaDeVozes() {
    reavaliarVozes();
    if (speechSynthesis.addEventListener) {
      speechSynthesis.addEventListener('voiceschanged', reavaliarVozes);
    } else {
      speechSynthesis.onvoiceschanged = reavaliarVozes;
    }
    var tentativas = 0;
    var relogio = setInterval(function () {
      tentativas++;
      reavaliarVozes();
      if (tentativas >= 16 || tipoDaVoz(vozPt) === 'neural') clearInterval(relogio);
    }, 250);
  }

  if (disponivel) iniciarBuscaDeVozes();

  /* ---------- Normalização do texto ---------- */

  var NUMEROS_POR_EXTENSO = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];

  function normalizarTexto(texto) {
    var t = String(texto == null ? '' : texto);

    // Emojis e símbolos que o leitor falaria de forma estranha (⭐ 🔥 ✔ ➜ ...).
    t = t.replace(/[\uD83C-\uD83E][\uDC00-\uDFFF]/g, ' ')
         .replace(/[←-⇿⌀-⏿☀-➿⤀-⥿⬀-⯿︎️‍]/g, ' ');

    // "x2" do combo vira "combo dois".
    t = t.replace(/\bx\s?(\d{1,2})\b/gi, function (_, n) {
      var numero = parseInt(n, 10);
      return 'combo ' + (numero <= 10 ? NUMEROS_POR_EXTENSO[numero] : numero);
    });

    // Abreviações comuns (antes de separar frases, para o ponto delas não virar pausa).
    t = t.replace(/km²|km2/gi, ' quilômetros quadrados')
         .replace(/\bkm\b/gi, 'quilômetros')
         .replace(/\baprox\./gi, 'aproximadamente')
         .replace(/\bhab\./gi, 'habitantes')
         .replace(/\bséc\./gi, 'século')
         .replace(/\bDra\./g, 'doutora')
         .replace(/\bDr\./g, 'doutor')
         .replace(/\bSra\./g, 'senhora')
         .replace(/\bSr\./g, 'senhor')
         .replace(/\bex\./gi, 'por exemplo')
         .replace(/\betc\.?/gi, 'etcétera')
         .replace(/%/g, ' por cento')
         .replace(/&/g, ' e ');

    // Reticências, travessões e parênteses viram pausas curtas (vírgulas).
    t = t.replace(/…|\.{2,}/g, ', ')
         .replace(/\s[-–—]+\s|[–—]/g, ', ')
         .replace(/[()\[\]{}]/g, ', ')
         .replace(/["“”«»*_#~^|\\\/<>=+]/g, ' ');

    // Pontuação solta ou repetida não deve ser lida nem criar falas vazias.
    t = t.replace(/[!?]{2,}/g, function (m) { return m.charAt(m.length - 1); })
         .replace(/\s+([,.!?;:])/g, '$1')
         .replace(/([,;:])\s*([,.!?;:])+/g, '$2')
         .replace(/^[\s,.!?;:]+/, '')
         .replace(/\s+/g, ' ');

    return t.trim();
  }

  /* ---------- Divisão em frases/orações ---------- */

  var PAUSA_POR_FIM = { '.': 280, '!': 230, '?': 230, ';': 190, ':': 190, ',': 150, '': 150 };

  // Corta nas vírgulas e, se ainda for longo, nos espaços.
  function quebrarFraseLonga(frase) {
    if (frase.length <= MAX_CARACTERES_POR_FALA) return [frase];
    var partes = [];
    var atual = '';
    // (sem lookbehind, que navegadores mais antigos não entendem)
    var pedacos = frase.split(/,\s+/).map(function (parte, i, todas) {
      return i < todas.length - 1 ? parte + ',' : parte;
    });
    for (var i = 0; i < pedacos.length; i++) {
      var candidato = atual ? atual + ' ' + pedacos[i] : pedacos[i];
      if (candidato.length > MAX_CARACTERES_POR_FALA && atual) {
        partes.push(atual);
        atual = pedacos[i];
      } else {
        atual = candidato;
      }
    }
    if (atual) partes.push(atual);

    var final = [];
    partes.forEach(function (parte) {
      while (parte.length > MAX_CARACTERES_POR_FALA) {
        var corte = parte.lastIndexOf(' ', MAX_CARACTERES_POR_FALA);
        if (corte <= 0) corte = MAX_CARACTERES_POR_FALA;
        final.push(parte.slice(0, corte).trim());
        parte = parte.slice(corte).trim();
      }
      if (parte) final.push(parte);
    });
    return final;
  }

  // Devolve [{ texto, fim }], onde `fim` é a pontuação que fecha a fala
  // ('.', '!', '?', ';', ':', ou ',' / '' quando foi um corte interno).
  function dividirEmFalas(texto) {
    var limpo = normalizarTexto(texto);
    var frases = [];
    var inicio = 0;
    for (var i = 0; i < limpo.length; i++) {
      var letra = limpo.charAt(i);
      var proxima = limpo.charAt(i + 1);
      // Só é fim de frase se a pontuação for seguida de espaço ou do fim
      // do texto (assim "3.5" e "1.000" não são cortados).
      if ('.!?;:'.indexOf(letra) !== -1 && (proxima === '' || proxima === ' ')) {
        frases.push({ texto: limpo.slice(inicio, i).trim(), fim: letra });
        inicio = i + 1;
      }
    }
    if (inicio < limpo.length) frases.push({ texto: limpo.slice(inicio).trim(), fim: '' });

    var falas = [];
    frases.forEach(function (frase) {
      if (!/[0-9A-Za-zÀ-ÿ]/.test(frase.texto)) return; // sobrou só pontuação
      var partes = quebrarFraseLonga(frase.texto);
      partes.forEach(function (parte, indice) {
        var ultima = indice === partes.length - 1;
        falas.push({ texto: parte, fim: ultima ? frase.fim : ',' });
      });
    });
    return falas;
  }

  /* ---------- Prosódia ---------- */

  function variacao() {
    return 1 + (Math.random() * 0.06 - 0.03); // ±3% para evitar monotonia
  }

  function limitar(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor));
  }

  // Vozes neurais soam melhor sem mexer no tom; as legadas ganham um tom
  // um pouco mais agudo e fala mais lenta, mais amigáveis para crianças.
  function prosodiaDaFala(fim, tipo) {
    var taxa = 0.92;
    var tom = 1.08;
    if (tipo === 'neural') { taxa = 0.95; tom = 1.0; }
    else if (tipo === 'legada') { taxa = 0.9; tom = 1.1; }

    var realce = tipo === 'neural' ? 0.03 : 0.05;
    if (fim === '!') tom += realce;
    else if (fim === '?') tom += realce * 0.6;

    return {
      rate: limitar(taxa * variacao(), 0.5, 1.5),
      pitch: limitar(tom * variacao(), 0.5, 1.8)
    };
  }

  /* ---------- Fala ---------- */

  function abafarMusica(sim) {
    if (window.Musica) Musica.abafar(sim);
  }

  function calar() {
    sessao++;
    emFala = null;
    abafarMusica(false);
    if (disponivel) speechSynthesis.cancel();
  }

  // Transforma os trechos em uma fila de falas curtas. Trechos vazios
  // continuam na fila (sem áudio) para o destaque na tela não "pular".
  function montarFila(trechos) {
    var fila = [];
    for (var t = 0; t < trechos.length; t++) {
      var falas = dividirEmFalas(trechos[t]);
      if (!falas.length) { fila.push({ trecho: t, texto: '', fim: '' }); continue; }
      for (var f = 0; f < falas.length; f++) {
        fila.push({ trecho: t, texto: falas[f].texto, fim: falas[f].fim });
      }
    }
    return fila;
  }

  // Fala uma lista de trechos em sequência. `aoComecarTrecho(i)` permite
  // destacar na tela o que está sendo lido; `aoTerminar` roda no fim (ou
  // logo, se não houver voz), para o jogo nunca ficar esperando.
  function falarSequencia(trechos, aoComecarTrecho, aoTerminar) {
    calar();
    var minhaSessao = sessao;
    var terminar = function () {
      if (minhaSessao !== sessao) return;
      abafarMusica(false);
      if (aoTerminar) aoTerminar();
    };
    if (!disponivel || !window.Sons || !Sons.ligado() || !trechos.length) {
      setTimeout(terminar, 0);
      return;
    }

    if (!vozPt) reavaliarVozes(); // as vozes podem ter chegado depois do carregamento
    var voz = vozPt;
    var tipo = tipoDaVoz(voz);
    var fila = montarFila(trechos);

    abafarMusica(true);
    var indice = 0;
    var trechoAnunciado = -1;
    function proximo() {
      if (minhaSessao !== sessao) return;
      if (indice >= fila.length) { terminar(); return; }
      var item = fila[indice++];
      if (item.trecho !== trechoAnunciado) {
        trechoAnunciado = item.trecho;
        if (aoComecarTrecho) aoComecarTrecho(item.trecho);
      }
      if (!item.texto) { setTimeout(proximo, 0); return; }

      var fala = new SpeechSynthesisUtterance(item.texto);
      fala.lang = 'pt-BR';
      if (voz) fala.voice = voz;
      var prosodia = prosodiaDaFala(item.fim, tipo);
      fala.rate = prosodia.rate;
      fala.pitch = prosodia.pitch;

      // Alguns navegadores nunca disparam `onend`: um prazo estimado pelo
      // tamanho do texto garante que a sequência continue mesmo assim.
      var avancou = false;
      var avancar = function () {
        if (avancou) return;
        avancou = true;
        clearTimeout(prazo);
        var proximaFala = fila[indice];
        // Pausa natural entre frases; um pouco maior ao trocar de trecho.
        var pausa = PAUSA_POR_FIM[item.fim] || 150;
        if (proximaFala && proximaFala.trecho !== item.trecho) pausa = Math.max(pausa, 300);
        setTimeout(proximo, pausa);
      };
      var prazo = setTimeout(avancar, 1500 + item.texto.length * 110);
      fala.onend = avancar;
      fala.onerror = avancar;
      emFala = fala;
      speechSynthesis.speak(fala);
    }
    proximo();
  }

  /* ---------- API pública ---------- */

  function nomesDasVozesPt() {
    if (!disponivel) return [];
    var vozes = (speechSynthesis.getVoices() || []).filter(function (v) {
      return pontuarVoz(v) !== -Infinity;
    });
    vozes.sort(function (a, b) { return pontuarVoz(b) - pontuarVoz(a); });
    return vozes.map(function (v) { return v.name; });
  }

  window.Voz = {
    falar: function (texto, aoTerminar) { falarSequencia([texto], null, aoTerminar); },
    falarSequencia: falarSequencia,
    calar: calar,

    // Utilitários para a interface.
    nomeDaVoz: function () { return vozPt ? vozPt.name : null; },
    vozNatural: function () { return tipoDaVoz(vozPt) !== 'legada'; },
    vozesPt: nomesDasVozesPt,
    // Salva a preferência e passa a usá-la. Sem nome, volta ao automático.
    escolherVoz: function (nome) {
      try {
        if (nome) localStorage.setItem(CHAVE_PREFERENCIA, nome);
        else localStorage.removeItem(CHAVE_PREFERENCIA);
      } catch (erro) {
        // Sem localStorage a escolha vale só até recarregar a página.
      }
      if (!disponivel) return false;
      var vozes = speechSynthesis.getVoices() || [];
      var escolhida = escolherMelhorVoz(vozes, nome || null);
      if (nome && (!escolhida || escolhida.name !== nome)) return false;
      vozPt = escolhida;
      return true;
    },

    // Só para testes de lógica (funções puras).
    _teste: {
      pontuarVoz: pontuarVoz,
      escolherMelhorVoz: escolherMelhorVoz,
      tipoDaVoz: tipoDaVoz,
      normalizarTexto: normalizarTexto,
      dividirEmFalas: dividirEmFalas,
      prosodiaDaFala: prosodiaDaFala
    }
  };
})();
