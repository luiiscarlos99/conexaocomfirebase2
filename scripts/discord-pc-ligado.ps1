# Envia aviso no Discord quando o PC liga / usuário faz logon.
# Uso: agende no Task Scheduler (ver instalar-tarefa-startup.ps1)

$ErrorActionPreference = 'Stop'

$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir 'discord-pc-ligado.config.ps1'

if (-not (Test-Path $configPath)) {
    Write-Error "Arquivo de config não encontrado: $configPath`nCopie discord-pc-ligado.config.example.ps1 para discord-pc-ligado.config.ps1"
    exit 1
}

. $configPath

if ([string]::IsNullOrWhiteSpace($DiscordWebhookUrl)) {
    Write-Error 'DiscordWebhookUrl não configurado em discord-pc-ligado.config.ps1'
    exit 1
}

function Test-InternetReady {
    try {
        return Test-Connection -ComputerName '1.1.1.1' -Count 1 -Quiet -ErrorAction Stop
    } catch {
        return $false
    }
}

function Send-DiscordWebhookUtf8 {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [Parameter(Mandatory = $true)][hashtable]$Payload
    )

    $json = $Payload | ConvertTo-Json -Depth 6 -Compress
    $bytes = $Utf8NoBom.GetBytes($json)
    Invoke-WebRequest -Uri $Url -Method Post -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing | Out-Null
}

$redeOk = $false
for ($t = 0; $t -lt 24; $t++) {
    if (Test-InternetReady) {
        $redeOk = $true
        break
    }
    Start-Sleep -Seconds 5
}

if (-not $redeOk) {
    Write-Warning 'Rede indisponível — aviso Discord não enviado.'
    exit 2
}

$agora = Get-Date -Format 'dd/MM/yyyy HH:mm:ss'
$usuario = $env:USERNAME
$computador = $env:COMPUTERNAME
$so = (Get-CimInstance Win32_OperatingSystem).Caption

try {
    $ultimoBoot = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
    $tempoLigado = (Get-Date) - $ultimoBoot
    $uptimeTexto = '{0}d {1}h {2}m' -f $tempoLigado.Days, $tempoLigado.Hours, $tempoLigado.Minutes
} catch {
    $uptimeTexto = 'n/d'
}

$descricao = @(
    'Possível retorno após queda de energia ou reinício.'
    ''
    "**Computador:** ``$computador``"
    "**Usuário:** ``$usuario``"
    "**Sistema:** $so"
    "**Horário:** $agora"
    "**Tempo desde o boot:** $uptimeTexto"
) -join [Environment]::NewLine

$payload = @{
    username = 'Monitor PC'
    embeds = @(
        @{
            title = '🟢 PC ligado / logon detectado'
            description = $descricao
            color = 5763719
            timestamp = (Get-Date).ToUniversalTime().ToString('o')
        }
    )
}

if ($EnviarSilencioso) {
    $payload.flags = 4096
}

try {
    Send-DiscordWebhookUtf8 -Url $DiscordWebhookUrl -Payload $payload
    Write-Host "Aviso enviado ao Discord ($computador @ $agora)"
    exit 0
} catch {
    Write-Error "Falha ao enviar webhook: $_"
    exit 3
}
