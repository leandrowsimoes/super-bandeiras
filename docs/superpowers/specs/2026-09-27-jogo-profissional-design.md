# Super Bandeiras! — Versão profissional (4 fases)

Data: 2026-09-27
Público: crianças de 6 a 10 anos. Tom: alegre, nunca pune, sempre encoraja.

## Restrições travadas

- Continua **100% offline**, abre com duplo clique (`file://`). Por isso: scripts
  comuns (sem ES modules), sem build, sem bibliotecas externas.
- **Nenhum arquivo de áudio**: todos os sons e músicas sintetizados em Web Audio.
- `prefers-reduced-motion`: toda animação nova tem versão instantânea.
- Atalho `index.html?nivel=<nivel>` continua funcionando.
- Teclas 1–4 continuam respondendo (as opções passam a ser numeradas 1–4 em vez de
  A–D, casando com o teclado e mais fácil para quem ainda não domina letras);
  Enter/Espaço avançam.

## Arquitetura (scripts, cada um expõe um objeto global)

| Arquivo | Objeto | Responsabilidade |
|---|---|---|
| `js/paises.js` | `PAISES` | lista de países (inalterada) |
| `js/curiosidades.js` | `INFO_PAISES` | continente, capital, curiosidade por país |
| `js/audio.js` | `Sons` | efeitos sonoros sintetizados, liga/desliga |
| `js/musica.js` | `Musica` | trilhas `menu` e `jogo`, troca com fade, `abafar()` durante a fala |
| `js/voz.js` | `Voz` | fala pt-BR, fila de falas, abafa a música enquanto fala |
| `js/efeitos.js` | `Efeitos` | partículas em canvas, confete, tremor, contagem, transição de tela |
| `js/progresso.js` | `Progresso` | localStorage: recordes, carimbos, conquistas, campanha, preferências |
| `js/telas.js` | `Telas` | navegação entre telas com transição de nuvens |
| `js/quiz.js` | `Quiz` | motor de perguntas (modo país ou bandeira, pequeno explorador, ajudas) |
| `js/resultado.js` | `Resultado` | tela de fim compartilhada por todos os modos |
| `js/mapa.js` | `Mapa` | campanha por continentes |
| `js/passaporte.js` | `Passaporte` | álbum de carimbos + conquistas |
| `js/memoria.js` | `Memoria` | minijogo da memória |
| `js/relampago.js` | `Relampago` | minijogo verdadeiro ou falso |
| `js/app.js` | — | liga menus, preferências, atalho de URL |

## Fase 1 — Polimento e "suco"

- **Bugs:** estrelas da tela de fim nunca acendiam (classe `cheia` × CSS `.acesa`);
  fim com poucos acertos tocava som de erro → passa a tocar jingle de encorajamento.
- **Transições:** nuvens atravessam a tela ao trocar de tela (~0,6 s) com "whoosh".
- **Bandeira:** entra virando como carta; brilho de tecido passando (tremular).
- **Respostas:** entram em cascata; errada treme; certa pulsa e solta partículas.
- **Combo:** selo cresce por nível (x2, x3–x4, x5 = "SUPER!" + leve tremor da carta).
- **Fim:** medalha cai quicando, estrelas acendem uma a uma com "ding" subindo de
  tom, pontos sobem contando com som de moedinha.
- **Cenário:** aviãozinho puxando faixa cruza o céu de vez em quando.
- **Mascote no jogo:** o Globo aparece no canto da carta com balão de fala;
  pula no acerto, consola no erro.
- **Sons:** hover (pop suave, limitado), clique, acerto com brilho, erro suave
  (sem serra áspera), combo com tom subindo, super, whoosh, virar, estrela,
  moeda, fanfarra, encorajar, conquista, carimbo, desbloquear. Compressor no
  mestre para não estourar.
- **Música:** trilha `menu` (atual) e trilha `jogo` (nova, mais animada); troca com
  fade. Abaixa enquanto a voz fala.

## Fase 2 — Pequeno Explorador e aprendizado

- **Modo Pequeno Explorador** (interruptor 🐣 na tela inicial, salvo): a voz lê a
  pergunta e cada opção destacando-a; 3 opções; sem barra de bônus; segunda chance
  (1º erro: opção treme e apaga, "Tente de novo!"; acerto na 2ª tentativa vale
  50 pontos, conta como acerto e zera o combo).
- **Modo "Ache a bandeira"** (seletor na tela de níveis): a voz/texto diz o país
  e a criança escolhe entre bandeiras.
- **Ajudas** por rodada: 🔍 Lupa (deixa só 2 opções) e 🗺️ Dica (mostra o
  continente). Cada rodada começa com 1 de cada; combo x3 ganha +1 Lupa (máx. 3).
  Usar ajuda não tira pontos.
- **Curiosidade** após cada resposta: cartão com bandeira, nome, curiosidade (ou
  capital), lida em voz alta; botão grande "Próxima ➜" avança (Enter/Espaço).

## Fase 3 — Passaporte do Explorador

- Todo acerto (qualquer modo) carimba o país no passaporte.
- Tela Passaporte: progresso "N de 163", páginas por continente, carimbos com
  bandeira; não conquistados aparecem como "?". Tocar num carimbo abre cartão
  com bandeira grande, capital, curiosidade e botão 🔊.
- Tela de fim mostra "+N carimbos novos!" com os carimbos batendo.
- **Conquistas** (13): primeiro acerto, combo x5, rodada perfeita, 10/50/100/163
  carimbos, cada continente completo no mapa (5), memória vencida. Ao desbloquear:
  faixa desce do topo com som de conquista.

## Fase 4 — Mapa de Aventura e minijogos

- **Mapa:** 5 continentes na ordem América → Europa → África → Ásia → Oceania,
  cada um com 3 fases. Países do continente ordenados por nível (fácil → impossível)
  e divididos em terços; cada fase usa até 8 países do seu terço; alternativas vêm
  do mesmo continente.
- Passar = ≥ 50 % de acertos (1★); ≥ 70 % 2★; ≥ 90 % 3★. Melhor resultado salvo.
  Passar libera a próxima fase; a 3ª fase libera o próximo continente com
  animação de avião voando e som de desbloqueio.
- **Memória:** 6 pares bandeira ↔ nome; cartas viram; nome falado ao virar;
  estrelas por número de jogadas (≤ 9 3★, ≤ 13 2★, senão 1★).
- **Relâmpago:** 45 s; "Esta é a bandeira de X?" com ✔️/❌ grandes; +1 por acerto;
  recorde salvo. No Pequeno Explorador a pergunta é falada.
- "Pinte a bandeira" fica fora: exigiria desenhar cada bandeira em vetor.

## Tela inicial (nova)

Mascote + título + quatro cartões grandes: 🗺️ Aventura, 🚩 Quiz Livre,
📘 Passaporte, 🎲 Minijogos; abaixo, o interruptor 🐣 Pequeno Explorador.
"Quiz Livre" abre a tela de níveis (os 4 níveis atuais + seletor de modo).

## Persistência (localStorage, prefixo `vb_`)

- Mantidas: `vb_som`, `vb_musica`, `vb_pontos_<nivel>`.
- Novas: `vb_pequeno` (sim/nao), `vb_carimbos` (JSON lista de códigos),
  `vb_conquistas` (JSON lista de ids), `vb_campanha` (JSON `{ "america-1": 3, ... }`),
  `vb_relampago` (recorde), `vb_memoria_<pares>` (menor nº de jogadas), `vb_modo` (pais/bandeira),
  `vb_pontos_bandeira_<nivel>` (recorde do modo bandeira).
- Leitura tolerante: JSON inválido vira valor vazio (não quebra o jogo).

## Critérios de sucesso (verificados em `tests/testar-navegador.mjs`)

1. Os 4 níveis iniciam por URL; partida completa; jogar de novo.
2. Pontos, combo e recorde por pontos continuam funcionando.
3. Estrelas acendem na tela de fim (classe `.acesa`).
4. Pequeno Explorador: 3 opções, sem barra de bônus, segunda chance funciona.
5. Modo bandeira: 4 opções com imagens de bandeira.
6. Lupa deixa 2 opções; Dica mostra o continente.
7. Acertos viram carimbos visíveis no passaporte.
8. Mapa: só América-1 liberada no início; passar libera a próxima.
9. Memória e Relâmpago iniciam e terminam na tela de resultado.
10. Sem erros de JavaScript, sem rolagem horizontal em 390 px e 1440 px.
