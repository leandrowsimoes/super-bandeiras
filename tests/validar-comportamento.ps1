$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$html = Get-Content -Raw -LiteralPath (Join-Path $root 'index.html')

@('tela-inicio', 'tela-jogo', 'tela-fim', 'img-bandeira', 'respostas', 'aviso', 'btn-de-novo', 'btn-mudar') | ForEach-Object {
    if ($html -notmatch ('id="' + [regex]::Escape($_) + '"')) { throw "ID obrigatório ausente: $_" }
}
@('barra-bonus', 'barra-bonus-fill', 'selo-combo') | ForEach-Object {
    if ($html -notmatch ('id="' + [regex]::Escape($_) + '"')) { throw "ID de mecânica ausente: $_" }
}
if ($html -notmatch '<title>Super Bandeiras!</title>') { throw 'Título do jogo incorreto.' }

$cssPath = Join-Path $root 'css\estilo.css'
if (-not (Test-Path -LiteralPath $cssPath)) { throw 'CSS ainda não implementado.' }
$css = Get-Content -Raw -LiteralPath $cssPath
if ($css -notmatch 'prefers-reduced-motion:\s*reduce') { throw 'O CSS não respeita redução de movimento.' }
if ($css -notmatch ':focus-visible') { throw 'O CSS não define foco visível.' }
@('.barra-bonus', '.selo-combo', '.pontos-flutuantes', 'subir-pontos') | ForEach-Object {
    if ($css -notmatch [regex]::Escape($_)) { throw "Estilo de mecânica ausente: $_" }
}

$gamePath = Join-Path $root 'js\jogo.js'
if (-not (Test-Path -LiteralPath $gamePath)) { throw 'Lógica do jogo ainda não implementada.' }
$gameSource = Get-Content -Raw -LiteralPath $gamePath
@('function lerRecordePontos', 'function calcularPontos', 'vb_pontos_', "addEventListener('error'", 'Resposta certa', 'Sua escolha') | ForEach-Object {
    if ($gameSource -notmatch [regex]::Escape($_)) { throw "Comportamento obrigatório ausente: $_" }
}

Write-Output 'OK: interface e comportamentos obrigatórios validados.'
