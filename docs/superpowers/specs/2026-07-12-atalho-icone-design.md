# Atalho e ícone do Super Bandeiras! — Design

## Objetivo

Criar um atalho chamado **Super Bandeiras!** na Área de Trabalho do usuário atual, apontando para `D:\Jogo Bandeiras 2.0\index.html`.

## Ícone

O ícone será uma ilustração cartoon quadrada, sem texto, com:

- globo terrestre sorridente como personagem principal;
- pequena capa vermelha de super-herói;
- estrela amarela como detalhe secundário;
- fundo azul-claro;
- contorno azul-escuro espesso;
- formas simples e alto contraste para legibilidade em 32×32 pixels;
- ausência de marcas, letras, sombras realistas e detalhes miúdos.

A imagem fonte será salva dentro do projeto e convertida para um arquivo `.ico` com múltiplos tamanhos. O atalho usará esse `.ico`, não um caminho temporário.

## Comportamento

O atalho será um arquivo `.lnk` padrão do Windows. Ao ser aberto, iniciará `index.html` no navegador padrão. O diretório de trabalho será `D:\Jogo Bandeiras 2.0`.

## Verificação

- confirmar que PNG e ICO existem na pasta do jogo;
- confirmar que o ICO contém tamanhos adequados ao Windows;
- ler de volta o atalho e validar destino, diretório de trabalho e ícone;
- não alterar o jogo original em `D:\Jogo Bandeiras`.
