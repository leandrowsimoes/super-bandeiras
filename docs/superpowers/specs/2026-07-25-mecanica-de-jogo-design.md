# Super Bandeiras! — Mecânica de jogo (pontos, velocidade e combo)

Data: 2026-07-25

## Objetivo

Fazer o quiz "parecer jogo de verdade" acrescentando mecânica de pontuação,
sem alterar a identidade visual atual. O foco é a **percepção de jogo**:
recompensa por rapidez, sequência de acertos e feedback com "suco" (juice).

Público-alvo: crianças maiores. Tom: pressão leve — nunca pune, só recompensa.

## Decisões travadas

- **Pontuação por pontos** (base + bônus de velocidade + combo), não mais só `X/10`.
- **Timer é só janela de bônus**: a criança responde a qualquer momento, sem
  game over. Demorar reduz só o bônus extra, nunca os pontos-base do acerto.
- **Recorde salvo passa a ser a maior pontuação por nível.** A chave antiga de
  recorde por acertos (`vb_recorde_<nivel>`) deixa de ser exibida (não é apagada).
- **Estrelas da tela de fim continuam medindo acertos** (accuracy), inalteradas.

## Regras de pontuação

Só ganha ponto quem **acerta**. Errar (ou não responder) não tira pontos.

```
pontos_da_pergunta = round( (100 + bonusVelocidade) * multiplicadorCombo )
```

- **Base:** 100 por acerto.
- **Bônus de velocidade:** janela de **8 segundos** por pergunta. O bônus decai
  linearmente de **+100** (resposta imediata) até **0** (fim da janela). Depois
  do fim da janela, o bônus é 0, mas os 100-base continuam disponíveis.
  - Fórmula: `bonusVelocidade = round(100 * max(0, tempoRestante / 8))`.
  - O relógio da pergunta começa a contar quando a pergunta é exibida.
- **Combo:** contador de acertos consecutivos (`streak`), incluindo o atual.
  - `multiplicadorCombo = min(streak, 5)` → 1º ×1, 2º ×2, 3º ×3, 4º ×4, 5º+ ×5.
  - **Errar zera o combo** (`streak = 0`), mas nunca subtrai pontos.
- Máximo teórico numa rodada perfeita e instantânea:
  `200 * (1+2+3+4+5+5+5+5+5+5) = 8.000` pontos.

## Elementos de tela

### Barra de bônus (novo)
- Barra fina posicionada sob a bandeira (dentro/abaixo do `.quadro-bandeira`).
- Esvazia em 8 s, cor verde → amarelo. É "bônus", não "perigo".
- Ao esvaziar: nada de negativo acontece (some suavemente ou fica vazia).
- Ao responder: congela imediatamente.

### Selo de combo (novo)
- Aparece ao lado do placar quando `streak >= 2`, no formato `🔥 x3`.
- Pulsa levemente a cada incremento. Some ao zerar o combo.

### Pontos flutuantes (novo)
- Ao acertar, um texto `+240` sobe e some sobre a área do carimbo.
- Cor conforme o resultado (verde no acerto).

### Placar do topo (alterado)
- Passa a exibir **pontos acumulados** da rodada: `⭐ 1.240`
  (hoje mostra `⭐ 3`, o número de acertos).
- Formatação de milhar com ponto (pt-BR).

### Tela de fim (alterado)
- Destaque para os **pontos da rodada** + linha "acertou 8 de 10 no nível X".
- Estrelas por acertos: `>=9` 3★, `>=6` 2★, `>=3` 1★ (inalterado).
- `🎉 Novo recorde!` passa a comparar **pontuação**, não acertos.

### Tela inicial (alterado)
- O selo de recorde por nível passa a mostrar a maior pontuação: `🏆 3.480`.
- Sem recorde ainda: selo vazio (como hoje).

## Estado do jogo (js/jogo.js)

Acrescentar ao objeto `jogo`:

- `pontos` (número) — total acumulado da rodada.
- `combo` (número) — acertos consecutivos atuais (streak).
- `inicioPergunta` (timestamp) — `performance.now()` ao exibir a pergunta.
- `timerId` — id da animação/intervalo da barra de bônus, para cancelar ao responder.

Persistência (localStorage):

- Nova chave: `vb_pontos_<nivel>` — maior pontuação salva por nível.
- `lerRecordePontos(nivel)` / gravação análoga às funções atuais de recorde.
- A chave antiga `vb_recorde_<nivel>` não é lida nem escrita (permanece intacta).

## Comportamento detalhado

1. **Ao exibir pergunta** (`mostrarPergunta`):
   - Registra `inicioPergunta`.
   - Reinicia e inicia a animação da barra de bônus (8 s).
   - Atualiza placar (pontos) e selo de combo.
2. **Ao responder** (`responder`):
   - Congela a barra de bônus (cancela `timerId`).
   - Calcula `tempoRestante` a partir de `inicioPergunta`.
   - **Acerto:** incrementa `combo`, calcula `pontos_da_pergunta`, soma em
     `jogo.pontos`, mostra pontos flutuantes, toca som de acerto, atualiza selo.
   - **Erro:** `combo = 0`, 0 pontos, esconde selo de combo, som de erro.
   - Atualiza placar e progresso (comportamento visual atual mantido).
3. **Ao terminar** (`terminar`):
   - Estrelas por acertos (inalterado).
   - Compara `jogo.pontos` com `lerRecordePontos(nivel)`; grava se maior;
     exibe `Novo recorde!` conforme.
   - Mostra pontos + acertos no resumo.

## Acessibilidade e movimento reduzido

- `prefers-reduced-motion`: sem animação de pontos flutuantes e sem pulsar do
  combo; a barra de bônus pula a animação suave mas o cálculo de tempo/pontos
  continua valendo (mede tempo real, não depende de animação CSS).
- Mantém: teclas 1–4, leitura por voz ao focar/hover, `aria-label` existentes,
  `aria-live` do aviso.

## Arquivos afetados

- `index.html` — elementos da barra de bônus e do selo de combo na tela de jogo.
- `css/estilo.css` — estilos de barra de bônus, selo de combo, pontos flutuantes;
  ajuste do placar se necessário.
- `js/jogo.js` — estado, timer, cálculo de pontos/combo, popup, tela de fim,
  nova chave de recorde.

Fora de escopo: mudar a lista de países, o sistema de som/música, a estrutura de
telas, ou o visual geral (cores, fontes, mascote).

## Critérios de sucesso (verificáveis)

1. Responder imediatamente a uma pergunta dá ~200 pts no 1º acerto; responder
   após 8 s dá ~100 pts. (bônus de velocidade funciona)
2. Três acertos seguidos exibem `🔥 x3` e o 3º acerto vale mais que o 1º.
   Um erro no meio zera o selo e o multiplicador. (combo funciona)
3. Deixar o tempo esgotar não gera game over nem tira pontos; ainda dá para
   responder e ganhar os 100-base. (timer = só bônus)
4. Ao fim, a tela mostra pontos + `X de 10`; as estrelas seguem a regra de
   acertos atual. (fim correto)
5. Bater a maior pontuação de um nível exibe `Novo recorde!` e a tela inicial
   passa a mostrar `🏆 <pontos>`. (recorde por pontos)
6. Com `prefers-reduced-motion` ativo, o jogo funciona e pontua sem animações.
