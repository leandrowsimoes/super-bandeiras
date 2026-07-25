$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root 'assets'
$svg = Join-Path $assets 'icone-super-bandeiras.svg'
$png = Join-Path $assets 'icone-super-bandeiras.png'
$ico = Join-Path $assets 'icone-super-bandeiras.ico'
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'Super Bandeiras!.lnk'

foreach ($asset in @($svg, $png, $ico)) {
    if (-not (Test-Path -LiteralPath $asset)) {
        throw "Ativo ausente: $asset"
    }
}

if (-not (Test-Path -LiteralPath $shortcutPath)) {
    throw "Atalho ausente: $shortcutPath"
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$expectedTarget = Join-Path $root 'index.html'
if ($shortcut.TargetPath -ne $expectedTarget) {
    throw "Destino incorreto: $($shortcut.TargetPath)"
}
if ($shortcut.WorkingDirectory -ne $root) {
    throw "Diretório de trabalho incorreto: $($shortcut.WorkingDirectory)"
}
if (($shortcut.IconLocation -split ',')[0] -ne $ico) {
    throw "Ícone incorreto: $($shortcut.IconLocation)"
}

Write-Output "OK: ícone e atalho validados em $shortcutPath"
