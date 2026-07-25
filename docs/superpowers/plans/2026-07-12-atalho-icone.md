# Atalho e Ícone do Super Bandeiras! Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um ícone cartoon próprio e um atalho funcional do Super Bandeiras! na Área de Trabalho.

**Architecture:** Um SVG determinístico será a fonte visual, convertido localmente para PNG e ICO multirresolução. Um `.lnk` padrão do Windows apontará para o `index.html` e usará o ICO salvo no projeto.

**Tech Stack:** SVG, Python/Pillow para conversão, Windows Script Host via PowerShell para o atalho.

---

### Task 1: Criar e validar o ícone

**Files:**
- Create: `assets/icone-super-bandeiras.svg`
- Create: `assets/icone-super-bandeiras.png`
- Create: `assets/icone-super-bandeiras.ico`
- Test: `tests/validar-atalho.ps1`

- [ ] Criar primeiro `tests/validar-atalho.ps1`, exigindo os três arquivos, PNG 1024×1024 e ICO com quadros 16, 24, 32, 48, 64, 128 e 256.
- [ ] Executar o teste e confirmar falha por ativos ausentes.
- [ ] Desenhar SVG quadrado com fundo azul-claro, globo sorridente, capa vermelha, estrela amarela e contornos azul-escuro, sem texto.
- [ ] Renderizar PNG 1024×1024 e gerar ICO multirresolução com Pillow.
- [ ] Executar o teste e confirmar que os ativos passam.

### Task 2: Criar e validar o atalho

**Files:**
- Create: `%USERPROFILE%\Desktop\Super Bandeiras!.lnk`
- Modify: `tests/validar-atalho.ps1`

- [ ] Acrescentar ao teste a leitura do `.lnk`, exigindo `TargetPath` igual a `D:\Jogo Bandeiras 2.0\index.html`, `WorkingDirectory` igual à pasta do jogo e `IconLocation` apontando para o novo ICO.
- [ ] Executar o teste e confirmar falha por atalho ausente.
- [ ] Criar o `.lnk` com `WScript.Shell.CreateShortcut` usando nome e propriedades especificados.
- [ ] Executar novamente a validação e confirmar todos os checks verdes.
