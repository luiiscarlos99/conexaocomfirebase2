# Abre Chrome + Opera com abas cacadas e invasor para cada conta configurada.
# Requer Inject Code com auto-run (atkSOS + atkInvSOS) ja configurado em cada navegador.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\abrir-contas-jogo.ps1
#   powershell -ExecutionPolicy Bypass -File .\abrir-contas-jogo.ps1 -Origem auto

param(
    [ValidateSet('manual', 'auto')]
    [string]$Origem = 'manual',
    [switch]$DevTools
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir 'discord-webhook.ps1')

$configPath = Join-Path $scriptDir 'contas-jogo.config.ps1'

if (-not (Test-Path $configPath)) {
    Write-Error "Config nao encontrado: $configPath`nCopie contas-jogo.config.example.ps1 para contas-jogo.config.ps1"
}

. $configPath

if (-not (Get-Variable -Name 'AbrirDevTools' -Scope Script -ErrorAction SilentlyContinue)) {
    $script:AbrirDevTools = $false
} else {
    $script:AbrirDevTools = [bool]$AbrirDevTools
}

if ($DevTools) {
    $script:AbrirDevTools = $true
}

if (-not (Get-Variable -Name 'AvisarDiscordStart' -Scope Script -ErrorAction SilentlyContinue)) {
    $AvisarDiscordStart = $true
}
if (-not (Get-Variable -Name 'DiscordStartSilencioso' -Scope Script -ErrorAction SilentlyContinue)) {
    $DiscordStartSilencioso = $false
}

function Get-DiscordWebhookStart {
    if (-not [string]::IsNullOrWhiteSpace($DiscordWebhookUrl)) {
        return $DiscordWebhookUrl
    }

    return Get-DiscordWebhookGeral -ScriptDir $scriptDir
}

function Send-DiscordStartAviso {
    param(
        [string[]]$ContasAbertas,
        [string[]]$ContasIgnoradas,
        [string]$OrigemStart
    )

    if (-not $AvisarDiscordStart) { return }

    $webhook = Get-DiscordWebhookStart
    if ([string]::IsNullOrWhiteSpace($webhook)) {
        Write-Warning 'Discord: webhook nao configurado - aviso de start ignorado.'
        return
    }

    $agora = Get-Date -Format 'dd/MM/yyyy HH:mm:ss'
    $computador = $env:COMPUTERNAME
    $usuario = $env:USERNAME
    $origemTexto = if ($OrigemStart -eq 'auto') {
        'Auto-start (~5 min apos logon)'
    } else {
        'Atalho manual'
    }

    $txtIntro = U8 0x4E,0x61,0x76,0x65,0x67,0x61,0x64,0x6F,0x72,0x65,0x73,0x20,0x61,0x62,0x65,0x72,0x74,0x6F,0x73,0x20,0x63,0x6F,0x6D,0x20,0x62,0x6F,0x74,0x5F,0x6D,0x6F,0x64,0x6F,0x20,0x28,0x63,0x61,0xC3,0xA7,0x61,0x64,0x61,0x73,0x2F,0x69,0x6E,0x76,0x61,0x73,0x6F,0x72,0x29,0x2E
    $lblNivel = U8 0x4E,0xC3,0xAD,0x76,0x65,0x6C,0x20,0x63,0x61,0xC3,0xA7,0x61,0x64,0x61,0x73
    $lblUsuario = U8 0x55,0x73,0x75,0xC3,0xA1,0x72,0x69,0x6F
    $lblHorario = U8 0x48,0x6F,0x72,0xC3,0xA1,0x72,0x69,0x6F

    $linhasContas = foreach ($nome in $ContasAbertas) {
        "- $nome"
    }
    if ($ContasIgnoradas.Count -gt 0) {
        $linhasContas += ''
        $linhasContas += '**Nao abertas:**'
        foreach ($nome in $ContasIgnoradas) {
            $linhasContas += "- $nome"
        }
    }

    $descricao = @(
        $txtIntro
        ''
        "**Origem:** $origemTexto"
        "**Contas:**"
        ($linhasContas -join [Environment]::NewLine)
        ''
        "**${lblNivel}:** $NivelCacadas"
        "**Computador:** ``$computador``"
        "**${lblUsuario}:** ``$usuario``"
        "**${lblHorario}:** $agora"
    ) -join [Environment]::NewLine

    $payload = @{
        username = 'Shadow of Shinobi'
        embeds = @(
            @{
                title = 'Contas iniciadas'
                description = $descricao
                color = 3447003
                timestamp = (Get-Date).ToUniversalTime().ToString('o')
            }
        )
    }

    if ($DiscordStartSilencioso) {
        $payload.flags = 4096
    } elseif (Get-DiscordGeralSilencioso -ScriptDir $scriptDir) {
        $payload.flags = 4096
    }

    try {
        Send-DiscordWebhookUtf8 -Url $webhook -Payload $payload
        Write-Host 'Aviso enviado ao Discord.' -ForegroundColor Green
    } catch {
        Write-Warning "Falha ao enviar aviso Discord: $_"
    }
}

function Get-BotModoConta {
    param([hashtable]$Conta)

    if ($Conta.BotModo -eq 'cacadas' -or $Conta.BotModo -eq 'invasor') {
        return $Conta.BotModo
    }

    # Compat: contas antigas sem BotModo - padrao cacadas
    return 'cacadas'
}

function Test-ContaTemCredenciais {
    param(
        [string]$Usuario,
        [string]$Senha
    )

    return -not [string]::IsNullOrWhiteSpace($Usuario) -and
        -not [string]::IsNullOrWhiteSpace($Senha) -and
        ($Senha -notlike 'PREENCHER*')
}

function Get-UrlLogin {
    param(
        [string]$Base,
        [string]$Usuario,
        [string]$Senha,
        [string]$Nivel,
        [string]$BotModo
    )

    if (-not (Test-ContaTemCredenciais -Usuario $Usuario -Senha $Senha)) {
        return $null
    }

    $root = $Base.TrimEnd('/')
    # Fase 1: sempre invasor nas 3 contas (login + ir para /invasor)
    $q = [ordered]@{
        bot_modo = 'invasor'
        bot_user = $Usuario
        bot_pass = $Senha
        bot_nivel = $Nivel
    }

    $pairs = foreach ($key in $q.Keys) {
        '{0}={1}' -f $key, [uri]::EscapeDataString([string]$q[$key])
    }

    return '{0}/?{1}' -f $root, ($pairs -join '&')
}

function Get-UrlPortaoCacadas {
    param([string]$Base)

    # Portao de timing (ultimo ataque) - bot redireciona para /cacadas quando liberado
    return '{0}/mensagens?tab=relatorios_ataque&bot_modo=cacadas' -f $Base.TrimEnd('/')
}

function Get-UrlCacadas {
    param([string]$Base)

    return Get-UrlPortaoCacadas -Base $Base
}

function Get-UrlJogo {
    param(
        [string]$Base,
        [string]$Usuario,
        [string]$Senha,
        [string]$Nivel,
        [string]$BotModo
    )

    if (-not (Test-ContaTemCredenciais -Usuario $Usuario -Senha $Senha)) {
        if ($BotModo -eq 'cacadas') {
            return Get-UrlCacadas -Base $Base
        }
        return Get-UrlInvasor -Base $Base
    }

    $root = $Base.TrimEnd('/')
    $q = [ordered]@{
        bot_modo = $BotModo
        bot_user = $Usuario
        bot_pass = $Senha
        bot_nivel = $Nivel
    }

    $pairs = foreach ($key in $q.Keys) {
        '{0}={1}' -f $key, [uri]::EscapeDataString([string]$q[$key])
    }
    $qs = $pairs -join '&'

    # Fase 2 cacadas: portao relatorios_ataque - valida ultimo ataque antes de /cacadas
    if ($BotModo -eq 'cacadas') {
        return '{0}/mensagens?tab=relatorios_ataque&{1}' -f $root, $qs
    }

    # Invasor: home com params (login/redirect seguro)
    return '{0}/?{1}' -f $root, $qs
}

function Get-UrlInvasor {
    param([string]$Base)

    return '{0}/invasor?bot_modo=invasor' -f $Base.TrimEnd('/')
}

function Resolve-BrowserExe {
    param([string]$ExePath)

    if ([string]::IsNullOrWhiteSpace($ExePath)) {
        return $ExePath
    }

    $dir = Split-Path -Parent $ExePath
    $launcher = Join-Path $dir 'launcher.exe'

    if ((Split-Path -Leaf $ExePath) -match '(?i)opera' -and (Test-Path $launcher)) {
        return $launcher
    }

    return $ExePath
}

function Get-ContaModoAnonimo {
    param([hashtable]$Conta)

    # Chrome sempre anonimo - evita cache de JS antigo no perfil normal
    if ($Conta.Exe -imatch 'chrome') { return $true }
    return [bool]$Conta.Anonimo
}

function Get-BrowserArgs {
    param(
        [hashtable]$Conta,
        [ValidateSet('Login', 'Jogo')]
        [string]$Fase = 'Login'
    )

    $ehOpera = $Conta.Exe -match '(?i)opera'
    $anonimo = Get-ContaModoAnonimo -Conta $Conta

    # Fase 2 anonimo Opera: --private sem --new-window -> nova aba na janela privada existente
    if ($Fase -eq 'Jogo' -and $anonimo -and $ehOpera) {
        return @('--private')
    }

    # Fase 2 Chrome anonimo: --incognito obrigatorio (args vazios abriam perfil normal)
    if ($Fase -eq 'Jogo' -and $anonimo -and $Conta.Exe -imatch 'chrome') {
        return @('--incognito')
    }

    # Fase 2 anonimo (outros): nova aba na janela anonima existente
    if ($Fase -eq 'Jogo' -and $anonimo) {
        return @()
    }

    $args = @()
    if ($anonimo) {
        if ($Conta.Exe -imatch 'chrome') {
            $args += '--incognito'
            $args += '--new-window'
        } elseif ($ehOpera) {
            # Opera: --private ANTES da URL; --new-window se Opera normal ja estiver aberto
            $args += '--private'
            $args += '--new-window'
        } else {
            $args += '--private'
        }
    }

    return $args
}

function Start-NavegadorComUrl {
    param(
        [string]$ExePath,
        [string[]]$ArgsBrowser,
        [string]$Url
    )

    $exe = Resolve-BrowserExe -ExePath $ExePath
    $lista = @($ArgsBrowser | Where-Object { $_ }) + @($Url)
    Start-Process -FilePath $exe -ArgumentList $lista | Out-Null
}

function Add-ContasLista {
    param(
        [System.Collections.ArrayList]$Destino,
        [object]$Itens
    )

    foreach ($item in @($Itens)) {
        if ($null -ne $item) {
            [void]$Destino.Add($item)
        }
    }
}

function Open-NavegadorUrl {
    param(
        [hashtable]$Conta,
        [string]$Url,
        [ValidateSet('Login', 'Jogo')]
        [string]$Fase = 'Login'
    )

    $exe = $Conta.Exe
    if (-not (Test-Path $exe)) {
        Write-Warning "Executavel nao encontrado ($($Conta.Rotulo)): $exe"
        return $false
    }

    $args = Get-BrowserArgs -Conta $Conta -Fase $Fase
    $botModo = Get-BotModoConta -Conta $Conta
    $rotulo = if ($Fase -eq 'Login') { 'Login' } else { 'Jogo' }
    $modoLog = if ($Fase -eq 'Login') { 'invasor' } else { $botModo }

    Write-Host "  $rotulo [$($Conta.Rotulo) | bot_modo=$modoLog]" -ForegroundColor Cyan
    if ($Fase -eq 'Jogo' -and (Get-ContaModoAnonimo -Conta $Conta) -and $Conta.Exe -match '(?i)opera') {
        Write-Host '    (fase 2 anon: --private + URL na janela privada existente)' -ForegroundColor DarkGray
    }
    if ($Fase -eq 'Jogo' -and (Get-ContaModoAnonimo -Conta $Conta) -and $Conta.Exe -imatch 'chrome') {
        Write-Host '    (fase 2 anon: --incognito + URL na sessao incognito)' -ForegroundColor DarkGray
    }
    Write-Host "    $Url"
    if ($Conta.Exe -match '(?i)opera') {
        $exeResolvido = Resolve-BrowserExe -ExePath $exe
        if ($exeResolvido -ne $exe) {
            Write-Host "    exe: $exeResolvido" -ForegroundColor DarkGray
        }
    }

    Start-NavegadorComUrl -ExePath $exe -ArgsBrowser $args -Url $Url
    return $true
}

Write-Host ''
Write-Host '=== Shadow of Shinobi - abrir contas ===' -ForegroundColor Green
Write-Host ''

$esperaLogin = if ($IntervaloAposSetup) { $IntervaloAposSetup } else { 60 }
$esperaAntesPrimeira = if (Get-Variable -Name 'IntervaloAntesPrimeiraConta' -Scope Script -ErrorAction SilentlyContinue) {
    [int]$IntervaloAntesPrimeiraConta
} else { 5 }
$esperaAposPrimeira = if (Get-Variable -Name 'IntervaloAposPrimeiraConta' -Scope Script -ErrorAction SilentlyContinue) {
    [int]$IntervaloAposPrimeiraConta
} else { 8 }
$contasAbertas = @()
$contasIgnoradas = @()

$contasLogin = @($Contas | Where-Object {
    Test-ContaTemCredenciais -Usuario $_.Usuario -Senha $_.Senha
})

# Opera anonimo ANTES do Opera normal (Shizuo), senao --private perde a URL
$contasLoginOrdenadas = @(
    @($contasLogin | Where-Object { $_.Exe -notmatch '(?i)opera' })
) + @(
    @($contasLogin | Where-Object { $_.Anonimo -and $_.Exe -match '(?i)opera' })
) + @(
    @($contasLogin | Where-Object { -not $_.Anonimo -and $_.Exe -match '(?i)opera' })
)

# --- Fase 1: abas de login (todas as contas com senha) ---
if ($contasLoginOrdenadas.Count -gt 0) {
    Write-Host '--- Fase 1: login (bot_modo=invasor nas 3 contas) ---' -ForegroundColor Green
    Write-Host '  Shizuo/Sora/Shiroe logam aqui; cacadas abre na fase 2.' -ForegroundColor DarkGray
    Write-Host '  Sora (Opera anon) abre antes do Opera normal - --private --new-window + launcher.exe' -ForegroundColor DarkGray
    Write-Host '  Chrome (Shiroe) sempre anonimo - --incognito --new-window na fase 1.' -ForegroundColor DarkGray
    if ($esperaAntesPrimeira -gt 0) {
        Write-Host "  Aguardando ${esperaAntesPrimeira}s antes da 1a aba..." -ForegroundColor DarkGray
        Start-Sleep -Seconds $esperaAntesPrimeira
    }
    $i = 0
    foreach ($conta in $contasLoginOrdenadas) {
        if ($i -gt 0) {
            $esperaEntre = $IntervaloEntreContas
            if ($null -eq $esperaEntre -or $esperaEntre -lt 0) { $esperaEntre = 0 }
            if ($i -eq 1) {
                $esperaEntre = [Math]::Max($esperaEntre, $esperaAposPrimeira)
            }
            if ($esperaEntre -gt 0) {
                Start-Sleep -Seconds $esperaEntre
            }
        }

        if ($conta.Anonimo -and ($conta.Senha -like 'PREENCHER*' -or [string]::IsNullOrWhiteSpace($conta.Senha))) {
            Write-Warning "$($conta.Rotulo): modo anonimo sem senha no config - login pode falhar."
        }

        $botModo = Get-BotModoConta -Conta $conta
        $urlLogin = Get-UrlLogin -Base $UrlBase -Usuario $conta.Usuario -Senha $conta.Senha -Nivel $NivelCacadas -BotModo $botModo

        if (Open-NavegadorUrl -Conta $conta -Url $urlLogin -Fase Login) {
            if ($contasAbertas -notcontains $conta.Rotulo) {
                $contasAbertas += $conta.Rotulo
            }
        } else {
            if ($contasIgnoradas -notcontains $conta.Rotulo) {
                $contasIgnoradas += $conta.Rotulo
            }
        }

        $i++
    }

    Write-Host ''
    Write-Host "Aguardando ${esperaLogin}s para o bot concluir os logins..." -ForegroundColor DarkGray
    Start-Sleep -Seconds $esperaLogin
    Write-Host ''
}

# --- Fase 2: cacadas (Sora anon, Shizuo, Shiroe) - mesma ordem da fase 1 ---
$contasFase2Lista = [System.Collections.ArrayList]@()
Add-ContasLista -Destino $contasFase2Lista -Itens ($Contas | Where-Object { $_.Anonimo -and $_.Exe -match '(?i)opera' })
Add-ContasLista -Destino $contasFase2Lista -Itens ($Contas | Where-Object { -not $_.Anonimo -and $_.Exe -match '(?i)opera' })
Add-ContasLista -Destino $contasFase2Lista -Itens ($Contas | Where-Object { $_.Exe -notmatch '(?i)opera' })

$rotulosFase2 = @{}
$contasFase2 = @($contasFase2Lista | Where-Object {
    if ($rotulosFase2[$_.Rotulo]) { return $false }
    $rotulosFase2[$_.Rotulo] = $true
    return $true
})

if ($contasFase2.Count -gt 0) {
    Write-Host '--- Fase 2: jogo (BotModo de cada conta) ---' -ForegroundColor Green
    Write-Host '  Chrome fase 2: --incognito + /mensagens?tab=relatorios_ataque&bot_modo=cacadas&...' -ForegroundColor DarkGray
    Write-Host '  Opera anon: --private na janela privada existente' -ForegroundColor DarkGray

    $i = 0
    foreach ($conta in $contasFase2) {
        if ($i -gt 0 -and $IntervaloEntreContas -gt 0) {
            Start-Sleep -Seconds $IntervaloEntreContas
        }

        $botModo = Get-BotModoConta -Conta $conta
        $urlJogo = Get-UrlJogo -Base $UrlBase -Usuario $conta.Usuario -Senha $conta.Senha -Nivel $NivelCacadas -BotModo $botModo

        if (Open-NavegadorUrl -Conta $conta -Url $urlJogo -Fase Jogo) {
            if ($contasAbertas -notcontains $conta.Rotulo) {
                $contasAbertas += $conta.Rotulo
            }
        } else {
            if ($contasIgnoradas -notcontains $conta.Rotulo) {
                $contasIgnoradas += $conta.Rotulo
            }
        }

        $i++
    }
} elseif ($contasLogin.Count -eq 0) {
    Write-Host '--- Fase 2 ---' -ForegroundColor Yellow
    Write-Host '  Nenhuma conta configurada para fase 2.' -ForegroundColor Yellow
}

Send-DiscordStartAviso -ContasAbertas $contasAbertas -ContasIgnoradas $contasIgnoradas -OrigemStart $Origem

Write-Host ''
Write-Host 'Pronto. Fase 1 = login invasor | 60s | Fase 2 = portao cacadas (relatorios_ataque) -> cacadas.' -ForegroundColor Green
Write-Host 'Edite BotModo e senhas em contas-jogo.config.ps1 se necessario.' -ForegroundColor Yellow
Write-Host ''
