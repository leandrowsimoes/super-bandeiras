# Super Bandeiras! — Especificação de design

Data: 12 de julho de 2026

## Objetivo

Criar, em `D:\Jogo Bandeiras 2.0`, uma versão independente do jogo existente em `D:\Jogo Bandeiras`. A versão 2.0 deve preservar suas regras e seu conteúdo, trocar o nome para **Super Bandeiras!** e adotar uma interface infantil moderna no estilo de desenho animado.

O projeto original é somente fonte de referência e não será modificado.

## Escopo

A versão 2.0 manterá:

- 163 bandeiras armazenadas localmente;
- quatro níveis: fácil, médio, difícil e impossível;
- partidas com 10 perguntas sorteadas sem repetição;
- quatro alternativas por pergunta;
- pontuação, estrelas, medalhas e recordes por nível;
- música, efeitos sonoros e leitura falada dos nomes dos países;
- atalhos de teclado de 1 a 4;
- início direto por `index.html?nivel=<nivel>`;
- funcionamento offline, sem instalação e sem dependências externas.

As melhorias de experiência serão limitadas a animações, feedback visual, responsividade, acessibilidade e acabamento. Não serão criados novos modos de jogo nem novas regras.

## Direção visual

A linguagem visual será **desenho animado moderno**, direcionada ao público infantil:

- céu claro e cenário colorido com formas decorativas discretas;
- contornos escuros e arredondados;
- sombras curtas que dão aparência física aos controles;
- cores alegres com contraste suficiente para leitura;
- botões grandes, com estados de foco, hover, pressionado, acerto e erro;
- Fredoka para títulos e Nunito para textos, carregadas das fontes locais;
- mascote-globo expressivo, construído sem recursos remotos;
- transições suaves, pequenos movimentos de reação e confetes leves;
- redução ou remoção dos movimentos quando `prefers-reduced-motion` estiver ativo.

## Telas

### Início

Exibe o nome **Super Bandeiras!**, o mascote-globo, uma chamada curta, controles de música e som e quatro cartões grandes de dificuldade. Cada cartão identifica o nível, apresenta uma descrição curta e mostra o melhor resultado salvo.

### Partida

Exibe um cabeçalho compacto com botão de início, nível, progresso e pontuação. A bandeira atual aparece em uma área de destaque. Abaixo dela há a pergunta, uma região de aviso acessível e quatro respostas grandes identificadas por número.

Ao responder, todos os botões são bloqueados. O jogo destaca a resposta correta, diferencia visualmente uma escolha incorreta e apresenta feedback textual e sonoro. Depois da transição, avança automaticamente.

### Resultado

Exibe medalha, mensagem baseada na pontuação, estrelas, total de acertos, aviso de novo recorde quando aplicável e ações para jogar novamente ou mudar o nível.

## Arquitetura

O jogo continuará sendo uma aplicação estática, sem framework ou processo de compilação:

- `index.html`: estrutura semântica e acessível das três telas;
- `css/estilo.css`: tokens visuais, layout responsivo, componentes, estados e animações;
- `js/paises.js`: banco local de países e níveis;
- `js/musica.js`: música gerada com Web Audio;
- `js/jogo.js`: estado da partida, sorteio, alternativas, interação, pontuação, recordes e transições;
- `bandeiras/`: 163 imagens locais;
- `fontes/`: Fredoka e Nunito locais;
- `LEIA-ME.txt`: instruções atualizadas.

O banco de países, as bandeiras e a base de áudio serão copiados do projeto original. O HTML e o CSS serão reformulados; o JavaScript do jogo será alterado somente onde o novo feedback e a robustez exigirem.

## Fluxo de dados

1. O jogador escolhe um nível.
2. O jogo filtra os países desse nível e sorteia 10 sem repetição.
3. Para cada país correto, escolhe três alternativas incorretas distintas do mesmo nível e embaralha as quatro opções.
4. A primeira resposta aceita bloqueia novas respostas, atualiza a pontuação e exibe feedback.
5. Após a décima pergunta, o jogo calcula a avaliação final e compara a pontuação com o recorde salvo para aquele nível.
6. Preferências de áudio e recordes são persistidos em `localStorage`.

## Tratamento de falhas

- Falha ao carregar uma bandeira: mostrar aviso claro e oferecer continuação sem travar a interface.
- Web Audio ou síntese de voz indisponíveis: manter a partida funcional e atualizar corretamente o estado visual dos controles.
- Cliques ou teclas repetidos durante o feedback: aceitar somente a primeira resposta.
- Dados inválidos em `localStorage`: ignorar o valor inválido e usar o padrão seguro.
- Recurso local ausente: não gerar exceções silenciosas; registrar contexto no console quando útil e manter uma mensagem compreensível na interface quando afetar o jogador.

## Acessibilidade e responsividade

- Todos os controles serão elementos interativos nativos com nomes acessíveis.
- O foco de teclado será claramente visível.
- O feedback de resposta será anunciado por uma região `aria-live`.
- Cor não será o único indicador de acerto ou erro; haverá texto, ícone e forma.
- O layout será utilizável em celulares estreitos e desktops, sem rolagem horizontal ou conteúdo cortado.
- Áreas de toque terão tamanho adequado para crianças.

## Critérios de sucesso

- Abrir `index.html` inicia o jogo sem rede e sem instalação.
- Os quatro níveis iniciam e completam partidas de 10 perguntas.
- Nenhuma pergunta se repete dentro da mesma partida.
- Música, efeitos, voz, teclado e recordes continuam disponíveis.
- Acerto, erro, progresso e resultado final são visualmente inequívocos.
- O recorde persiste após recarregar a página.
- O layout funciona em largura móvel e desktop.
- A preferência de redução de movimento é respeitada.
- Nenhum arquivo em `D:\Jogo Bandeiras` é alterado.

## Verificação

- Validar referências locais de scripts, estilos, fontes e imagens.
- Executar verificações automatizadas da lista de países e dos arquivos de bandeira.
- Testar os quatro níveis por URL direta.
- Completar ao menos uma partida no navegador e verificar bloqueio de respostas duplicadas, transição, resultado e reinício.
- Recarregar a página para confirmar a persistência do recorde e das preferências.
- Inspecionar visualmente larguras de celular e desktop, foco de teclado e redução de movimento.

