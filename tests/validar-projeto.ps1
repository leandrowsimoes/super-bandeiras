$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$required = @(
    'index.html',
    'css\estilo.css',
    'js\paises.js',
    'js\musica.js',
    'js\jogo.js',
    'fontes\fredoka.woff2',
    'fontes\nunito.woff2'
)

$missing = $required | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $root $_))
}
if ($missing) {
    throw "Arquivos obrigatórios ausentes: $($missing -join ', ')"
}

$flags = Get-ChildItem -LiteralPath (Join-Path $root 'bandeiras') -Filter '*.png'
if ($flags.Count -ne 163) {
    throw "Esperadas 163 bandeiras; encontradas $($flags.Count)."
}

$countriesSource = Get-Content -Raw -LiteralPath (Join-Path $root 'js\paises.js')
$codes = [regex]::Matches($countriesSource, 'codigo:\s*"([a-z]{2})"') | ForEach-Object {
    $_.Groups[1].Value
}
if ($codes.Count -ne 163) {
    throw "Esperados 163 países; encontrados $($codes.Count)."
}

$missingFlags = $codes | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $root "bandeiras\$_.png"))
}
if ($missingFlags) {
    throw "Bandeiras ausentes: $($missingFlags -join ', ')"
}

Write-Output 'OK: estrutura e 163 bandeiras validadas.'
