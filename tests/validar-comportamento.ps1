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

@('tela-niveis', 'tela-mapa', 'tela-passaporte', 'tela-minijogos', 'tela-memoria', 'tela-relampago', 'btn-pequeno', 'btn-lupa', 'btn-dica', 'curiosidade', 'btn-proxima', 'efeitos', 'transicao') | ForEach-Object {
    if ($html -notmatch ('id="' + [regex]::Escape($_) + '"')) { throw "ID da versão profissional ausente: $_" }
}

$gameSource = @('quiz.js', 'app.js', 'progresso.js') | ForEach-Object {
    Get-Content -Raw -LiteralPath (Join-Path $root "js\$_")
}
$gameSource = $gameSource -join "`n"
@('function calcularPontos', 'vb_pontos_', "addEventListener('error'", 'Resposta certa', 'Sua escolha', 'vb_carimbos', 'vb_campanha') | ForEach-Object {
    if ($gameSource -notmatch [regex]::Escape($_)) { throw "Comportamento obrigatório ausente: $_" }
}

Write-Output 'OK: interface e comportamentos obrigatórios validados.'
